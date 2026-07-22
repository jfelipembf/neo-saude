-- ═════════════════════════════════════════════════════════════════════════════
-- clinic_goal: de META ÚNICA para META MENSAL POR ANO
--
-- O que existia (20260722190000): uma linha por (clinic_id, metric) com um
-- `target_value` que valia para todo mês, indefinidamente. O comentário daquela
-- tabela já previa esta evolução — só que previa a saída (b), "acrescentar uma
-- coluna de período à chave". Este arquivo escolhe a (a). A justificativa está
-- abaixo porque a decisão é o conteúdo desta migration, não um detalhe dela.
--
-- ── (a) year + monthly numeric(12,2)[12]   ×   (b) uma linha por mês ─────────
-- ESCOLHIDA: (a).
--
-- 1. A UNIDADE DE EDIÇÃO É O ANO, E COM (a) A UNIDADE DE ARMAZENAMENTO PASSA A
--    SER A MESMA. A tela é uma matriz métrica × 12 meses com UM botão Salvar.
--    Em (a) isso é 1 linha por métrica: 4 linhas lidas para montar a tela, 4
--    escritas para salvá-la, e cada `on conflict do update` troca o ano inteiro
--    de uma métrica atomicamente. Em (b) o mesmo Salvar é um lote de 48 linhas
--    e, pior, um lote que não é só upsert: um mês que o usuário APAGOU precisa
--    virar DELETE, então a gravação passa a ser "upsert dos preenchidos +
--    delete dos ausentes", que é a operação que costuma nascer sutilmente
--    errada (apaga o que o outro usuário acabou de salvar, ou deixa órfão o mês
--    limpo). Em (a) apagar a meta de julho é `monthly[7] := null` — o mesmo
--    UPDATE de sempre.
--
-- 2. O ARGUMENTO A FAVOR DE (b) — "um dia pode ser preciso consultar a meta de
--    julho isolada" — NÃO SE SUSTENTA. Em (a) isso é `monthly[7]`: um subscript
--    de array, sem junção, sem linha extra, sem índice extra. É exatamente o
--    que dashboard_stats() faz aqui embaixo para pegar o mês corrente. (b)
--    ganharia se a consulta típica fosse "todos os meses de todas as métricas
--    de todas as clínicas em julho, agregados" — mas essa consulta não existe
--    no produto, e se existir, `unnest ... with ordinality` resolve.
--
-- 3. A CARDINALIDADE 12 VIRA INVARIANTE DE BANCO. Em (a) um CHECK garante que
--    todo ano é um vetor de 12 posições, 1-based, sem 13º mês e sem duplicata.
--    Em (b) nada impede um (clinic, metric, year) com 11 meses ou com dois
--    "julho" — a unique cobre a duplicata, mas "ano completo" deixa de ser algo
--    que o banco sabe afirmar.
--
-- 4. A TRILHA DE AUDITORIA FICA LEGÍVEL. private.tg_audit() grava uma linha por
--    linha alterada. Em (a), "o dono mexeu nas metas de 2026" são 4 registros
--    com o antes/depois do ano inteiro — que é a pergunta que a trilha existe
--    para responder. Em (b) o mesmo ato vira até 48 fragmentos onde ninguém
--    consegue enxergar o que mudou.
--
-- O que (a) custa: a granularidade de RLS passa a ser o ano, não o mês. Como
-- toda a autorização deste recurso é por CLÍNICA (`can_edit_feature(clinic_id,
-- 'admin')`), e não por mês, o custo é zero na prática.
--
-- ── NULL vs 0 NO VETOR ───────────────────────────────────────────────────────
-- `null` na posição N = a clínica NÃO definiu meta para aquele mês, e o cartão
-- do dashboard sai com target null. É a representação de "sem meta"; foi ela
-- que substituiu o `target_value > 0` da tabela antiga (lá, "sem meta" era a
-- ausência da linha — o que aqui seria a ausência do ano inteiro).
-- Por isso o CHECK de valor é `>= 0` e não `> 0`: com o null tomando o lugar de
-- "não definido", o zero deixa de ser um acidente e vira um número que a clínica
-- pode querer dizer de propósito (ex.: "meta de despesa nova em janeiro: zero").
-- ATENÇÃO PARA O FRONT: sendo assim, `target = 0` agora chega ao dashboard, e
-- "% da meta" não pode dividir por ele sem guarda.
--
-- A tabela está VAZIA (0 linhas), então aqui se recria em vez de fazer ALTER —
-- há um guard logo abaixo que aborta se isso deixar de ser verdade. O enum
-- public.goal_metric, a RLS e os grants seguem no mesmo padrão das outras fatias.
-- ═════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 0 · GUARD: recriar só é seguro enquanto a tabela estiver vazia
--
-- Roda como o papel da migration (sem RLS), então o count é o total real, não o
-- recorte de uma clínica.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare v_rows bigint;
begin
  select count(*) into v_rows from public.clinic_goal;
  if v_rows > 0 then
    raise exception
      'public.clinic_goal tem % linha(s). Esta migration DERRUBA e recria a '
      'tabela, o que foi decidido com base nela estar vazia. Escreva a conversão '
      'de target_value para monthly[] antes de aplicar.', v_rows
      using errcode = '22000';
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · FORA O QUE FALAVA DE target_value
--
-- A RPC morre ANTES da tabela: a assinatura antiga (uuid, goal_metric, numeric)
-- grava uma meta única e não tem tradução para o formato novo — quem chamar
-- precisa ver "função não existe" (42883) e migrar para set_clinic_goals_year(),
-- não uma versão que aceita a chamada e grava a coisa errada.
--
-- O drop da tabela leva junto policies, triggers, índices e constraints. Não
-- leva dashboard_stats(): corpo de plpgsql não cria dependência registrada — é
-- por isso que a redefinição dela, no fim deste arquivo, é obrigatória e não
-- opcional. Dentro da transação da migration a janela em que a função apontaria
-- para uma tabela inexistente não é observável.
-- ─────────────────────────────────────────────────────────────────────────────

