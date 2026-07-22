-- ─────────────────────────────────────────────────────────────────────────────
-- dashboard_stats(): PODA dos contadores de topo
--
-- O dono pediu um Dashboard só com os cartões QUE TÊM META. Os três cartões
-- operacionais ("Consultas hoje", "A confirmar", "Pacientes ativos") saíram da
-- tela, e com eles o último consumidor dos quatro contadores de topo:
--
--     appointments_today · active_patients · pending_confirmations · monthly_revenue
--
-- A partir daqui a RPC devolve SÓ o objeto `metrics`, INTACTO — as mesmas
-- quatro métricas (appointments_scheduled, appointments_completed, revenue,
-- expenses), cada uma com current/previous/target, com as mesmas definições e
-- os mesmos recortes de 20260722220000_goal_metric_four.sql. Nada de métrica
-- muda de sentido nesta migration; o que muda é só o que NÃO é mais devolvido.
--
-- PROVA DE QUE NINGUÉM MAIS CONSOME (feita antes de podar, `grep -rn` no src/
-- inteiro pelos quatro nomes snake_case e pelos quatro camelCase):
--   · src/services/appointmentsService.ts — DashboardStatsRow + as conversões
--     (appointmentsToday/activePatients/pendingConfirmations/monthlyRevenue).
--   · src/types/domain.ts — os quatro campos de DashboardStats.
--   · src/pages/Dashboard/DashboardPage.tsx — os três StatsCards.
--   Os três foram limpos no mesmo commit desta migration. Fora deles, ZERO
--   ocorrências no src/ — nenhuma outra tela, hook, service ou teste lia esses
--   nomes. (monthly_revenue já era, além disso, o mesmo número que
--   metrics.revenue.current: a duplicação assumida em 20260722190000 morre aqui.)
--
-- O QUE A PODA ECONOMIZA POR CARGA DO DASHBOARD:
--   · a varredura de public.patient (active_patients) — some inteira;
--   · a varredura de public.appointment do futuro sem teto
--     (pending_confirmations) — some inteira;
--   · um `count(*) filter` a menos na varredura de consultas (appointments_today
--     saía da mesma passada, então some o agregado, não a varredura);
--   · monthly_revenue não custava nada: era v_revenue_cur reaproveitado, que
--     continua sendo calculado para metrics.revenue.
--   Ou seja: DUAS varreduras de tabela a menos, mais um agregado.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.dashboard_stats()
returns jsonb
language plpgsql
stable
set search_path = ''
as $function$
declare
  v_today        date := private.clinic_today();
  -- As três bordas do mês, calculadas UMA vez. Intervalo semiaberto
  -- [início, próximo) em toda parte: `< primeiro dia do mês que vem` não tem o
  -- bug de fim de mês que `<= último dia` tem.
  v_month_start  date := date_trunc('month', v_today)::date;
  v_next_start   date := (date_trunc('month', v_today) + interval '1 month')::date;
  v_prev_start   date := (date_trunc('month', v_today) - interval '1 month')::date;

  -- Recorte da meta: o MESMO "hoje" que recorta os numeradores, para que o
  -- numerador e o denominador do cartão nunca falem de meses diferentes na
  -- virada do mês. 1..12, que é o subscript de clinic_goal.monthly.
  v_year         int  := extract(year  from v_today)::int;
  v_month        int  := extract(month from v_today)::int;

  v_sched_cur    bigint;
  v_sched_prev   bigint;
  v_done_cur     bigint;
  v_done_prev    bigint;
  v_revenue_cur  numeric;
  v_revenue_prev numeric;
  v_expense_cur  numeric;
  v_expense_prev numeric;
  v_targets      jsonb;
