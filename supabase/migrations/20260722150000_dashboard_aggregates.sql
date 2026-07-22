-- ═════════════════════════════════════════════════════════════════════════════
-- AGREGAÇÕES DO DASHBOARD E DO FINANCEIRO — os quatro números e as três séries
--
-- CONTEXTO: dashboard_stats, appointment_series, finance_series e cash_flow
-- rodavam em MOCK no front (ver os TODO em appointmentsService.ts e
-- financeService.ts). Contar linha por linha no cliente significaria baixar a
-- agenda inteira e o razão inteiro para somar quatro números — e cada tela
-- reimplementaria "o que conta como recebido". Aqui a regra fica em UM lugar.
--
-- ESTRATÉGIA DE TENANT: **RLS via SECURITY INVOKER**, sem repetir o filtro por
-- private.auth_clinic_ids() dentro do corpo. Duas razões:
--   1. A função roda com o papel de quem chamou, então ela é FISICAMENTE incapaz
--      de ler linha que o chamador já não pudesse ler com um select comum.
--      Um `clinic_id = any(private.auth_clinic_ids())` a mais não protegeria
--      nada — seria uma SEGUNDA cópia da regra de tenant, que amanhã diverge da
--      policy e vira a fonte silenciosa de erro.
--   2. É o que o CLAUDE.md do projeto manda: security definer só com
--      justificativa, e aqui não há nenhuma (não precisamos furar RLS).
--
--   RESSALVA (hoje inofensiva, amanhã não): o recorte é "todas as clínicas do
--   usuário". Com 1 usuário = 1 clínica — o caso de hoje — isso é exatamente a
--   clínica corrente. No dia em que existir troca de clínica na UI, estas
--   funções passam a SOMAR as duas. A evolução é acrescentar `p_clinic uuid
--   default null` e filtrar por ele quando vier preenchido; a RLS continua
--   sendo o teto. Fica registrado aqui para não ser descoberto em produção.
--
-- FORMATAÇÃO: o banco devolve NÚMERO CRU. 'R$ 24.380' é decisão de locale, e
-- locale é do front (pt-BR). Datas saem em ISO (aaaa-mm-dd) pelo mesmo motivo.
-- ═════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- HELPERS (schema private — não são API, são detalhe de implementação)
-- ─────────────────────────────────────────────────────────────────────────────

-- "Hoje" NÃO é current_date. O servidor roda em UTC: entre 21h e 00h no Brasil,
-- current_date já virou o dia seguinte e "consultas de hoje" mostraria a agenda
-- de amanhã justamente no horário em que a recepção está fechando o dia.
-- Fuso fixo em 'America/Sao_Paulo' pelo mesmo motivo (e com a mesma dívida) da
-- view cash_flow_day: `clinic` ainda não tem coluna de timezone. Quando tiver,
-- é ESTA função que muda — nenhuma das quatro abaixo precisa saber.
create or replace function private.clinic_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Sao_Paulo')::date;
$$;

comment on function private.clinic_today() is
  'O "hoje" da clínica, no fuso dela — não o hoje do servidor (UTC). Ponto único '
  'de mudança quando clinic.timezone existir.';


-- 'aaaa-mm' → primeiro dia do mês. Valida ANTES de converter: string inválida
-- tem de virar erro com mensagem legível, não um `invalid input syntax` do
-- to_date nem — pior — um mês silenciosamente errado.
create or replace function private.parse_month_iso(p_month_iso text)
returns date
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_month_iso is null or p_month_iso !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then
    raise exception
      'Mês de referência inválido: %. Use o formato aaaa-mm (ex.: 2026-07).',
      coalesce(quote_literal(p_month_iso), 'null')
      using errcode = '22007';  -- invalid_datetime_format
  end if;

  -- make_date em vez de to_date: é imutável e não depende de DateStyle.
  return make_date(
    substring(p_month_iso from 1 for 4)::int,
    substring(p_month_iso from 6 for 2)::int,
    1
  );
