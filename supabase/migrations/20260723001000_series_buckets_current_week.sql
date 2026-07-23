-- ─────────────────────────────────────────────────────────────────────────────
-- Gráficos: a visão "Semana" passa a ser a SEMANA CIVIL CORRENTE (segunda a
-- domingo, contendo hoje) — antes eram os últimos 7 dias terminando hoje, e uma
-- consulta agendada para amanhã simplesmente não aparecia no gráfico. A agenda
-- é feita para frente; o gráfico da semana precisa enxergar a semana inteira.
-- Vale para consultas e financeiro (o eixo é compartilhado).
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

  -- SEMANA = a semana civil corrente (Seg→Dom, contendo hoje). Inclui os dias
  -- que AINDA VÊM — consulta agendada para amanhã aparece na barra de amanhã.
  -- É a única visão que ignora p_month_iso — inclusive aceitando-o nulo.
  if p_period = 'week' then
    return query
      select private.weekday_label(d.day), d.day, d.day
        from (
          select (date_trunc('week', v_today)::date + g.i)::date as day
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
  'intervalo). week = semana civil corrente (Seg→Dom, contendo hoje); month = '
  'todos os dias do mês pedido; year = os 12 meses do ano pedido. Sempre '
  'completo — dia/mês sem movimento vem com zero, nunca ausente.';
