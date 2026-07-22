-- ─────────────────────────────────────────────────────────────────────────────
-- METAS: as QUATRO métricas definitivas
--
-- O desenho de 20260722210000_clinic_goal_monthly.sql continua inteiro (uma
-- linha por clinic_id+metric+year, os 12 meses no vetor `monthly`). O que muda
-- aqui é EXCLUSIVAMENTE o conjunto de métricas que aceitam meta:
--
--     antes:  appointments | active_patients | revenue | expenses
--     agora:  appointments_scheduled | appointments_completed | revenue | expenses
--
-- Três movimentos, e o do meio é o único que perde informação:
--   · `appointments` → `appointments_scheduled` — RENOME, não redefinição. A
--     regra de contagem é a MESMA que `appointments` já tinha (mês corrente,
--     status <> 'canceled'); só o nome ficou honesto agora que existe uma
--     segunda métrica de consulta ao lado.
--   · `active_patients` SAI. Continua no TOPO de dashboard_stats() como
--     contador, só deixa de ser uma coisa que se define meta. Era a única
--     métrica de ESTOQUE no meio de três de FLUXO: "meta de 500 pacientes
--     ativos em julho" nunca disse se era o saldo no dia 31 ou o pico do mês, e
--     a RPC já entregava `previous: null` porque não há histórico de status.
--   · `appointments_completed` NASCE.
--
-- SEMÂNTICA DAS DUAS MÉTRICAS DE CONSULTA (decidida pelo dono, repetida aqui
-- porque é ela que o resto do arquivo implementa):
--   · agendadas  = data no mês corrente e status <> 'canceled'.
--     Não é "tudo que foi marcado": é o volume de agenda que SE SUSTENTOU. A
--     desmarcada com aviso libera a cadeira e não conta. O `no_show` CONTA — o
--     horário foi reservado e o profissional esperou.
--   · realizadas = data no mês corrente e status = 'completed'.
--   A diferença entre as duas é o que ainda vai acontecer no mês (scheduled,
--   confirmed, in_service) MAIS as faltas (no_show). É essa diferença que dá
--   sentido a ter as duas no mesmo painel.
--
-- Enum real de referência:
--   public.appointment_status = scheduled|confirmed|in_service|completed|canceled|no_show
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · O ENUM
--
-- Postgres não remove valor de enum, então o caminho é tipo novo → converte a
-- coluna → dropa o antigo → renomeia. Levantamento de dependências feito ANTES
-- (pg_depend sobre o tipo e sobre goal_metric[]): o tipo é referenciado em UM
-- lugar só, `column metric of table clinic_goal`. Sem default na coluna, sem
-- ACL própria no tipo, sem view/domain/índice de expressão e sem função com
-- goal_metric na ASSINATURA (set_clinic_goals_year só cita o nome do tipo
-- dentro do corpo plpgsql, que é texto resolvido em tempo de execução e volta a
-- casar assim que o rename acontece). A unique (clinic_id, metric, year) é
-- reconstruída sozinha pelo ALTER COLUMN TYPE.
-- ─────────────────────────────────────────────────────────────────────────────

-- GUARD — aborta antes de converter qualquer coisa que seria adivinhação.
--
-- Nota sobre o escopo deste guard: a instrução original era "aborte se houver
-- QUALQUER linha", partindo de que clinic_goal estivesse vazia. Ela NÃO está —
-- tem uma linha (metric='revenue', year=2006, monthly com 12 zeros, resíduo de
-- teste). Abortar nela seria travar a migration por um caso que não tem
-- ambiguidade nenhuma: 'revenue' vira 'revenue'. O guard foi então escrito
-- sobre o MOTIVO da regra, não sobre a letra: ele barra a linha cuja conversão
-- exigiria chutar um destino. Hoje isso é exatamente 'active_patients' — a
-- métrica que sai sem sucessora. 'appointments' tem destino declarado pelo dono
-- ('appointments_scheduled'), e revenue/expenses são identidade.
do $$
declare
  v_orphans text;