end;
$$;

comment on function private.parse_month_iso(text) is
  'Valida e converte o mês de referência dos gráficos. Erro 22007 com mensagem '
  'em português — o front mostra a mensagem, não um stack de conversão.';


-- Rótulos do eixo X. Ficam no banco porque o BALDE e o NOME do balde são a
-- mesma decisão: quem define que a semana tem 7 baldes diários define que o
-- rótulo é "Seg 21". Arrays literais em vez de to_char(..., 'Dy'): to_char
-- depende de lc_time do servidor, que ninguém garante ser pt_BR.
create or replace function private.weekday_label(p_day date)
returns text
language sql
immutable
set search_path = ''
as $$
  select (array['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'])[extract(isodow from p_day)::int]
         || ' ' || extract(day from p_day)::int::text;
$$;

create or replace function private.month_label(p_month int)
returns text
language sql
immutable
set search_path = ''
as $$
  select (array['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'])[p_month];
$$;

comment on function private.weekday_label(date) is
  'Rótulo do eixo X na visão semanal: "Seg 21". Inclui o DIA porque o rótulo '
  'também é a chave de React da barra — sete "Seg" seriam sete chaves iguais.';
comment on function private.month_label(int) is 'Jan..Dez — rótulo do eixo X na visão anual.';


-- ─────────────────────────────────────────────────────────────────────────────
-- OS BALDES DA SÉRIE — uma definição só para os dois gráficos
--
-- appointment_series e finance_series ficam LADO A LADO no dashboard. Se cada
-- uma montasse seu próprio generate_series, bastaria uma divergência de um dia
-- para os dois gráficos mostrarem eixos X diferentes na mesma tela. Aqui os
-- baldes nascem uma vez e as duas funções só penduram números neles.
--
-- generate_series e não `group by data`: dia sem consulta TEM de aparecer com
-- zero. Agrupar pelo que existe pula o dia vazio, as barras encostam umas nas
-- outras e o gráfico mente sobre a distribuição — buraco em série temporal é
-- bug visual, não economia de linha.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function private.series_buckets(p_period text, p_month_iso text)
returns table (label text, day_from date, day_to date)
language plpgsql
stable
set search_path = ''
as $$
declare
  v_today date := private.clinic_today();
  v_first date;
  v_days  int;
begin
  if p_period is null or p_period not in ('week', 'month', 'year') then
    raise exception
      'Período inválido: %. Use ''week'', ''month'' ou ''year''.',
      coalesce(quote_literal(p_period), 'null')
      using errcode = '22023';  -- invalid_parameter_value
  end if;

  -- SEMANA = os últimos 7 dias corridos terminando HOJE (não a semana do mês de
  -- referência). É a leitura de "como estamos indo agora", e por isso é a única
  -- visão que ignora p_month_iso — inclusive aceitando-o nulo.
  if p_period = 'week' then
    return query
      select private.weekday_label(d.day), d.day, d.day
        from (
          select (v_today - 6 + g.i)::date as day
            from generate_series(0, 6) as g(i)
        ) d
       order by d.day;
    return;
  end if;

  -- month e year exigem mês de referência: é o seletor de mês/ano da tela.
  v_first := private.parse_month_iso(p_month_iso);

  if p_period = 'month' then
    -- Dias do mês pedido — 28, 29, 30 ou 31, calculados e não chutados.
    v_days := extract(day from (v_first + interval '1 month' - interval '1 day'))::int;
    return query
      select extract(day from d.day)::int::text, d.day, d.day
        from (
          select (v_first + g.i)::date as day
            from generate_series(0, v_days - 1) as g(i)
        ) d
       order by d.day;
    return;
  end if;

  -- ANO: 12 baldes MENSAIS. day_from/day_to viram um intervalo de verdade (e
  -- não um dia só) — é o que permite as duas funções abaixo usarem o mesmo
  -- `between` para as três granularidades, sem um ramo especial por período.
  return query
    select private.month_label(g.m),
           make_date(extract(year from v_first)::int, g.m, 1),
           (make_date(extract(year from v_first)::int, g.m, 1)
              + interval '1 month' - interval '1 day')::date
      from generate_series(1, 12) as g(m)
     order by 2;