drop function if exists public.set_clinic_goal(uuid, public.goal_metric, numeric);
drop table    if exists public.clinic_goal;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · O CHECK DE VALOR NÃO-NEGATIVO
--
-- Existe como função porque um CHECK não aceita subconsulta, e "nenhum elemento
-- do array é negativo" precisa de `unnest`. IMMUTABLE e sem acesso a tabela — as
-- duas condições para ser honesto dentro de uma constraint.
--
-- `authenticated` precisa de EXECUTE: a expressão do CHECK é avaliada com o
-- privilégio de quem está gravando, não do dono da tabela.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function private.goal_monthly_non_negative(p_monthly numeric[])
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select not exists (
    select 1 from pg_catalog.unnest(p_monthly) as v where v < 0
  );
$$;

comment on function private.goal_monthly_non_negative(numeric[]) is
  'true quando nenhum elemento do vetor de metas é negativo (null passa: null é '
  '"mês sem meta"). Serve ao CHECK de public.clinic_goal.monthly, que não pode '
  'ter subconsulta e portanto não pode chamar unnest direto.';

revoke execute on function private.goal_monthly_non_negative(numeric[]) from public;
grant  execute on function private.goal_monthly_non_negative(numeric[]) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · A TABELA
-- ─────────────────────────────────────────────────────────────────────────────