begin
  select pg_catalog.string_agg(distinct g.metric::text, ', ')
    into v_orphans
    from public.clinic_goal g
   where g.metric::text not in ('appointments', 'revenue', 'expenses');

  if v_orphans is not null then
    raise exception
      'clinic_goal tem meta(s) gravada(s) na(s) métrica(s) % , que não têm '
      'destino no enum novo. Converter para o quê seria adivinhação: decida o '
      'destino (ou apague a linha) e rode a migration de novo.', v_orphans
      using errcode = '23514';
  end if;
end
$$;

create type public.goal_metric_v2 as enum (
  'appointments_scheduled',
  'appointments_completed',
  'revenue',
  'expenses'
);

alter table public.clinic_goal
  alter column metric type public.goal_metric_v2
  using (
    case metric::text
      when 'appointments' then 'appointments_scheduled'
      else metric::text
    end
  )::public.goal_metric_v2;

drop type public.goal_metric;
alter type public.goal_metric_v2 rename to goal_metric;

comment on type public.goal_metric is
  'As QUATRO coisas que a clínica define meta. Mesmos rótulos usados como chave '
  'em dashboard_stats() -> metrics e em GOAL_METRICS no front. '
  'appointments_scheduled = consultas do mês com status <> canceled (agenda que '
  'se sustentou; no_show conta, desmarcada não). appointments_completed = '
  'consultas do mês com status = completed. A diferença entre as duas é o que '
  'ainda vai acontecer no mês mais as faltas. revenue/expenses são dinheiro em '
  'regime de CAIXA (data da baixa / do pagamento), não competência. '
  'active_patients saiu de meta em 20260722220000: era estoque no meio de três '
  'fluxos e "meta de N ativos em julho" não dizia se era saldo do dia 31 ou pico '
  'do mês; segue existindo como contador de topo da RPC.';

-- O comentário da coluna e o de `monthly` citavam a lista velha nominalmente.
comment on column public.clinic_goal.metric is
  'Qual dos quatro números do dashboard esta meta mede: appointments_scheduled, '
  'appointments_completed, revenue ou expenses. Mesmo rótulo usado como chave em '
  'dashboard_stats() -> metrics.';

comment on column public.clinic_goal.monthly is
  'Os 12 alvos do ano, em NÚMERO CRU: reais para revenue/expenses, quantidade '
  'de consultas para appointments_scheduled/appointments_completed. Índice '
  '1-based = mês (garantido por clinic_goal_monthly_shape_ck, que também impede '
  'bounds [0:11] — sem ele um vetor zero-based faria monthly[7] devolver '
  'agosto). null = mês sem meta; 0 é valor legítimo, então quem calcular "% da '
  'meta" precisa se proteger da divisão por zero. Formatação (R$, separador de '
  'milhar) é do front, em pt-BR.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · dashboard_stats()
--
-- Só o bloco `metrics` muda: perde 'appointments' e 'active_patients', ganha
-- 'appointments_scheduled' e 'appointments_completed'.
--
-- Os contadores de TOPO (appointments_today, active_patients,
-- pending_confirmations, monthly_revenue) ficam INTACTOS. Não são metas, o dono
-- não pediu para mexer neles, e são consumidos hoje por
-- src/services/appointmentsService.ts (appointmentsToday, activePatients,
-- pendingConfirmations, monthlyRevenue) — verificado antes de escrever isto.
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

  v_appt_today   bigint;
  v_sched_cur    bigint;
  v_sched_prev   bigint;
  v_done_cur     bigint;
  v_done_prev    bigint;
  v_pending      bigint;
  v_active       bigint;
  v_revenue_cur  numeric;
  v_revenue_prev numeric;
  v_expense_cur  numeric;
  v_expense_prev numeric;
  v_targets      jsonb;