end;
$$;

comment on function private.series_buckets(text, text) is
  'Eixo X compartilhado pelos gráficos de consultas e financeiro: (rótulo, '
  'intervalo). week = últimos 7 dias a partir de hoje; month = todos os dias do '
  'mês pedido; year = os 12 meses do ano pedido. Sempre completo — dia/mês sem '
  'movimento vem com zero, nunca ausente.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · dashboard_stats() — os quatro cartões do topo
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.dashboard_stats()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(

    -- CONSULTAS DE HOJE: tudo que não foi cancelado. `canceled` está fora
    -- porque o cartão responde "quanta gente a clínica atende hoje" — consulta
    -- desmarcada não ocupa cadeira nem gera receita. `no_show` CONTINUA
    -- contando: o horário foi reservado, o profissional esperou, e esconder a
    -- falta some justamente com o número que a gestão precisa ver.
    'appointments_today', (
      select count(*)
        from public.appointment a
       where a.date = private.clinic_today()
         and a.status <> 'canceled'
    ),

    -- PACIENTES ATIVOS: o cadastro vivo. Quem sai da clínica vira
    -- status='inactive' (não se apaga paciente), então filtrar por 'active' é
    -- o que separa a base real do histórico.
    'active_patients', (
      select count(*)
        from public.patient p
       where p.status = 'active'
    ),

    -- CONFIRMAÇÕES PENDENTES: a fila de trabalho da recepção. `scheduled` é o
    -- estado "marcada mas ainda não confirmada" — assim que alguém confirma,
    -- vira 'confirmed' e sai daqui. Inclui HOJE (>= e não >): consulta das 17h
    -- ainda não confirmada é o caso MAIS urgente da lista, não o menos.
    -- O passado fica de fora: ninguém confirma consulta que já não aconteceu.
    'pending_confirmations', (
      select count(*)
        from public.appointment a
       where a.date >= private.clinic_today()
         and a.status = 'scheduled'
    ),

    -- FATURAMENTO DO MÊS: o que ENTROU, não o que foi faturado. Por isso
    -- status='paid' e recorte por received_at (data da baixa) e não por
    -- due_date — título vencido em julho e pago em agosto é dinheiro de agosto.
    -- Valor: received_amount, que é o que de fato caiu (inclui juros/multa);
    -- cai para net_amount quando a baixa veio sem valor — legado de importação.
    -- NÚMERO CRU: a máscara 'R$ 24.380,00' é do front, em pt-BR.
    'monthly_revenue', (
      select coalesce(sum(coalesce(nullif(r.received_amount, 0), r.net_amount)), 0)
        from public.receivable r
       where r.status = 'paid'
         and r.received_at >= date_trunc('month', private.clinic_today())::date
         and r.received_at <  (date_trunc('month', private.clinic_today()) + interval '1 month')::date
    )
  );
$$;

comment on function public.dashboard_stats() is
  'Os quatro cartões do dashboard em uma chamada: consultas de hoje (exceto '
  'canceladas), pacientes ativos, consultas futuras ainda não confirmadas e '
  'valor RECEBIDO no mês corrente (por received_at). Devolve números crus — a '
  'formatação de moeda é do front. SECURITY INVOKER: a RLS de appointment, '
  'patient e receivable é quem recorta o tenant.';

