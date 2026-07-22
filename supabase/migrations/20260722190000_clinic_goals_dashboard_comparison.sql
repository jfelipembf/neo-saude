-- ═════════════════════════════════════════════════════════════════════════════
-- METAS DA CLÍNICA E A COMPARAÇÃO MÊS A MÊS DOS CARTÕES DO DASHBOARD
--
-- CONTEXTO: o DashboardPage.tsx tem hoje este comentário, em cima dos cartões:
--
--     "Sem `hint` nem `meta`: a RPC não devolve comparação com o mês anterior
--      nem meta da clínica, e número de tendência inventado é pior que
--      tendência nenhuma — ele é lido como se fosse real."
--
-- Esta migration é o que apaga esse comentário: cria o lugar onde a meta mora
-- (public.clinic_goal) e amplia public.dashboard_stats() para devolver, por
-- métrica, o trio { current, previous, target } que o cartão precisa para
-- escrever "+15% vs. mês anterior" e desenhar o progresso da meta.
--
-- ── DEPENDE DE ───────────────────────────────────────────────────────────────
--   01-foundation : public.clinic, private.auth_clinic_ids(),
--                   private.can_access_feature(), private.can_edit_feature(),
--                   private.tg_touch_updated_at(), private.tg_audit()
--   08-finance    : public.payable, public.receivable
--   15-dashboard_aggregates : private.clinic_today(), public.dashboard_stats()
--
-- ── DECISÃO DE PRODUTO REGISTRADA: META É VALOR FIXO POR MÉTRICA ─────────────
-- Uma linha por (clínica, métrica). NÃO existe competência mensal: a meta de
-- faturamento é "R$ 50.000 por mês", não "R$ 50.000 em julho/2026". É a decisão
-- tomada, e a tabela é modelada para ela — não para uma versão futura imaginada.
-- Como evoluir para meta POR MÊS quando (e se) o produto pedir: ver o COMMENT
-- da tabela, seção "EVOLUÇÃO".
--
-- ── O NOME REAL DOS HELPERS ──────────────────────────────────────────────────
-- A função de LEITURA por feature chama-se private.can_access_feature(), não
-- `can_view_feature` — esta última NÃO EXISTE no banco. Confirmado em pg_proc
-- antes de escrever este arquivo; as assinaturas usadas aqui são as de duas
-- casas, (p_clinic uuid, variadic p_keys text[]), iguais às de payable/patient.
-- ═════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · O ENUM DAS MÉTRICAS
--
-- Enum e não `text` + CHECK porque é assim que o resto do schema modela conjunto
-- fechado (payment_status, appointment_status, active_status…), e porque estes
-- quatro valores são TAMBÉM as chaves do JSON que dashboard_stats() devolve: um
-- typo em 'revenue' tem de ser erro de gravação, não uma meta que nunca casa com
-- cartão nenhum e some da tela sem reclamar.
--
-- CUSTO ACEITO: acrescentar métrica exige `alter type ... add value`, que no
-- Postgres não pode ter o valor novo USADO na mesma transação da migration. Na
-- prática são duas migrations (uma que adiciona o rótulo, outra que o usa) —
-- barato perto de um CHECK que aceita qualquer string até alguém conferir.
-- ─────────────────────────────────────────────────────────────────────────────

create type public.goal_metric as enum (
  'appointments',     -- consultas não canceladas no mês
  'active_patients',  -- pacientes com status 'active' (ESTOQUE, não fluxo)
  'revenue',          -- recebido no mês (receivable pago, por received_at)
  'expenses'          -- pago no mês (payable pago, por paid_at)
);

comment on type public.goal_metric is
  'As quatro métricas que o dashboard compara contra meta. O rótulo é IGUAL à '
  'chave correspondente em dashboard_stats() -> metrics: quem lê o JSON indexa '
  'pelo mesmo nome que quem grava a meta escolheu na tela.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · A TABELA
-- ─────────────────────────────────────────────────────────────────────────────