create table public.clinic_goal (
  id        uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinic(id) on delete cascade,
  metric    public.goal_metric not null,

  -- Ano civil, não competência: a tela tem um seletor de ANO e a matriz é
  -- Jan..Dez. `int` e não `date` porque a linha É o ano inteiro — guardar uma
  -- data aqui sugeriria que a linha fala de um mês.
  year      int not null,

  -- numeric(12,2)[] CRU e não o domínio public.money_brl, pelo mesmo motivo do
  -- target_value antigo: duas das quatro métricas (appointments,
  -- active_patients) são CONTAGEM, não dinheiro. A escala 2 fica porque a mesma
  -- coluna guarda R$ 50.000,00.
  --
  -- O ARRAY é NOT NULL; os ELEMENTOS não. monthly[1] = janeiro … monthly[12] =
  -- dezembro, e null em qualquer posição é "esta clínica não definiu meta para
  -- este mês". O default nasce com os 12 meses em branco para que um INSERT que
  -- só quer registrar o ano já saia válido perante o CHECK de forma.
  monthly   numeric(12,2)[] not null
              default pg_catalog.array_fill(null::numeric, array[12]),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Ano fora desta faixa é dedo escorregado (2206, 26) ou lixo de importação.
  constraint clinic_goal_year_ck check (year between 2000 and 2100),

  -- A FORMA do vetor, que é a invariante que justificou escolher (a) sobre (b).
  -- Os três testes são necessários e nenhum é redundante:
  --   · ndims = 1     — array_fill(0, array[3,4]) tem cardinality 12 e passaria
  --                     nos outros dois, com monthly[7] devolvendo lixo;
  --   · lower(,1) = 1 — um array com bounds [0:11] TAMBÉM tem cardinality 12, e
  --                     aí monthly[7] seria AGOSTO. É o bug mais silencioso
  --                     possível neste desenho, e este teste o torna impossível;
  --   · cardinality   — 12 meses, nem 11 nem 13.
  constraint clinic_goal_monthly_shape_ck check (
    pg_catalog.array_ndims(monthly)     = 1
    and pg_catalog.array_lower(monthly, 1) = 1
    and pg_catalog.cardinality(monthly) = 12
  ),

  -- >= 0 e não > 0 de propósito. Ver a nota "NULL vs 0" no cabeçalho: quem diz
  -- "não definido" agora é o null, então o zero está livre para ser um valor.
  constraint clinic_goal_monthly_non_negative_ck
    check (private.goal_monthly_non_negative(monthly)),

  -- Chave natural. É ela que torna a gravação um UPSERT
  -- (`on conflict (clinic_id, metric, year) do update`) em vez de um
  -- "apaga e insere" que perderia o created_at.
  constraint clinic_goal_metric_year_uk unique (clinic_id, metric, year)
);

comment on table public.clinic_goal is
  'Meta da clínica por MÉTRICA e por ANO, com os 12 meses no vetor `monthly` — '
  'uma linha por (clinic_id, metric, year). monthly[1] é janeiro e monthly[12] '
  'é dezembro; null numa posição é "mês sem meta" e chega ao dashboard como '
  'target null. Substitui o desenho de meta única sem período: a leitura do '
  'dashboard passou a ser monthly[mês corrente] do ano corrente, e a tela de '
  'metas grava o ano inteiro de uma métrica numa linha só. O vetor foi preferido '
  'a uma linha por mês porque a unidade de edição é o ano (um botão Salvar para '
  'a matriz inteira), porque "meta de julho" continua sendo um subscript e não '
  'uma junção, e porque assim "o ano tem 12 posições" vira CHECK em vez de '
  'convenção.';

comment on column public.clinic_goal.metric is
  'Qual dos quatro números do dashboard esta meta mede. Mesmo rótulo usado como '
  'chave em dashboard_stats() -> metrics.';
comment on column public.clinic_goal.year is
  'Ano civil da matriz (o seletor de ano da tela). A linha cobre Jan..Dez deste '
  'ano; o ano seguinte é outra linha.';
comment on column public.clinic_goal.monthly is
  'Os 12 alvos do ano, em NÚMERO CRU: reais para revenue/expenses, quantidade '
  'para appointments/active_patients. Índice 1-based = mês (garantido por '
  'clinic_goal_monthly_shape_ck, que também impede bounds [0:11] — sem ele um '
  'vetor zero-based faria monthly[7] devolver agosto). null = mês sem meta; 0 é '
  'valor legítimo, então quem calcular "% da meta" precisa se proteger da '
  'divisão por zero. Formatação (R$, separador de milhar) é do front, em pt-BR.';

-- Sem índice avulso em clinic_id: a unique (clinic_id, metric, year) já é um
-- índice com clinic_id na frente, que é o que a RLS e o dashboard filtram. O
-- clinic_goal_clinic_idx da versão anterior era redundante pelo mesmo motivo.


-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

create trigger tr_touch before update on public.clinic_goal
  for each row execute function private.tg_touch_updated_at();

-- Meta é número de cobrança de equipe: quem baixou a meta de faturamento de
-- novembro no dia 28 é exatamente o tipo de pergunta que a trilha existe para
-- responder. Com o ano numa linha só, o old_data/new_data do audit_log mostra a
-- matriz antes e depois — legível, ao contrário de 12 registros soltos.
create trigger tr_audit after insert or update or delete on public.clinic_goal
  for each row execute function private.tg_audit();


