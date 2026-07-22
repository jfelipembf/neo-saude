-- Item 4: aprovação de orçamento no SERVIDOR, para que a linha de CARTÃO nasça
-- como repasse da adquirente (D+N, com taxa, debtor='acquirer') — igual ao
-- caminho do procedimento direto — em vez de parcela mensal do paciente sem taxa.
-- Formas do paciente (pix/dinheiro/boleto/cheque/ted) seguem mensais, negociadas
-- em meses. Numeração 1/N global entre todas as formas.
--
-- SECURITY DEFINER: gerar recebível exige a feature 'finance' na policy; a checagem
-- de tenant + permissão é explícita aqui. Reaproveita private.card_installment_plan.
create or replace function public.approve_quote(p_quote uuid, p_plan jsonb default null)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_clinic   uuid;
  v_patient  uuid;
  v_name     text;
  v_issue    date;
  v_total    numeric;
  v_inst_def integer;
  v_existing integer;
  v_total_cents bigint;
  v_sum_cents   bigint;
  v_count    integer := 0;
begin
  select q.clinic_id, q.patient_id, q.name, q.issue_date,
         coalesce(q.total, q.items_total - q.discount), greatest(1, coalesce(q.installments, 1))
    into v_clinic, v_patient, v_name, v_issue, v_total, v_inst_def
    from public.quote q where q.id = p_quote;

  if v_clinic is null then
    raise exception 'Orçamento não encontrado.' using errcode = '42501';
  end if;
  if not (v_clinic = any(private.auth_clinic_ids()))
     or not private.can_edit_feature(v_clinic, 'finance') then
    raise exception 'Sem permissão financeira nesta clínica.' using errcode = '42501';
  end if;

  select count(*) into v_existing from public.receivable where quote_id = p_quote;

  if v_existing = 0 and v_total > 0 then
    -- Sem plano (chamadas antigas): pix mensal desde a emissão.
    if p_plan is null or jsonb_array_length(p_plan) = 0 then
      p_plan := jsonb_build_array(jsonb_build_object(
        'method', 'pix', 'amount', v_total, 'installments', v_inst_def,
        'first_due_date', coalesce(v_issue, (now() at time zone 'America/Sao_Paulo')::date)));
    end if;

    v_total_cents := round(v_total * 100)::bigint;
    select coalesce(sum(round((e->>'amount')::numeric * 100)), 0)::bigint into v_sum_cents
      from jsonb_array_elements(p_plan) e;
    if v_sum_cents <> v_total_cents then
      raise exception 'O plano de pagamento não fecha com o total do orçamento.' using errcode = '23514';
    end if;

    with plan as (
      select (e->>'method')::public.payment_method as method,
             (e->>'amount')::numeric               as amount,
             greatest(1, coalesce((e->>'installments')::int, 1)) as inst,
             (e->>'first_due_date')::date          as first_due,
             nullif(e->>'acquirer_id', '')::uuid   as acq,
             ord
        from jsonb_array_elements(p_plan) with ordinality as t(e, ord)
    ),
    gen as (
      -- CARTÃO: repasse D+N com taxa (debtor='acquirer' vem de acquirer_id).
      select p.ord, cp.installment_number as sub_n, cp.due_date, p.method,
             cp.gross_amount as gross, cp.fee, p.acq as acquirer
        from plan p
        cross join lateral private.card_installment_plan(
          v_clinic, p.acq, p.amount, p.inst, p.first_due, p.method) cp
       where p.acq is not null and p.method in ('credit', 'debit')
      union all
      -- PACIENTE: parcelas MENSAIS a partir do 1º vencimento. Trava R$ 0,00:
      -- nº de parcelas limitado aos centavos (mesma defesa do card_installment_plan).
      select p.ord, k + 1 as sub_n,
             (p.first_due + (k * interval '1 month'))::date as due_date, p.method,
             (calc.v_base + case when k = 0 then calc.v_rem else 0 end)::numeric / 100 as gross,
             0::numeric as fee, null::uuid as acquirer
        from plan p
        cross join lateral (
          select least(p.inst, greatest(1, round(p.amount * 100)::bigint)) as n_eff,
                 round(p.amount * 100)::bigint / least(p.inst, greatest(1, round(p.amount * 100)::bigint)) as v_base,
                 round(p.amount * 100)::bigint
                   - (round(p.amount * 100)::bigint / least(p.inst, greatest(1, round(p.amount * 100)::bigint)))
                     * least(p.inst, greatest(1, round(p.amount * 100)::bigint)) as v_rem
        ) calc
        cross join generate_series(0, calc.n_eff - 1) as k
       where not (p.acq is not null and p.method in ('credit', 'debit'))
    ),
    numbered as (
      select g.*, row_number() over (order by g.ord, g.sub_n) as n,
             count(*) over () as total
        from gen g
    )
    insert into public.receivable (
      clinic_id, description, source, due_date, method, gross_amount, fee, status,
      patient_id, quote_id, installment_number, installment_count, acquirer_id)
    select v_clinic,
           v_name || ' — parcela ' || nm.n || '/' || nm.total || ' (' ||
             case nm.method
               when 'cash' then 'Dinheiro' when 'credit' then 'Crédito'
               when 'debit' then 'Débito'  when 'boleto' then 'Boleto'
               when 'check' then 'Cheque'  when 'pix' then 'Pix'
               when 'wire' then 'TED' end || ')',
           'Orçamentos', nm.due_date, nm.method, nm.gross, nm.fee, 'pending',
           v_patient, p_quote, nm.n, nm.total, nm.acquirer
      from numbered nm;

    get diagnostics v_count = row_count;
  end if;

  update public.quote set status = 'approved' where id = p_quote;
  return v_count;
end;
$function$;

comment on function public.approve_quote(uuid, jsonb) is
  'Aprova um orçamento e gera as parcelas em Contas a Receber. Linha de cartão '
  'vira repasse da adquirente (D+N, taxa por nº de parcelas); demais formas são '
  'mensais do paciente. Idempotente (não duplica se já há recebíveis).';

revoke all on function public.approve_quote(uuid, jsonb) from public;
grant execute on function public.approve_quote(uuid, jsonb) to authenticated, service_role;