create table public.clinic_goal (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinic(id) on delete cascade,
  metric       public.goal_metric not null,

  -- numeric(12,2) CRU e não o domínio public.money_brl: duas das quatro métricas
  -- (appointments, active_patients) são CONTAGEM, não dinheiro. Tipar a coluna
  -- como money_brl faria "300 consultas" carregar semântica de reais e, no dia em
  -- que money_brl ganhar uma regra (formatação, câmbio, arredondamento de
  -- centavo), essa regra passaria a valer para meta de consulta. A escala 2 fica
  -- porque a mesma coluna guarda R$ 50.000,00.
  target_value numeric(12,2) not null,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Meta ZERO ou negativa não é meta, é ausência de meta — e ausência de meta já
  -- tem representação: a linha não existe. Sem este CHECK, um zero gravado por
  -- engano viraria divisão por zero no cálculo de "% da meta" no front.
  constraint clinic_goal_target_positive_ck check (target_value > 0),

  -- UMA meta por métrica por clínica. É esta constraint que torna a gravação um
  -- UPSERT (`on conflict (clinic_id, metric) do update`) em vez de um
  -- "apaga e insere" que perde o created_at.
  constraint clinic_goal_metric_uk unique (clinic_id, metric)
);

comment on table public.clinic_goal is
  'Meta da clínica por MÉTRICA, em valor fixo — uma linha por (clinic_id, '
  'metric), SEM competência mensal. "Meta de faturamento: R$ 50.000" vale para '
  'todo mês, não para um mês específico; a mesma linha é comparada contra o mês '
  'corrente indefinidamente. Métrica sem linha = clínica não definiu meta, e o '
  'cartão correspondente sai com target null (o front esconde o progresso). '
  'EVOLUÇÃO PARA META MENSAL: acrescentar uma coluna de período à CHAVE — '
  '`period date` (primeiro dia do mês) entrando em clinic_goal_metric_uk, que '
  'passa a ser unique (clinic_id, metric, period). A linha de hoje vira a meta '
  'padrão com period null, e a leitura passa a ser "meta do mês pedido, com '
  'fallback na de period null". Nada do que existe hoje precisa ser reescrito: '
  'a chave GANHA uma coluna, não troca de forma.';

comment on column public.clinic_goal.metric is
  'Qual dos quatro números do dashboard esta meta mede. Mesmo rótulo usado como '
  'chave em dashboard_stats() -> metrics.';
comment on column public.clinic_goal.target_value is
  'O alvo, em NÚMERO CRU: reais para revenue/expenses, quantidade para '
  'appointments/active_patients. Sempre > 0 — meta zerada se APAGA, não se '
  'zera. Formatação (R$, separador de milhar) é do front, em pt-BR.';

create index clinic_goal_clinic_idx on public.clinic_goal (clinic_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

create trigger tr_touch before update on public.clinic_goal
  for each row execute function private.tg_touch_updated_at();

-- Meta é número de cobrança de equipe: quem mudou a meta de faturamento de
-- R$ 50.000 para R$ 20.000 no dia 28 é exatamente o tipo de pergunta que a
-- trilha existe para responder.
create trigger tr_audit after insert or update or delete on public.clinic_goal
  for each row execute function private.tg_audit();


-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · PRIVILÉGIOS DE COLUNA
--
-- Ordem obrigatória (igual às outras fatias): REVOKE de tabela ANTES do GRANT de
-- coluna — privilégio de coluna só existe onde o de tabela não existe.
-- ─────────────────────────────────────────────────────────────────────────────

revoke all on public.clinic_goal from anon;

-- `metric` entra no INSERT e fica FORA do UPDATE: trocar a métrica de uma linha
-- existente transformaria "meta de despesa" em "meta de faturamento" mantendo o
-- id e o created_at, e o audit_log mostraria uma edição onde houve, de fato,
-- uma meta nova. Trocar de métrica é apagar e inserir.
-- id/created_at/updated_at nunca vêm do cliente.
revoke insert, update on public.clinic_goal from authenticated;
grant insert (clinic_id, metric, target_value) on public.clinic_goal to authenticated;
grant update (target_value)                    on public.clinic_goal to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5 · RLS
--
-- LEITURA: quem vê o dashboard. A meta é parte do cartão — se ela exigisse a
-- feature 'admin' para ser LIDA, todo usuário comum veria o cartão sem barra de
-- progresso e concluiria que a clínica não cadastrou meta. 'admin' também é
-- aceito para que o administrador que não tem 'dashboard' consiga abrir a tela
-- de configuração de metas e ver o que já está gravado.
--
-- ESCRITA: exige a feature 'admin', como pedido. Definir a meta da clínica é ato
-- de gestão, não de recepção.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.clinic_goal enable row level security;

create policy clinic_goal_select on public.clinic_goal
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_access_feature(clinic_id, 'dashboard', 'admin'));

