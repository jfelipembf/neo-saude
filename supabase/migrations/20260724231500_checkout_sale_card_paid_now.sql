-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — PDV: CARTÃO TAMBÉM NASCE PAGO NA HORA
--
-- 20260724230000_checkout_sale_cash_paid deixou só dinheiro/pix quitando na
-- hora; cartão continuava 'pending' até a data de repasse da adquirente
-- (mesmo padrão de approve_quote). Decisão confirmada com o dono: no PDV,
-- TODA forma de pagamento — inclusive cartão — já nasce quitada no momento
-- da venda (é uma venda de balcão, não uma promessa de pagamento futuro).
-- due_date/installment_number/fee continuam gravados (histórico de como o
-- repasse seria), só o status/received_at/received_amount é que mudam.
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function public.checkout_sale(
  p_patient  uuid,
  p_sale_date date,
  p_discount numeric,
  p_items    jsonb,
  p_plan     jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_clinic      uuid;
  v_sale        uuid;
  v_total       numeric;
  v_total_cents bigint;
  v_sum_cents   bigint;
  v_description text;
begin
  select clinic_id into v_clinic from public.patient where id = p_patient;
  if v_clinic is null then
    raise exception 'Paciente não encontrado.' using errcode = '23503';
  end if;
  -- 'patients' (não 'finance'): quem vende pelo carrinho do perfil do
  -- paciente é recepção/fisioterapeuta — o mesmo raciocínio de
  -- record_treatment_session (20260722233500) para não deixar a venda refém
  -- de uma permissão financeira que quem atende normalmente não tem.
  if not (v_clinic = any(private.auth_clinic_ids()))
     or not private.can_edit_feature(v_clinic, 'patients', 'schedule') then
    raise exception 'Sem permissão para vender nesta clínica.' using errcode = '42501';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'A venda precisa de pelo menos um item.' using errcode = '23514';
  end if;

  insert into public.sale (clinic_id, patient_id, sale_date, discount, created_by)
  values (v_clinic, p_patient, coalesce(p_sale_date, current_date), coalesce(p_discount, 0), (select auth.uid()))
  returning id into v_sale;

  insert into public.sale_item (clinic_id, sale_id, service_id, name, price, quantity)
  select v_clinic, v_sale, s.id, s.name, s.price, greatest(1, coalesce((it->>'quantity')::int, 1))
    from jsonb_array_elements(p_items) it
    join public.service s on s.id = (it->>'service_id')::uuid and s.clinic_id = v_clinic;

  -- Todo item do carrinho tem de ter casado com um serviço real da clínica —
  -- um id inválido não pode simplesmente sumir da venda em silêncio.
  if (select count(*) from public.sale_item where sale_id = v_sale) <> jsonb_array_length(p_items) then
    raise exception 'Um ou mais itens da venda não foram encontrados no catálogo.' using errcode = '23503';
  end if;

  -- Direito a sessões: só nasce pra linha de PACOTE (modality='package').
  insert into public.patient_service_entitlement (
    clinic_id, patient_id, service_id, sale_item_id, total_sessions, purchased_at, expires_at
  )
  select v_clinic, p_patient, si.service_id, si.id, s.sessions * si.quantity,
         coalesce(p_sale_date, current_date),
         case when s.duration_qty > 0 then
           (coalesce(p_sale_date, current_date) + make_interval(
              days   => case when s.duration_unit = 'days'   then s.duration_qty else 0 end,
              weeks  => case when s.duration_unit = 'weeks'  then s.duration_qty else 0 end,
              months => case when s.duration_unit = 'months' then s.duration_qty else 0 end
            ))::date
         else null end
    from public.sale_item si
    join public.service s on s.id = si.service_id and s.clinic_id = v_clinic
   where si.sale_id = v_sale and s.modality = 'package' and coalesce(s.sessions, 0) > 0;

  select total, string_agg(si.name || case when si.quantity > 1 then ' (' || si.quantity || 'x)' else '' end, ', ')
    into v_total, v_description
    from public.sale s
    join public.sale_item si on si.sale_id = s.id
   where s.id = v_sale
   group by s.total;

  if v_total > 0 then
    if p_plan is null or jsonb_array_length(p_plan) = 0 then
      raise exception 'Informe o plano de pagamento.' using errcode = '23514';
    end if;

    v_total_cents := round(v_total * 100)::bigint;
    select coalesce(sum(round((e->>'amount')::numeric * 100)), 0)::bigint into v_sum_cents
      from jsonb_array_elements(p_plan) e;
    if v_sum_cents <> v_total_cents then
      raise exception 'O plano de pagamento não fecha com o total da venda.' using errcode = '23514';
    end if;

    with plan as (
      select (e->>'method')::public.payment_method as method,
             (e->>'amount')::numeric               as amount,
             greatest(1, coalesce((e->>'installments')::int, 1)) as inst,
             nullif(e->>'acquirer_id', '')::uuid   as acq,
             nullif(e->>'card_brand', '')          as brand,
             nullif(e->>'authorization_code', '')  as auth_code,
             ord
        from jsonb_array_elements(p_plan) with ordinality as t(e, ord)
    ),
    gen as (
      -- CARTÃO com adquirente: due_date/fee/parcelas continuam vindo da
      -- card_installment_plan (repasse real da adquirente, pra conciliação
      -- futura), mas a VENDA já quita na hora (ver comment do arquivo).
      select p.ord, cp.installment_number as sub_n, cp.installment_count as cnt,
             cp.due_date, p.method, cp.gross_amount as gross, cp.fee, p.acq as acquirer,
             p.brand, p.auth_code
        from plan p
        cross join lateral private.card_installment_plan(
          v_clinic, p.acq, p.amount, p.inst, coalesce(p_sale_date, current_date), p.method) cp
       where p.acq is not null and p.method in ('credit', 'debit')
      union all
      -- Demais formas (dinheiro/pix, ou débito sem adquirente): à vista, sem taxa.
      select p.ord, 1, 1, coalesce(p_sale_date, current_date), p.method, p.amount, 0::numeric, null::uuid,
             p.brand, p.auth_code
        from plan p
       where not (p.acq is not null and p.method in ('credit', 'debit'))
    )
    insert into public.receivable (
      clinic_id, description, source, due_date, method, gross_amount, fee, status,
      patient_id, installment_number, installment_count, acquirer_id, notes,
      received_at, received_amount
    )
    select v_clinic,
           'Venda: ' || v_description
             || case when g.cnt > 1 then ' — parcela ' || g.sub_n || '/' || g.cnt else '' end,
           'Vendas', g.due_date, g.method, g.gross, g.fee, 'paid',
           p_patient, g.sub_n, g.cnt, g.acquirer,
           case when g.brand is not null then
             'Bandeira: ' || g.brand
               || case when g.auth_code is not null then ' · Autorização: ' || g.auth_code else '' end
           else null end,
           coalesce(p_sale_date, current_date), g.gross - g.fee
      from gen g
     order by g.ord, g.sub_n;
  end if;

  return v_sale;
end;
$$;

comment on function public.checkout_sale(uuid, date, numeric, jsonb, jsonb) is
  'Fecha uma venda do PDV: grava sale/sale_item, cria patient_service_entitlement '
  'pras linhas de pacote e gera os recebíveis do plano de pagamento (mesmo '
  'desenho de approve_quote — card_installment_plan pro cartão, à vista pro '
  'resto). TODA forma de pagamento nasce status=''paid''/received_at=data da '
  'venda — é venda de balcão, o dinheiro já entrou (decisão do dono: PDV não '
  'segue o mesmo regime de orçamento aprovado). p_items = [{service_id, '
  'quantity}]; p_plan = [{method, amount, installments?, acquirer_id?, '
  'card_brand?, authorization_code?}] — bandeira/autorização (crédito/débito) '
  'vão pro notes do recebível. SECURITY DEFINER: exige patients/schedule, não '
  'finance — quem vende pelo perfil do paciente não tem acesso ao Financeiro.';
