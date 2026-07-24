-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — FATURAMENTO DO DASHBOARD POR COMPETÊNCIA
--
-- Fecha o vaivém das migrations 20260724230000→231500→233000→232000: o card
-- "Faturamento" somava recebíveis PAGOS por received_at (regime de caixa), e
-- uma venda no cartão sumia do Dashboard até o repasse da adquirente — o dono
-- vendia de manhã e o número não mexia.
--
-- Definição nova (docs/modelo-contabil.md): Faturamento = quanto foi VENDIDO
-- no período — sum(gross_amount) por competence_date, status <> 'canceled',
-- pago ou não. O regime de caixa continua existindo onde ele é a pergunta
-- certa: finance_series (gráfico Ganhos × Gastos), cash_flow, saldos de conta.
-- Gastos seguem caixa (paid_at): "quanto saiu" — pergunta de caixa mesmo.
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function public.dashboard_stats_period(
  p_from date, p_to date, p_prev_from date, p_prev_to date
)
returns jsonb
language plpgsql
stable
set search_path to ''
as $function$
declare
  v_to_excl      date := p_to + 1;
  v_prev_to_excl date := p_prev_to + 1;
  v_lo           date := least(p_from, p_prev_from);   -- borda inferior das 2 janelas
  v_sched_cur    bigint;  v_sched_prev   bigint;
  v_done_cur     bigint;  v_done_prev    bigint;
  v_revenue_cur  numeric; v_revenue_prev numeric;
  v_expense_cur  numeric; v_expense_prev numeric;
  v_targets      jsonb;
begin
  -- ── CONSULTAS (por date; canceladas fora, no_show conta) ───────────────────
  select count(*) filter (where a.date >= p_from      and a.date < v_to_excl),
         count(*) filter (where a.date >= p_prev_from and a.date < v_prev_to_excl),
         count(*) filter (where a.date >= p_from      and a.date < v_to_excl      and a.status = 'completed'),
         count(*) filter (where a.date >= p_prev_from and a.date < v_prev_to_excl and a.status = 'completed')
    into v_sched_cur, v_sched_prev, v_done_cur, v_done_prev
    from public.appointment a
   where a.status <> 'canceled'
     and a.date >= v_lo and a.date < greatest(v_to_excl, v_prev_to_excl);

  -- ── FATURAMENTO (COMPETÊNCIA: o que foi vendido no período, BRUTO) ─────────
  -- Pago ou não: a venda no cartão de hoje aparece HOJE (o dinheiro dela cai
  -- depois, e isso é assunto do gráfico de caixa/fluxo, não deste card).
  select coalesce(sum(r.gross_amount) filter (where r.competence_date >= p_from and r.competence_date < v_to_excl), 0),
         coalesce(sum(r.gross_amount) filter (where r.competence_date >= p_prev_from and r.competence_date < v_prev_to_excl), 0)
    into v_revenue_cur, v_revenue_prev
    from public.receivable r
   where r.status <> 'canceled'
     and r.competence_date >= v_lo and r.competence_date < greatest(v_to_excl, v_prev_to_excl);

  -- ── DESPESAS (regime de caixa, paid_at) ────────────────────────────────────
  select coalesce(sum(coalesce(p.paid_amount, p.amount))
                    filter (where p.paid_at >= p_from and p.paid_at < v_to_excl), 0),
         coalesce(sum(coalesce(p.paid_amount, p.amount))
                    filter (where p.paid_at >= p_prev_from and p.paid_at < v_prev_to_excl), 0)
    into v_expense_cur, v_expense_prev
    from public.payable p
   where p.status = 'paid'
     and p.paid_at >= v_lo and p.paid_at < greatest(v_to_excl, v_prev_to_excl);

  -- ── METAS prorrateadas por dia sobre [p_from, p_to] ────────────────────────
  select coalesce(jsonb_object_agg(metric, total), '{}'::jsonb)
    into v_targets
    from (
      select g.metric::text as metric,
             sum( g.monthly[extract(month from d)::int]::numeric
                  / extract(day from (date_trunc('month', d) + interval '1 month - 1 day')) ) as total
        from generate_series(p_from, p_to, interval '1 day') as d
        join public.clinic_goal g on g.year = extract(year from d)::int
       where g.monthly[extract(month from d)::int] is not null
       group by g.metric
    ) t;

  return jsonb_build_object(
    'metrics', jsonb_build_object(
      'appointments_scheduled', jsonb_build_object('current', v_sched_cur,   'previous', v_sched_prev,   'target', v_targets -> 'appointments_scheduled'),
      'appointments_completed', jsonb_build_object('current', v_done_cur,    'previous', v_done_prev,    'target', v_targets -> 'appointments_completed'),
      'revenue',                jsonb_build_object('current', v_revenue_cur, 'previous', v_revenue_prev, 'target', v_targets -> 'revenue'),
      'expenses',               jsonb_build_object('current', v_expense_cur, 'previous', v_expense_prev, 'target', v_targets -> 'expenses')
    )
  );
end;
$function$;

comment on function public.dashboard_stats_period(date, date, date, date) is
  'Métricas do Dashboard num período [p_from,p_to] vs [p_prev_from,p_prev_to] '
  '(o front escolhe as janelas por preset). Faturamento = COMPETÊNCIA '
  '(gross_amount por competence_date, <> canceled — quanto foi vendido, pago '
  'ou não); Gastos = caixa (paid_at). Meta prorrateada por dia. '
  'Ver docs/modelo-contabil.md.';

revoke all on function public.dashboard_stats_period(date, date, date, date) from public, anon;
grant execute on function public.dashboard_stats_period(date, date, date, date) to authenticated;