create policy clinic_goal_insert on public.clinic_goal
  for insert to authenticated
  with check (clinic_id = any(private.auth_clinic_ids())
              and private.can_edit_feature(clinic_id, 'admin'));

create policy clinic_goal_update on public.clinic_goal
  for update to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_edit_feature(clinic_id, 'admin'))
  with check (clinic_id = any(private.auth_clinic_ids()));

-- DELETE existe e é o caminho oficial para "esta clínica não tem mais meta de
-- despesa". Não há o pudor de public.payable aqui: meta não é lançamento
-- contábil, é parâmetro de tela, e a exclusão fica no audit_log.
create policy clinic_goal_delete on public.clinic_goal
  for delete to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_edit_feature(clinic_id, 'admin'));


-- ═════════════════════════════════════════════════════════════════════════════
-- 6 · dashboard_stats() AMPLIADA
--
-- ── FORMA DO RETORNO, E POR QUE NÃO A SUGERIDA AO PÉ DA LETRA ────────────────
-- A sugestão era achatar tudo na raiz:
--     { appointments: {...}, active_patients: {...}, revenue: {...},
--       expenses: {...}, pending_confirmations: n }
-- Duas coisas quebrariam, e as duas em SILÊNCIO:
--
--   1. `active_patients` HOJE é um número na raiz, e appointmentsService.ts faz
--      `Number(s.active_patients)`. Trocar o número por um objeto sob a MESMA
--      chave não dá erro: dá NaN na tela. Mudança de TIPO sob chave estável é o
--      pior tipo de mudança — não falha, mente.
--
--   2. `appointments_today` sumiria, e ele NÃO é o mesmo número que
--      appointments.current: um é a agenda de HOJE, o outro é o total do MÊS. O
--      cartão "Consultas hoje" continua existindo e continua precisando dele.
--
-- Então os quatro campos legados FICAM onde estão, com o mesmo tipo, e o material
-- novo nasce aninhado sob `metrics`. Efeito colateral bom: esta migration pode
-- ir para produção ANTES do front — nada quebra enquanto a tela não migrar.
--
-- DUPLICAÇÃO ASSUMIDA E COM PRAZO: `active_patients` == `metrics.active_patients
-- .current` e `monthly_revenue` == `metrics.revenue.current`. São os mesmos
-- números por duas chaves, de propósito, durante a transição. Quando o front
-- passar a ler só `metrics`, uma migration curta remove os quatro legados —
-- estão marcados como DEPRECIADOS no COMMENT da função.
--
-- ── active_patients.previous É null, E ISSO NÃO É PREGUIÇA ───────────────────
-- "Pacientes ativos" é ESTOQUE, não fluxo: o valor do mês passado seria "quantos
-- estavam ativos em 30/06", e o schema atual NÃO GUARDA ISSO. public.patient tem
-- só o status CORRENTE — não há status_changed_at nem tabela de histórico.
--
-- As duas saídas erradas que ficaram de fora:
--   · `count(*) where status='active' and created_at <= fim do mês passado` —
--     usa o status de HOJE numa data do PASSADO. Quem estava ativo em junho e foi
--     inativado em julho não seria contado, e o cartão mostraria crescimento onde
--     houve perda. É um número plausível e errado, que é o pior tipo.
--   · reconstruir pelo public.audit_log (que guarda old_data/new_data completos):
--     tecnicamente possível, mas só cobre o período em que a trigger existiu —
--     paciente carregado antes disso não tem linha e some da contagem histórica.
--     Além de custar um scan com jsonb a cada abertura do dashboard.
--
-- Então: previous = null, e o front esconde a comparação nesse cartão. Para
-- passar a ser calculável, o caminho é uma tabela patient_status_event (ou uma
-- coluna status_since em patient) — aí `previous` vira uma contagem de verdade.
--
-- ── TENANT ───────────────────────────────────────────────────────────────────
-- SECURITY INVOKER, como a versão anterior: a RLS de appointment, patient,
-- receivable, payable e clinic_goal é quem recorta a clínica. A ressalva do
-- arquivo 15 continua valendo — o recorte é "todas as clínicas do usuário", e com
-- duas clínicas os números SOMAM. A meta soma junto, pelo mesmo critério: seria
-- incoerente somar o faturamento de duas clínicas e comparar com a meta de uma.
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function public.dashboard_stats()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_today        date := private.clinic_today();
  -- As três bordas do mês, calculadas UMA vez. A versão anterior chamava
  -- private.clinic_today() quatro vezes dentro do mesmo jsonb_build_object; aqui
  -- há oito recortes de data e repetir a chamada seria ruído puro.
  -- Intervalo semiaberto [início, próximo) em toda parte: `< primeiro dia do mês
  -- que vem` não tem o bug de fim de mês que `<= último dia` tem.
  v_month_start  date := date_trunc('month', v_today)::date;
  v_next_start   date := (date_trunc('month', v_today) + interval '1 month')::date;
  v_prev_start   date := (date_trunc('month', v_today) - interval '1 month')::date;

  v_appt_today   bigint;
  v_appt_cur     bigint;
  v_appt_prev    bigint;
  v_pending      bigint;
  v_active       bigint;
  v_revenue_cur  numeric;
  v_revenue_prev numeric;
  v_expense_cur  numeric;
  v_expense_prev numeric;
  v_targets      jsonb;