revoke execute on function public.dashboard_stats() from public;
grant  execute on function public.dashboard_stats() to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · appointment_series() — barras do gráfico "Consultas"
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.appointment_series(
  p_period    text,
  p_month_iso text default null
)
returns table (label text, value numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  with b as (
    select * from private.series_buckets(p_period, p_month_iso)
  ),
  -- O intervalo total, recortado UMA vez. Sem isto o `between` por balde faria
  -- o planner varrer appointment inteira; com ele o filtro casa com o índice
  -- (clinic_id, date) e o join fica sobre um punhado de linhas.
  span as (
    select min(b.day_from) as day_from, max(b.day_to) as day_to from b
  ),
  appointments as (
    select a.date as day
      from public.appointment a, span s
     -- Mesma regra do cartão "consultas de hoje": cancelada não é atendimento.
     -- Contá-la infla a barra com trabalho que não existiu.
     where a.status <> 'canceled'
       and a.date between s.day_from and s.day_to
  )
  select b.label, count(x.day)::numeric
    from b
    -- LEFT JOIN é o que preserva o balde vazio: sem match, count() dá 0 e a
    -- barra aparece rente ao eixo em vez de sumir do gráfico.
    left join appointments x on x.day between b.day_from and b.day_to
   group by b.label, b.day_from
   order by b.day_from;
$$;

comment on function public.appointment_series(text, text) is
  'Série de consultas NÃO canceladas para o gráfico de barras. p_period: '
  '''week'' (últimos 7 dias, ignora p_month_iso), ''month'' (dias do mês '
  'aaaa-mm) ou ''year'' (12 meses do ano de p_month_iso). Todos os baldes vêm '
  'preenchidos — dia sem consulta é 0, não é linha faltando. p_month_iso fora '
  'do formato levanta 22007.';

revoke execute on function public.appointment_series(text, text) from public;
grant  execute on function public.appointment_series(text, text) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · finance_series() — linhas do gráfico "Ganhos × Gastos"
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.finance_series(
  p_period    text,
  p_month_iso text default null
)
returns table (label text, income numeric, expenses numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  with b as (
    select * from private.series_buckets(p_period, p_month_iso)
  ),
  span as (
    select min(b.day_from) as day_from, max(b.day_to) as day_to from b
  ),
  -- REGIME DE CAIXA, não de competência: o gráfico é "o que entrou e o que
  -- saiu", então o eixo do tempo é a data da BAIXA (received_at / paid_at) e
  -- nunca o vencimento. Título em aberto não aparece aqui — projeção é assunto
  -- de public.cash_flow(), abaixo.
  moves as (
    select r.received_at as day,
           -- Mesma definição de "recebido" de dashboard_stats: o que caiu.
           coalesce(nullif(r.received_amount, 0), r.net_amount) as income,
           0::numeric                                           as expense
      from public.receivable r, span s
     where r.status = 'paid'
       and r.received_at between s.day_from and s.day_to
    union all
    select p.paid_at,
           0::numeric,
           -- paid_amount é o que saiu de fato (juros, multa, desconto de
           -- pontualidade); amount é o combinado. Cai para amount quando a
           -- baixa não registrou valor. Mesma expressão da view
           -- bank_account_balance — os dois números têm de bater.
           coalesce(p.paid_amount, p.amount)
      from public.payable p, span s
     where p.status = 'paid'
       and p.paid_at between s.day_from and s.day_to
  )
  select b.label,
         coalesce(sum(m.income),  0)::numeric,
         coalesce(sum(m.expense), 0)::numeric
    from b
    left join moves m on m.day between b.day_from and b.day_to
   group by b.label, b.day_from
   order by b.day_from;
$$;

comment on function public.finance_series(text, text) is
  'Série de ganhos × gastos no mesmo eixo X de appointment_series (os dois '
  'gráficos dividem private.series_buckets). REGIME DE CAIXA: income = '
  'recebíveis quitados por received_at, expenses = contas pagas por paid_at. '
  'Título em aberto não entra — para projeção use public.cash_flow().';

revoke execute on function public.finance_series(text, text) from public;
grant  execute on function public.finance_series(text, text) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · cash_flow() — o insumo da projeção acumulada
--
-- Devolve o PONTO DE PARTIDA e os MOVIMENTOS PREVISTOS, separados. O acumulado
-- (saldo dia a dia) continua sendo do front: é ele que decide onde começar a
-- somar e como desenhar a linha, e essa decisão muda com a tela, não com o dado.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.cash_flow(p_days int default 30)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_today date := private.clinic_today();
  v_last  date;
  v_base  numeric;
  v_days  jsonb;
begin
  -- Janela absurda não pode virar generate_series de milhões de linhas nem
  -- laço vazio silencioso: 1..365 cobre "próxima semana" e "próximo ano".
  if p_days is null or p_days < 1 or p_days > 365 then
    raise exception
      'Janela de projeção inválida: %. Informe de 1 a 365 dias.',
      coalesce(p_days::text, 'null')
      using errcode = '22023';  -- invalid_parameter_value
  end if;

  v_last := v_today + (p_days - 1);

  -- ── SALDO APURADO ──────────────────────────────────────────────────────────
  -- Decisão de produto: o "saldo inicial" do fluxo NÃO é um campo digitado, é
  -- o que a clínica tem AGORA — saldo de abertura das contas + tudo que já
  -- entrou − tudo que já saiu. Saldo digitado é saldo que mente assim que
  -- alguém esquece de atualizar.
  --
  -- Contas 'inactive' ficam de fora: conta encerrada não tem dinheiro dentro,
  -- só histórico (e as baixas que passaram por ela já estão nas duas somas
  -- seguintes).
  --
  -- cash_movement NÃO entra de propósito: a baixa de um título já é contada
  -- aqui e, quando ela também vira movimento de caixa, somar os dois contaria
  -- o mesmo dinheiro duas vezes.
  select coalesce((
           select sum(ba.opening_balance)
             from public.bank_account ba
            where ba.status = 'active'
         ), 0)
       + coalesce((
           select sum(coalesce(nullif(r.received_amount, 0), r.net_amount))
             from public.receivable r
            where r.status = 'paid'
         ), 0)
       - coalesce((
           select sum(coalesce(p.paid_amount, p.amount))
             from public.payable p
            where p.status = 'paid'
         ), 0)
    into v_base;

  -- ── PREVISTO: os próximos p_days dias ─────────────────────────────────────
  -- Recorte por VENCIMENTO (due_date), porque a pergunta é "quando esse
  -- dinheiro deveria se mexer". Só status pending/overdue: quitado já está
  -- dentro do base_balance e apareceria duas vezes. Vencido entra no dia do
  -- vencimento se ele cair na janela — não é "empurrado" para hoje: o fluxo
  -- mostra o compromisso na data dele, e a cobrança é outra tela.
  with days as (
    select (v_today + g.i)::date as day
      from generate_series(0, p_days - 1) as g(i)
  ),
  open_items as (
    -- ENTRADAS: open_amount (líquido − recebido, com piso em zero) e não
    -- gross_amount — o que falta receber de uma parcela já paga pela metade é
    -- só a metade.
    select r.due_date as day, r.open_amount as inflow, 0::numeric as outflow
      from public.receivable r
     where r.status in ('pending', 'overdue')
       and r.due_date between v_today and v_last
    union all
    -- SAÍDAS: espelho da entrada — o que ainda falta pagar, com o mesmo piso em
    -- zero (pagamento a maior por juros não pode virar "saída negativa" e
    -- abater a despesa do dia). Hoje paid_amount só existe em conta já quitada,
    -- então isto é idêntico a `amount`; está escrito assim para que uma futura
    -- baixa parcial não passe a superestimar a saída em silêncio.
    select p.due_date, 0::numeric, greatest(p.amount - coalesce(p.paid_amount, 0), 0)
      from public.payable p
     where p.status in ('pending', 'overdue')
       and p.due_date between v_today and v_last
  )
  select coalesce(jsonb_agg(t.obj order by t.day), '[]'::jsonb)
    into v_days
    from (
      select d.day,
             jsonb_build_object(
               'date',        d.day,          -- ISO aaaa-mm-dd; o front formata
               'entry_count', count(o.day),   -- quantos títulos vencem no dia
               'inflows',     coalesce(sum(o.inflow),  0),
               'outflows',    coalesce(sum(o.outflow), 0)
             ) as obj
        from days d
        -- LEFT JOIN outra vez pelo mesmo motivo dos gráficos: a projeção
        -- acumulada precisa de UM ponto por dia. Dia sem vencimento é um dia de
        -- saldo constante, não um dia inexistente.
        left join open_items o on o.day = d.day
       group by d.day
    ) t;

  return jsonb_build_object('base_balance', v_base, 'days', v_days);
end;
$$;

comment on function public.cash_flow(int) is
  'Insumo da projeção de caixa: { base_balance, days[] }. base_balance é o '
  'SALDO APURADO (abertura das contas ativas + recebido − pago), o ponto de '
  'partida do acumulado. days traz os próximos p_days dias (1..365, contando '
  'hoje) com os títulos em ABERTO por data de vencimento. O acumulado dia a dia '
  'é calculado no front — o banco entrega o insumo, não a linha do gráfico.';

revoke execute on function public.cash_flow(int) from public;
grant  execute on function public.cash_flow(int) to authenticated;


-- Helpers privados: o corpo das funções acima roda como o CHAMADOR
-- (security invoker), então é o `authenticated` que precisa do EXECUTE.
revoke execute on function private.clinic_today()              from public;
revoke execute on function private.parse_month_iso(text)       from public;
revoke execute on function private.weekday_label(date)         from public;
revoke execute on function private.month_label(int)            from public;
revoke execute on function private.series_buckets(text, text)  from public;

grant execute on function private.clinic_today()               to authenticated;
grant execute on function private.parse_month_iso(text)        to authenticated;
grant execute on function private.weekday_label(date)          to authenticated;
grant execute on function private.month_label(int)             to authenticated;
grant execute on function private.series_buckets(text, text)   to authenticated;


-- ═════════════════════════════════════════════════════════════════════════════
-- DÚVIDAS E PONTAS SOLTAS
--
-- 1. RECORTE DE CLÍNICA. Ver o cabeçalho: com 1 usuário = 1 clínica o resultado
--    é a clínica corrente; com duas, é a SOMA. O parâmetro `p_clinic` resolve,
--    mas só faz sentido quando a UI tiver o seletor.
--
-- 2. FUSO. 'America/Sao_Paulo' fixo, herdado de cash_flow_day. Para clínica em
--    Manaus/Rio Branco o corte do dia sai 1–2 h errado. A correção é
--    `clinic.timezone` + join em private.clinic_today().
--
-- 3. cash_flow() vs. a view cash_flow_day. A VIEW mistura realizado
--    (cash_movement) com previsto e não tem ponto de partida; esta função
--    separa base_balance de previsto e é a que o dashboard consome. Elas
--    respondem perguntas diferentes e por isso convivem — mas a view usa
--    `p.amount` cru na saída prevista, enquanto aqui usamos o saldo em aberto.
--    Elas só divergem se alguém registrar baixa PARCIAL em conta a pagar, o que
--    o app não faz hoje. Quando fizer, alinhar a view a esta função.
--
-- 4. 'week' ignora p_month_iso. O seletor de mês do gráfico continua na tela na
--    visão semanal (ele serve às outras duas), e passa a não ter efeito. É o
--    front que decide escondê-lo — o contrato do banco está documentado.
--
-- 5. monthly_revenue mudou de tipo: era string formatada no mock
--    ('R$ 24.380'), agora é numeric. O DashboardStats do domain.ts precisa
--    acompanhar (monthlyRevenue: number) e a formatação vai para a StatsCard.
-- ═════════════════════════════════════════════════════════════════════════════
