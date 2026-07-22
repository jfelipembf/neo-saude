-- Migration recuperada do banco (drift): foi aplicada direto no Supabase via MCP
-- em 22/07/2026, sem arquivo local correspondente. O SQL abaixo e byte-a-byte o
-- mesmo que ja rodou no banco (supabase_migrations.schema_migrations) e NAO deve
-- ser editado. Reverte a 20260722175039.

-- Reverte a migration analytics_rpcs (redundante): as agregações já existiam em
-- 20260722150000_dashboard_aggregates.sql. Remove os duplicados que criei e
-- restaura o dashboard_stats() ORIGINAL (SECURITY INVOKER, language sql).
drop function if exists public.appointment_series(text, date);
drop function if exists public.finance_series(text, date);
drop function if exists public.cash_flow();

create or replace function public.dashboard_stats()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'appointments_today', (
      select count(*)
        from public.appointment a
       where a.date = private.clinic_today()
         and a.status <> 'canceled'
    ),
    'active_patients', (
      select count(*)
        from public.patient p
       where p.status = 'active'
    ),
    'pending_confirmations', (
      select count(*)
        from public.appointment a
       where a.date >= private.clinic_today()
         and a.status = 'scheduled'
    ),
    'monthly_revenue', (
      select coalesce(sum(coalesce(nullif(r.received_amount, 0), r.net_amount)), 0)
        from public.receivable r
       where r.status = 'paid'
         and r.received_at >= date_trunc('month', private.clinic_today())::date
         and r.received_at <  (date_trunc('month', private.clinic_today()) + interval '1 month')::date
    )
  );
$$;

revoke execute on function public.dashboard_stats() from public;
grant  execute on function public.dashboard_stats() to authenticated;