begin
  -- ── CONSULTAS ──────────────────────────────────────────────────────────────
  -- Uma varredura só para os três números, com FILTER. Hoje ∈ mês corrente, então
  -- [v_prev_start, v_next_start) cobre os três recortes e o filtro casa com o
  -- índice (clinic_id, date).
  --
  -- `status <> 'canceled'` na cláusula comum, mesma regra da versão anterior:
  -- desmarcada não ocupa cadeira. `no_show` CONTINUA contando — o horário foi
  -- reservado e o profissional esperou.
  select count(*) filter (where a.date = v_today),
         count(*) filter (where a.date >= v_month_start and a.date < v_next_start),
         count(*) filter (where a.date >= v_prev_start  and a.date < v_month_start)
    into v_appt_today, v_appt_cur, v_appt_prev
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
  -- Estoque: o cadastro vivo AGORA. Ver a nota do cabeçalho sobre o `previous`.
  select count(*)
    into v_active
    from public.patient p
   where p.status = 'active';

  -- ── FATURAMENTO (regime de caixa, por received_at) ─────────────────────────
  -- Mesma definição de "recebido" de finance_series() e da versão anterior desta
  -- função: received_amount é o que de fato caiu (inclui juros/multa) e cai para
  -- net_amount quando a baixa veio sem valor (legado de importação).
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
  -- combinado. Mesma expressão de finance_series() — os dois números têm de bater.
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

  -- ── METAS ──────────────────────────────────────────────────────────────────
  -- Vira um mapa {metric: valor} para que o jsonb_build_object abaixo seja uma
  -- indexação e não quatro subconsultas. `sum` + `group by` e não um simples
  -- select porque, com usuário em duas clínicas, a RLS devolve DUAS linhas por
  -- métrica — e os numeradores acima já vieram somados.
  select coalesce(jsonb_object_agg(t.metric, t.total), '{}'::jsonb)
    into v_targets
    from (
      select g.metric::text as metric, sum(g.target_value) as total
        from public.clinic_goal g
       group by g.metric
    ) t;

  return jsonb_build_object(
    -- ── LEGADO (DEPRECIADO) ────────────────────────────────────────────────
    -- Mantidos com tipo idêntico ao da versão anterior enquanto o front migra.
    'appointments_today',    v_appt_today,
    'active_patients',       v_active,
    'pending_confirmations', v_pending,
    'monthly_revenue',       v_revenue_cur,

    -- ── O QUE OS CARTÕES NOVOS CONSOMEM ────────────────────────────────────
    -- target vem de `->`, que devolve SQL NULL quando a métrica não tem meta —
    -- e SQL NULL vira `null` no JSON. "Sem meta" é null explícito, nunca 0:
    -- um zero seria lido como "meta batida em 100%" logo na primeira consulta.
    'metrics', jsonb_build_object(
      'appointments', jsonb_build_object(
        'current',  v_appt_cur,
        'previous', v_appt_prev,
        'target',   v_targets -> 'appointments'
      ),
      'active_patients', jsonb_build_object(
        'current',  v_active,
        -- Cast explícito: `null` cru não tem tipo e jsonb_build_object recusa.
        -- Ver o cabeçalho — é estoque sem histórico, não um número esquecido.
        'previous', null::numeric,
        'target',   v_targets -> 'active_patients'
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
$$;

comment on function public.dashboard_stats() is
  'Números do topo do dashboard em uma chamada. Devolve { appointments_today, '
  'active_patients, pending_confirmations, monthly_revenue, metrics }. '
  'DEPRECIADOS os quatro primeiros: existem só para não quebrar o front atual e '
  'saem quando a tela ler `metrics` (appointments_today NÃO é depreciado por '
  'duplicação — é a agenda de HOJE, enquanto metrics.appointments é o MÊS). '
  '`metrics` traz, por métrica, { current, previous, target }: current = mês '
  'corrente, previous = mês anterior (para "+15% vs. mês anterior"), target = '
  'public.clinic_goal ou null quando a clínica não definiu meta. '
  'metrics.active_patients.previous é SEMPRE null: é estoque e o schema não '
  'guarda histórico de status do paciente — ver o comentário da migration. '
  'appointments = não canceladas por data; revenue = recebido por received_at; '
  'expenses = pago por paid_at (regime de caixa nos dois). Números CRUS — '
  'formatação de moeda é do front. SECURITY INVOKER: a RLS recorta o tenant.';

revoke execute on function public.dashboard_stats() from public;
grant  execute on function public.dashboard_stats() to authenticated;


-- ═════════════════════════════════════════════════════════════════════════════
-- PONTAS SOLTAS
--
-- 1. DESPESAS E A FEATURE 'finance'. metrics.expenses lê public.payable, cuja
--    policy de SELECT exige can_access_feature(clinic_id, 'finance'). Usuário com
--    'dashboard' e SEM 'finance' recebe expenses.current = 0 — não um erro, e não
--    um null. Isso NÃO é novo: monthly_revenue já lia receivable com a mesma
--    policy desde o arquivo 15. Se o cartão de despesas for para todo mundo, a
--    correção é o front esconder o cartão por permissão (a permissão ele já tem
--    em mãos), e não a RPC virar security definer para furar a RLS.
--
-- 2. previous DO MÊS 1 DE USO. Clínica que começou a usar o sistema neste mês tem
--    previous = 0 em tudo, e "+∞%" é divisão por zero no front. O banco entrega o
--    zero honesto; quem decide mostrar "—" em vez de um percentual é a StatsCard.
--
-- 3. metrics.expenses NÃO tem par legado. É a única das quatro que não existia
--    antes — nenhum campo da RPC antiga somava payable. Quem quiser o número
--    fora do dashboard já tem public.finance_series() e public.cash_flow().
--
-- 4. O ENUM E O FRONT. public.goal_metric tem os mesmos quatro rótulos das chaves
--    de `metrics`. Se um dia divergirem, a meta gravada deixa de casar com o
--    cartão SEM erro nenhum — vale um teste que percorra o enum e confira que
--    cada rótulo existe em metrics.
-- ═════════════════════════════════════════════════════════════════════════════