-- ─────────────────────────────────────────────────────────────────────────────
-- 5 · PRIVILÉGIOS DE COLUNA
--
-- Ordem obrigatória (igual às outras fatias): REVOKE de tabela ANTES do GRANT de
-- coluna — privilégio de coluna só existe onde o de tabela não existe. O REVOKE
-- não é decorativo: `alter default privileges for role postgres in schema public`
-- (20260722120900) dá INSERT/SELECT/UPDATE/DELETE de TABELA a `authenticated` em
-- toda tabela nova, então esta tabela já nasce aberta.
--
-- SELECT e DELETE ficam como vieram do default: a policy é que recorta.
-- ─────────────────────────────────────────────────────────────────────────────

revoke all on public.clinic_goal from anon;

-- `metric` e `year` entram no INSERT e ficam FORA do UPDATE: mudá-los numa linha
-- existente moveria a matriz de 2026 para 2027, ou transformaria "meta de
-- despesa" em "meta de faturamento", mantendo id e created_at — e o audit_log
-- registraria uma edição onde houve, de fato, uma meta nova.
-- id/created_at/updated_at nunca vêm do cliente.
revoke insert, update on public.clinic_goal from authenticated;
grant insert (clinic_id, metric, year, monthly) on public.clinic_goal to authenticated;
grant update (monthly)                          on public.clinic_goal to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6 · RLS  (idêntica à da versão anterior — o desenho da autorização não mudou)
--
-- LEITURA: quem vê o dashboard. A meta é parte do cartão — se ela exigisse a
-- feature 'admin' para ser LIDA, todo usuário comum veria o cartão sem barra de
-- progresso e concluiria que a clínica não cadastrou meta. 'admin' também é
-- aceito para que o administrador que não tem 'dashboard' consiga abrir a tela
-- de metas e ver o que já está gravado.
--
-- ESCRITA: exige a feature 'admin'. Definir a meta da clínica é ato de gestão,
-- não de recepção.
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
-- despesa em 2026". Não há o pudor de public.payable aqui: meta não é lançamento
-- contábil, é parâmetro de tela, e a exclusão fica no audit_log.
create policy clinic_goal_delete on public.clinic_goal
  for delete to authenticated
  using (clinic_id = any(private.auth_clinic_ids())
         and private.can_edit_feature(clinic_id, 'admin'));


