-- Migration recuperada do banco (drift): foi aplicada direto no Supabase via MCP
-- em 22/07/2026, sem arquivo local correspondente. O SQL abaixo e byte-a-byte o
-- mesmo que ja rodou no banco (supabase_migrations.schema_migrations) e NAO deve
-- ser editado. Revertida em seguida pela 20260722175632.

-- ── Dashboard / analytics aggregation RPCs (SECURITY DEFINER, clinic-scoped) ──
-- Contrato snake_case; o service no front converte para camelCase (mesma regra
-- de my_session/my_subscription). Escopo pela clínica corrente (auth_clinic_id)
-- + portão de feature; search_path fixado.

create or replace function public.dashboard_stats()
returns jsonb language plpgsql stable security definer set search_path to '' as $fn$
declare v_clinic uuid := private.auth_clinic_id();
begin
  if v_clinic is null then raise exception 'Usuário sem clínica ativa.' using errcode='42501'; end if;
  if not private.can_access_feature(v_clinic, 'dashboard') then raise exception 'Sem permissão.' using errcode='42501'; end if;
  return jsonb_build_object(
    'appointments_today',   (select count(*) from public.appointment where clinic_id=v_clinic and date=current_date and status <> 'canceled'),
    'active_patients',      (select count(*) from public.patient where clinic_id=v_clinic and status='active'),
    'pending_confirmations',(select count(*) from public.appointment where clinic_id=v_clinic and date=current_date and status='scheduled'),
    -- Faturamento do mês = dinheiro EFETIVAMENTE recebido no mês corrente
    -- (receivable.received_amount por received_at). Definição escolhida.
    'monthly_revenue', coalesce((
      select sum(received_amount) from public.receivable
       where clinic_id=v_clinic
         and received_at >= date_trunc('month', current_date)::date
         and received_at <  (date_trunc('month', current_date) + interval '1 month')::date
    ), 0)
  );
end; $fn$;

create or replace function public.appointment_series(p_period text, p_month date default current_date)
returns jsonb language plpgsql stable security definer set search_path to '' as $fn$
declare
  v_clinic uuid := private.auth_clinic_id();
  v_out jsonb;
  v_year int := extract(year from p_month)::int;
  v_month int := extract(month from p_month)::int;
  months text[] := array['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  days   text[] := array['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  v_week_start date := (date_trunc('week', p_month))::date;
begin
  if v_clinic is null then raise exception 'Usuário sem clínica ativa.' using errcode='42501'; end if;
  if not private.can_access_feature(v_clinic, 'dashboard') then raise exception 'Sem permissão.' using errcode='42501'; end if;

  if p_period = 'year' then
    select jsonb_agg(jsonb_build_object('label', months[m], 'value',
      (select count(*) from public.appointment a where a.clinic_id=v_clinic and a.status<>'canceled'
        and extract(year from a.date)=v_year and extract(month from a.date)=m)) order by m)
      into v_out from generate_series(1,12) m;
  elsif p_period = 'month' then
    select jsonb_agg(jsonb_build_object('label', 'Sem '||w, 'value',
      (select count(*) from public.appointment a where a.clinic_id=v_clinic and a.status<>'canceled'
        and extract(year from a.date)=v_year and extract(month from a.date)=v_month
        and ceil(extract(day from a.date)/7.0)=w)) order by w)
      into v_out from generate_series(1,5) w;
  else
    select jsonb_agg(jsonb_build_object('label', days[d+1], 'value',
      (select count(*) from public.appointment a where a.clinic_id=v_clinic and a.status<>'canceled'
        and a.date = v_week_start + d)) order by d)
      into v_out from generate_series(0,6) d;
  end if;
  return coalesce(v_out, '[]'::jsonb);
end; $fn$;

create or replace function public.finance_series(p_period text, p_month date default current_date)
returns jsonb language plpgsql stable security definer set search_path to '' as $fn$
declare
  v_clinic uuid := private.auth_clinic_id();
  v_out jsonb;
  v_year int := extract(year from p_month)::int;
  v_month int := extract(month from p_month)::int;
  months text[] := array['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  days   text[] := array['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  v_week_start date := (date_trunc('week', p_month))::date;
begin
  if v_clinic is null then raise exception 'Usuário sem clínica ativa.' using errcode='42501'; end if;
  if not private.can_access_feature(v_clinic, 'finance') then raise exception 'Sem permissão.' using errcode='42501'; end if;

  if p_period = 'year' then
    select jsonb_agg(jsonb_build_object('label', months[m],
        'income',   (select coalesce(sum(received_amount),0) from public.receivable r where r.clinic_id=v_clinic and r.received_at is not null and extract(year from r.received_at)=v_year and extract(month from r.received_at)=m),
        'expenses', (select coalesce(sum(paid_amount),0)     from public.payable p    where p.clinic_id=v_clinic and p.paid_at is not null    and extract(year from p.paid_at)=v_year and extract(month from p.paid_at)=m)
      ) order by m) into v_out from generate_series(1,12) m;
  elsif p_period = 'month' then
    select jsonb_agg(jsonb_build_object('label', 'Sem '||w,
        'income',   (select coalesce(sum(received_amount),0) from public.receivable r where r.clinic_id=v_clinic and r.received_at is not null and extract(year from r.received_at)=v_year and extract(month from r.received_at)=v_month and ceil(extract(day from r.received_at)/7.0)=w),
        'expenses', (select coalesce(sum(paid_amount),0)     from public.payable p    where p.clinic_id=v_clinic and p.paid_at is not null    and extract(year from p.paid_at)=v_year and extract(month from p.paid_at)=v_month and ceil(extract(day from p.paid_at)/7.0)=w)
      ) order by w) into v_out from generate_series(1,5) w;
  else
    select jsonb_agg(jsonb_build_object('label', days[d+1],
        'income',   (select coalesce(sum(received_amount),0) from public.receivable r where r.clinic_id=v_clinic and r.received_at = v_week_start + d),
        'expenses', (select coalesce(sum(paid_amount),0)     from public.payable p    where p.clinic_id=v_clinic and p.paid_at    = v_week_start + d)
      ) order by d) into v_out from generate_series(0,6) d;
  end if;
  return coalesce(v_out, '[]'::jsonb);
end; $fn$;

create or replace function public.cash_flow()
returns jsonb language plpgsql stable security definer set search_path to '' as $fn$
declare v_clinic uuid := private.auth_clinic_id();
begin
  if v_clinic is null then raise exception 'Usuário sem clínica ativa.' using errcode='42501'; end if;
  if not private.can_access_feature(v_clinic, 'finance') then raise exception 'Sem permissão.' using errcode='42501'; end if;
  return jsonb_build_object(
    -- Ponto de partida do acumulado = caixa DE HOJE (saldo corrente das contas):
    -- opening_balance + recebido - pago, pela view bank_account_balance.
    'base_balance', coalesce((select sum(current_balance) from public.bank_account_balance where clinic_id=v_clinic and status='active'), 0),
    'days', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', to_char(day, 'YYYY-MM-DD'), 'date', day,
        'entry_count', entry_count, 'inflows', inflows, 'outflows', outflows
      ) order by day) from public.cash_flow_day where clinic_id=v_clinic
    ), '[]'::jsonb)
  );
end; $fn$;

revoke all on function public.dashboard_stats(), public.appointment_series(text,date), public.finance_series(text,date), public.cash_flow() from public, anon;
grant execute on function public.dashboard_stats(), public.appointment_series(text,date), public.finance_series(text,date), public.cash_flow() to authenticated;