begin
  -- ── CONSULTAS ──────────────────────────────────────────────────────────────
  -- Uma varredura só para os cinco números, com FILTER. Hoje ∈ mês corrente,
  -- então [v_prev_start, v_next_start) cobre todos os recortes e o filtro casa
  -- com o índice (clinic_id, date).
  --
  -- `status <> 'canceled'` na cláusula comum é a definição de AGENDADA: a
  -- desmarcada com aviso libera a cadeira e não entra na conta; o `no_show`
  -- CONTINUA contando, porque o horário foi reservado e o profissional esperou.
  -- Como 'completed' é subconjunto de "não cancelada", as REALIZADAS saem da
  -- mesma varredura só apertando o FILTER — não precisam de um segundo scan.
  select count(*) filter (where a.date = v_today),
         count(*) filter (where a.date >= v_month_start and a.date < v_next_start),
         count(*) filter (where a.date >= v_prev_start  and a.date < v_month_start),
         count(*) filter (where a.date >= v_month_start and a.date < v_next_start
                            and a.status = 'completed'),
         count(*) filter (where a.date >= v_prev_start  and a.date < v_month_start
                            and a.status = 'completed')
    into v_appt_today, v_sched_cur, v_sched_prev, v_done_cur, v_done_prev
    from public.appointment a
   where a.status <> 'canceled'
     and a.date >= v_prev_start
     and a.date <  v_next_start;

  -- Fica de FORA da varredura acima porque olha para o FUTURO sem teto (consulta
  -- marcada para dezembro conta), e não para a janela de dois meses.
  select count(*)
    into v_pending
    from public.appointment a
   where a.date >= v_today
     and a.status = 'scheduled';

  -- ── PACIENTES ATIVOS ───────────────────────────────────────────────────────
  -- Estoque: o cadastro vivo AGORA. Não é mais uma métrica de meta (saiu do
  -- enum), mas continua sendo contador de topo — é o que o front já lê.
  select count(*)
    into v_active
    from public.patient p
   where p.status = 'active';

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

  return jsonb_build_object(
    -- ── CONTADORES DE TOPO ─────────────────────────────────────────────────
    -- NÃO são metas e não têm comparativo. Preservados byte a byte (nome e
    -- tipo) porque src/services/appointmentsService.ts os lê hoje.
    'appointments_today',    v_appt_today,
    'active_patients',       v_active,
    'pending_confirmations', v_pending,
    'monthly_revenue',       v_revenue_cur,

    -- ── AS QUATRO MÉTRICAS COM META ────────────────────────────────────────
    -- target vem de `->`, que devolve SQL NULL quando a métrica não tem meta no
    -- mês — e SQL NULL vira `null` no JSON. "Sem meta" é null explícito, nunca
    -- 0: um zero seria lido como "meta batida em 100%" logo na primeira consulta.
    -- (Um 0 GRAVADO de propósito continua chegando como 0 — ver o comentário de
    -- clinic_goal.monthly sobre divisão por zero no front.)
    'metrics', jsonb_build_object(
      -- Mês corrente, status <> 'canceled'. Mesma regra que a métrica
      -- 'appointments' tinha antes do rename — nada de definição mudou aqui.
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
  'Números do Dashboard numa chamada. Devolve contadores de TOPO sem comparativo '
  '(appointments_today, active_patients, pending_confirmations, monthly_revenue) '
  'e o objeto `metrics` com as QUATRO métricas que aceitam meta — '
  'appointments_scheduled, appointments_completed, revenue e expenses — cada uma '
  'com current (mês corrente), previous (mês anterior) e target '
  '(clinic_goal.monthly[mês corrente] do ano corrente, null quando não há meta). '
  'Agendadas = status <> canceled; realizadas = status = completed; ambas pela '
  'coluna date. Todo recorte usa private.clinic_today() e intervalo semiaberto. '
  'Multi-tenant pela RLS das tabelas de origem.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · set_clinic_goals_year()
--
-- A função não tinha validação de NOME de métrica: apostava no cast
-- `v_metric::public.goal_metric` para barrar. Isso continua barrando, mas com
-- "invalid input value for enum goal_metric: ..." — que não diz quais são os
-- válidos. Com a lista mudando justamente agora (active_patients saiu,
-- appointments virou dois nomes), o front que ficar para trás vai bater aqui, e
-- o erro precisa dizer o que fazer. Resto do corpo inalterado.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.set_clinic_goals_year(p_clinic uuid, p_year integer, p_goals jsonb)
returns void
language plpgsql
set search_path = ''
as $function$
declare
  v_metric  text;
  v_values  jsonb;
  v_monthly numeric[];
begin
  if p_goals is null or pg_catalog.jsonb_typeof(p_goals) <> 'object' then
    raise exception 'p_goals precisa ser um objeto {metric: [12 valores]}; veio %',
      coalesce(pg_catalog.jsonb_typeof(p_goals), 'null')
      using errcode = '22023';
  end if;

  for v_metric, v_values in
    select e.key, e.value from pg_catalog.jsonb_each(p_goals) as e
  loop
    -- Nome da métrica. Lido do enum e não de uma lista literal: a lista de
    -- métricas válidas tem UMA fonte, que é o tipo, e este erro não pode
    -- envelhecer junto com ela.
    if not exists (
      select 1
        from pg_catalog.unnest(pg_catalog.enum_range(null::public.goal_metric)) as m
       where m::text = v_metric
    ) then
      raise exception 'métrica "%" não existe; as válidas são: %',
        v_metric,
        (select pg_catalog.string_agg(m::text, ', ' order by m)
           from pg_catalog.unnest(pg_catalog.enum_range(null::public.goal_metric)) as m)
        using errcode = '22023';
    end if;

    -- A checagem de 12 posições é repetida aqui, antes do CHECK da tabela, para
    -- que o erro diga QUAL métrica veio torta. O CHECK continua sendo a garantia
    -- de verdade — este é só o erro legível.
    if pg_catalog.jsonb_typeof(v_values) <> 'array'
       or pg_catalog.jsonb_array_length(v_values) <> 12 then
      raise exception
        'a métrica % precisa de um array com exatamente 12 posições (Jan..Dez)', v_metric
        using errcode = '22023';
    end if;

    -- `order by ord` é obrigatório: sem ele array_agg não promete a ordem dos
    -- elementos, e a matriz chegaria embaralhada — julho viraria março em
    -- silêncio. `#>> '{}'` extrai o número como texto; null do JSON vira null
    -- do SQL, que é o "mês sem meta".
    select pg_catalog.array_agg(
             case when pg_catalog.jsonb_typeof(e.v) = 'null' then null
                  else (e.v #>> '{}')::numeric end
             order by e.ord)
      into v_monthly
      from pg_catalog.jsonb_array_elements(v_values) with ordinality as e(v, ord);

    -- Ano inteiro em branco = a clínica não tem meta desta métrica neste ano.
    -- Guardar 12 nulls seria uma linha que não afirma nada e que faria o
    -- audit_log registrar "meta alterada" onde não passou a haver meta.
    -- `not exists ... where v is not null` e não `v_monthly = array_fill(null…)`:
    -- igualdade de array com elementos nulos é uma regra que quase ninguém lembra
    -- de cabeça, e aqui ela decidiria entre gravar e APAGAR.
    if not exists (select 1 from pg_catalog.unnest(v_monthly) as v where v is not null) then
      delete from public.clinic_goal
       where clinic_id = p_clinic
         and metric    = v_metric::public.goal_metric
         and year      = p_year;
    else
      insert into public.clinic_goal (clinic_id, metric, year, monthly)
      values (p_clinic, v_metric::public.goal_metric, p_year, v_monthly)
      on conflict (clinic_id, metric, year) do update
         set monthly = excluded.monthly;
    end if;
  end loop;
end;
$function$;