-- ═════════════════════════════════════════════════════════════════════════════
-- 7 · set_clinic_goals_year() — a gravação em LOTE da matriz
--
-- Herda a razão de existir de set_clinic_goal(): o upsert do PostgREST
-- (`.upsert(..., { onConflict })`) monta um `on conflict do update` que atribui
-- TODAS as colunas do payload, inclusive clinic_id/metric/year, que não têm
-- grant de UPDATE. O Postgres confere privilégio de coluna do SET no PLANO, não
-- na execução, então isso falha com 42501 já na PRIMEIRA gravação, quando não há
-- conflito nenhum. Aqui o SET é nosso e toca só `monthly`, que é exatamente o
-- privilégio concedido.
--
-- E ganha uma segunda razão: a tela salva a MATRIZ, não uma célula. Um round-trip
-- por métrica deixaria a matriz meio salva se o terceiro POST falhasse. Aqui as
-- quatro métricas entram na mesma transação — ou o ano inteiro fica gravado, ou
-- nada fica.
--
-- FORMA DO ARGUMENTO: jsonb `{"revenue": [12 valores], "appointments": [...]}`,
-- com null nas posições sem meta. Não é `numeric[][]` porque array 2-D não
-- sobrevive ao supabase-js de forma previsível, e não são 4 parâmetros fixos
-- porque a tela manda só as métricas que o usuário tocou.
--
-- SECURITY INVOKER: quem manda continua sendo a RLS de clinic_goal. As policies
-- de insert/update/delete exigem can_edit_feature(clinic_id, 'admin') e nada
-- aqui contorna isso — a função não empresta privilégio, só escolhe o SET.
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function public.set_clinic_goals_year(
  p_clinic uuid,
  p_year   int,
  p_goals  jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
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
         -- SÓ monthly. Ver o cabeçalho: é esta lista que o PostgREST não
         -- conseguia restringir e que fazia a gravação bater no grant de coluna.
         set monthly = excluded.monthly;
    end if;
  end loop;
end;
$$;

comment on function public.set_clinic_goals_year(uuid, int, jsonb) is
  'Grava a matriz de metas de um ANO em lote (cria, atualiza ou apaga), uma '
  'linha de clinic_goal por métrica, tudo na mesma transação. p_goals é '
  '{"revenue": [12 valores], ...} com null no mês sem meta; métrica cujo ano '
  'inteiro vier em branco tem a linha APAGADA em vez de virar 12 nulls. Existe '
  'porque o upsert do PostgREST atribui todas as colunas do payload no DO UPDATE '
  'e esbarra no grant de coluna de clinic_goal (update só em monthly), falhando '
  'com 42501 já na primeira gravação — e porque salvar a matriz métrica a '
  'métrica deixaria o ano meio gravado se um dos round-trips falhasse. SECURITY '
  'INVOKER: a RLS de clinic_goal é quem exige a feature admin para escrever.';

revoke execute on function public.set_clinic_goals_year(uuid, int, jsonb) from public;
grant  execute on function public.set_clinic_goals_year(uuid, int, jsonb) to authenticated;


-- ═════════════════════════════════════════════════════════════════════════════
-- 8 · dashboard_stats() — target passa a ser a meta do MÊS CORRENTE
--
-- Único ponto alterado em relação à versão de 20260722190000: o bloco METAS.
-- Antes somava clinic_goal.target_value (a meta que valia para sempre); agora lê
-- monthly[mês corrente] das linhas do ano corrente. Todo o resto do corpo —
-- consultas, faturamento, despesas, chaves legadas — é o mesmo, e está reescrito
-- por inteiro porque `create or replace function` não faz remendo.
--
-- SEM META NO MÊS = target null, NUNCA zero: um zero seria lido pelo cartão como
-- "meta batida em 100%" logo na primeira consulta do mês.
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function public.dashboard_stats()
returns jsonb
language plpgsql
stable
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

  -- Recorte da meta: o MESMO "hoje" que recorta os numeradores, para que o
  -- numerador e o denominador do cartão nunca falem de meses diferentes na
  -- virada do mês. 1..12, que é o subscript de clinic_goal.monthly.
  v_year         int  := extract(year  from v_today)::int;
  v_month        int  := extract(month from v_today)::int;

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

  -- ── METAS: monthly[mês corrente] do ano corrente ───────────────────────────
  -- Vira um mapa {metric: valor} para que o jsonb_build_object abaixo seja uma
  -- indexação e não quatro subconsultas. `sum` + `group by` e não um simples
  -- select porque, com usuário em duas clínicas, a RLS devolve DUAS linhas por
  -- métrica — e os numeradores acima já vieram somados.
  --
  -- O `having` existe para separar dois casos que o `sum` confunde: métrica cujo
  -- mês corrente está em branco em TODAS as clínicas visíveis some do mapa, e
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
    -- ── LEGADO (DEPRECIADO) ────────────────────────────────────────────────
    -- Mantidos com tipo idêntico ao da versão anterior enquanto o front migra.
    'appointments_today',    v_appt_today,
    'active_patients',       v_active,
    'pending_confirmations', v_pending,
    'monthly_revenue',       v_revenue_cur,

    -- ── O QUE OS CARTÕES NOVOS CONSOMEM ────────────────────────────────────
    -- target vem de `->`, que devolve SQL NULL quando a métrica não tem meta no
    -- mês — e SQL NULL vira `null` no JSON. "Sem meta" é null explícito, nunca
    -- 0: um zero seria lido como "meta batida em 100%" logo na primeira consulta.
    -- (Um 0 GRAVADO de propósito continua chegando como 0 — ver o comentário de
    -- clinic_goal.monthly sobre divisão por zero no front.)
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
  'Números do dashboard num jsonb só. `metrics` traz, por métrica, current '
  '(mês corrente), previous (mês anterior) e target — a meta do MÊS CORRENTE do '
  'ANO CORRENTE, lida de public.clinic_goal.monthly[mês], ou null quando a '
  'clínica não definiu meta para aquele mês. As chaves de raiz '
  '(appointments_today, active_patients, pending_confirmations, monthly_revenue) '
  'são legado e saem quando o front terminar de migrar para `metrics`.';