begin
  -- ── CONSULTAS ──────────────────────────────────────────────────────────────
  -- Uma varredura só para os quatro números, com FILTER. A janela
  -- [v_prev_start, v_next_start) cobre mês corrente e mês anterior, que é tudo
  -- o que as duas métricas comparam, e o filtro casa com o índice
  -- (clinic_id, date).
  --
  -- `status <> 'canceled'` na cláusula comum é a definição de AGENDADA: a
  -- desmarcada com aviso libera a cadeira e não entra na conta; o `no_show`
  -- CONTINUA contando, porque o horário foi reservado e o profissional esperou.
  -- Como 'completed' é subconjunto de "não cancelada", as REALIZADAS saem da
  -- mesma varredura só apertando o FILTER — não precisam de um segundo scan.
  select count(*) filter (where a.date >= v_month_start and a.date < v_next_start),
         count(*) filter (where a.date >= v_prev_start  and a.date < v_month_start),
         count(*) filter (where a.date >= v_month_start and a.date < v_next_start
                            and a.status = 'completed'),
         count(*) filter (where a.date >= v_prev_start  and a.date < v_month_start
                            and a.status = 'completed')
    into v_sched_cur, v_sched_prev, v_done_cur, v_done_prev
    from public.appointment a
   where a.status <> 'canceled'
     and a.date >= v_prev_start
     and a.date <  v_next_start;

  -- ── FATURAMENTO (regime de caixa, por received_at) ─────────────────────────
  -- Mesma definição de "recebido" de finance_series(): received_amount é o que
  -- de fato caiu (inclui juros/multa) e cai para net_amount quando a baixa veio
  -- sem valor (legado de importação).
  select coalesce(sum(coalesce(nullif(r.received_amount, 0), r.net_amount))
                    filter (where r.received_at >= v_month_start
                              and r.received_at <  v_next_start), 0),
         coalesce(sum(coalesce(nullif(r.received_amount, 0), r.net_amount))
                    filter (where r.received_at >= v_prev_start
                              and r.received_at <  v_month_start), 0)
    into v_revenue_cur, v_revenue_prev
    from public.receivable r
   where r.status = 'paid'
     and r.received_at >= v_prev_start
     and r.received_at <  v_next_start;

  -- ── DESPESAS (regime de caixa, por paid_at) ────────────────────────────────
  -- Espelho do faturamento: paid_amount é o que saiu de fato, amount é o
  -- combinado. Mesma expressão de finance_series() — os dois têm de bater.
  select coalesce(sum(coalesce(p.paid_amount, p.amount))
                    filter (where p.paid_at >= v_month_start
                              and p.paid_at <  v_next_start), 0),
         coalesce(sum(coalesce(p.paid_amount, p.amount))
                    filter (where p.paid_at >= v_prev_start
                              and p.paid_at <  v_month_start), 0)
    into v_expense_cur, v_expense_prev
    from public.payable p
   where p.status = 'paid'
     and p.paid_at >= v_prev_start
     and p.paid_at <  v_next_start;

  -- ── METAS: monthly[mês corrente] do ano corrente ───────────────────────────
  -- Vira um mapa {metric: valor} para que o jsonb_build_object abaixo seja uma
  -- indexação e não quatro subconsultas. `sum` + `group by` e não um simples
  -- select porque, com usuário em duas clínicas, a RLS devolve DUAS linhas por
  -- métrica — e os numeradores acima já vieram somados.
  --
  -- O `having` separa dois casos que o `sum` confunde: métrica cujo mês corrente
  -- está em branco em TODAS as clínicas visíveis some do mapa, e
  -- `v_targets -> 'x'` devolve SQL NULL. Sem ele a chave entraria valendo null e
  -- o resultado seria o mesmo JSON — mas por acidente, não por decisão.
  select coalesce(jsonb_object_agg(t.metric, t.total), '{}'::jsonb)
    into v_targets
    from (
      select g.metric::text as metric, sum(g.monthly[v_month]) as total
        from public.clinic_goal g
       where g.year = v_year
       group by g.metric
      having count(g.monthly[v_month]) > 0
    ) t;

  -- ── AS QUATRO MÉTRICAS COM META — E NADA MAIS ────────────────────────────
  -- `metrics` é agora a única chave do retorno. target vem de `->`, que devolve
  -- SQL NULL quando a métrica não tem meta no mês — e SQL NULL vira `null` no
  -- JSON. "Sem meta" é null explícito, nunca 0: um zero seria lido como "meta
  -- batida em 100%" logo na primeira consulta. (Um 0 GRAVADO de propósito
  -- continua chegando como 0 — ver o comentário de clinic_goal.monthly sobre
  -- divisão por zero no front.)
  return jsonb_build_object(
    'metrics', jsonb_build_object(
      -- Mês corrente, status <> 'canceled'.
      'appointments_scheduled', jsonb_build_object(
        'current',  v_sched_cur,
        'previous', v_sched_prev,
        'target',   v_targets -> 'appointments_scheduled'
      ),
      -- Mês corrente, status = 'completed'. Sempre <= agendadas; a diferença é
      -- o que ainda vai acontecer no mês mais os no_show.
      'appointments_completed', jsonb_build_object(
        'current',  v_done_cur,
        'previous', v_done_prev,
        'target',   v_targets -> 'appointments_completed'
      ),
      'revenue', jsonb_build_object(
        'current',  v_revenue_cur,
        'previous', v_revenue_prev,
        'target',   v_targets -> 'revenue'
      ),
      'expenses', jsonb_build_object(
        'current',  v_expense_cur,
        'previous', v_expense_prev,
        'target',   v_targets -> 'expenses'
      )
    )
  );
end;
$function$;

comment on function public.dashboard_stats() is
  'Números do Dashboard numa chamada. Devolve UMA chave, `metrics`, com as '
  'QUATRO métricas que aceitam meta — appointments_scheduled, '
  'appointments_completed, revenue e expenses — cada uma com current (mês '
  'corrente), previous (mês anterior) e target (clinic_goal.monthly[mês '
  'corrente] do ano corrente, null quando não há meta). Agendadas = status <> '
  'canceled; realizadas = status = completed; ambas pela coluna date. '
  'revenue/expenses são dinheiro em regime de CAIXA (received_at / paid_at). '
  'Os contadores de topo sem comparativo (appointments_today, active_patients, '
  'pending_confirmations, monthly_revenue) foram REMOVIDOS em 20260722230000: o '
  'dono pediu um Dashboard só de cartões com meta, e eles ficaram sem nenhum '
  'consumidor. Todo recorte usa private.clinic_today() e intervalo semiaberto. '
  'Multi-tenant pela RLS das tabelas de origem.';
