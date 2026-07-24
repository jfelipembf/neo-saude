-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — CONTRATO RECORRENTE VIRA DIREITO DE USO
--
-- O catálogo tem duas modalidades (service.modality): 'package' (pacote de N
-- sessões) e 'common' (Contrato Comum — a mensalidade: X vezes por semana
-- durante um período). Mas checkout_sale só criava patient_service_entitlement
-- para 'package':
--
--   where si.sale_id = v_sale and s.modality = 'package' and coalesce(s.sessions,0) > 0
--
-- Vender um contrato cobrava o paciente e não gerava direito NENHUM, em
-- silêncio. Como todo o resto do app pendura o direito no entitlement, o
-- paciente de mensalidade ficava sem matrícula em turma e — depois da regra
-- 20260725150000 — sem conseguir nem agendar consulta.
--
-- O modelo já estava construído PELA METADE do lado do consumo: ScheduleBoard e
-- classGroupRosterService leem `service.weekly_limit` ATRAVÉS do entitlement
-- ("Limite semanal do contrato (2 dias/semana) seria excedido"), ou seja, o
-- design já pressupunha que contrato gerasse entitlement. Faltava a criação.
--
-- MODELO ESCOLHIDO: direito por PERÍODO, sem teto de sessões.
-- Mensalidade não é pacote de N sessões — é acesso durante uma janela, contido
-- pelo limite semanal. Converter em sessões (weekly_limit × semanas) daria um
-- teto arbitrário que erra em mês de 5 semanas, cobrando por 10 e liberando 8.
--
-- used_sessions/scheduled_sessions CONTINUAM contando no recorrente: saber
-- quantas sessões o paciente fez no mês é informação útil. O que muda é que
-- elas não são mais um teto.
--
-- Depende de: 20260724150000_sales_and_entitlements.sql,
--             20260725150000_appointment_requires_entitlement.sql.
-- ═════════════════════════════════════════════════════════════════════════════

create type public.entitlement_kind as enum ('package', 'recurring');

comment on type public.entitlement_kind is
  'package = direito a N sessões (service.modality=package). recurring = acesso '
  'durante a validade, sem teto de sessões, contido por service.weekly_limit '
  '(service.modality=common, a mensalidade).';

alter table public.patient_service_entitlement
  add column kind public.entitlement_kind not null default 'package';

-- No recorrente não existe total: o direito é a janela, não uma quantidade.
alter table public.patient_service_entitlement
  alter column total_sessions drop not null;

alter table public.patient_service_entitlement
  add constraint entitlement_kind_shape_ck check (
    (kind = 'package'   and total_sessions is not null and total_sessions > 0)
    or
    (kind = 'recurring' and total_sessions is null)
  );

comment on column public.patient_service_entitlement.kind is
  'Espelha service.modality no momento da venda. Editar o serviço depois NÃO '
  'muda direito já vendido — por isso a cópia, e não um join.';
comment on column public.patient_service_entitlement.total_sessions is
  'Só no kind=package. NULL no recorrente: o direito é a validade, não uma '
  'quantidade (ver entitlement_kind_shape_ck).';

-- ── checkout_sale: contrato passa a gerar direito ───────────────────────────
-- Só as duas linhas de insert do entitlement mudam; o resto da função é o mesmo.
-- ⚠️ A ORDEM dos parâmetros tem de ser idêntica à da função existente
-- (p_patient, p_sale_date, p_discount, p_items, p_plan). `create or replace`
-- com outra ordem não substitui: cria uma SOBRECARGA, e o PostgREST passa a
-- errar por ambiguidade na hora de resolver a RPC.
create or replace function public.checkout_sale(
  p_patient uuid, p_sale_date date, p_discount numeric, p_items jsonb, p_plan jsonb
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_clinic      uuid;
  v_sale        uuid;
  v_sale_day    date := coalesce(p_sale_date, current_date);
  v_total       numeric;
  v_total_cents bigint;
  v_sum_cents   bigint;
  v_description text;
begin
  select clinic_id into v_clinic from public.patient where id = p_patient;
  if v_clinic is null then
    raise exception 'Paciente não encontrado.' using errcode = '23503';
  end if;
  if not (v_clinic = any(private.auth_clinic_ids()))
     or not private.can_edit_feature(v_clinic, 'patients', 'schedule') then
    raise exception 'Sem permissão para vender nesta clínica.' using errcode = '42501';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'A venda precisa de pelo menos um item.' using errcode = '23514';
  end if;

  insert into public.sale (clinic_id, patient_id, sale_date, discount, created_by)
  values (v_clinic, p_patient, v_sale_day, coalesce(p_discount, 0), (select auth.uid()))
  returning id into v_sale;

  insert into public.sale_item (clinic_id, sale_id, service_id, name, price, quantity)
  select v_clinic, v_sale, s.id, s.name, s.price, greatest(1, coalesce((it->>'quantity')::int, 1))
    from jsonb_array_elements(p_items) it
    join public.service s on s.id = (it->>'service_id')::uuid and s.clinic_id = v_clinic;

  if (select count(*) from public.sale_item where sale_id = v_sale) <> jsonb_array_length(p_items) then
    raise exception 'Um ou mais itens da venda não foram encontrados no catálogo.' using errcode = '23503';
  end if;

  -- PACOTE: N sessões, validade opcional.
  insert into public.patient_service_entitlement (
    clinic_id, patient_id, service_id, sale_item_id, kind, total_sessions, purchased_at, expires_at
  )
  select v_clinic, p_patient, si.service_id, si.id, 'package', s.sessions * si.quantity,
         v_sale_day,
         case when s.duration_qty > 0 then
           (v_sale_day + make_interval(
              days   => case when s.duration_unit = 'days'   then s.duration_qty else 0 end,
              weeks  => case when s.duration_unit = 'weeks'  then s.duration_qty else 0 end,
              months => case when s.duration_unit = 'months' then s.duration_qty else 0 end
            ))::date
         else null end
    from public.sale_item si
    join public.service s on s.id = si.service_id and s.clinic_id = v_clinic
   where si.sale_id = v_sale and s.modality = 'package' and coalesce(s.sessions, 0) > 0;

  -- CONTRATO (mensalidade): acesso durante a validade, sem teto.
  -- Exige duration_qty > 0: contrato sem prazo seria direito perpétuo saindo de
  -- uma venda avulsa. Serviço 'common' com duração 0 seguirá sem gerar direito —
  -- o cadastro dele é que precisa de um período.
  -- quantity multiplica o PRAZO: comprar 3x um contrato mensal = 3 meses.
  insert into public.patient_service_entitlement (
    clinic_id, patient_id, service_id, sale_item_id, kind, total_sessions, purchased_at, expires_at
  )
  select v_clinic, p_patient, si.service_id, si.id, 'recurring', null,
         v_sale_day,
         (v_sale_day + make_interval(
            days   => case when s.duration_unit = 'days'   then s.duration_qty * si.quantity else 0 end,
            weeks  => case when s.duration_unit = 'weeks'  then s.duration_qty * si.quantity else 0 end,
            months => case when s.duration_unit = 'months' then s.duration_qty * si.quantity else 0 end
          ))::date
    from public.sale_item si
    join public.service s on s.id = si.service_id and s.clinic_id = v_clinic
   where si.sale_id = v_sale and s.modality = 'common' and s.duration_qty > 0;

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
      select p.ord, cp.installment_number as sub_n, cp.installment_count as cnt,
             cp.due_date, p.method, cp.gross_amount as gross, cp.fee, p.acq as acquirer,
             p.brand, p.auth_code, false as paid_now
        from plan p
        cross join lateral private.card_installment_plan(
          v_clinic, p.acq, p.amount, p.inst, v_sale_day, p.method) cp
       where p.acq is not null and p.method in ('credit', 'debit')
      union all
      select p.ord, 1, 1, v_sale_day, p.method, p.amount, 0::numeric, null::uuid,
             p.brand, p.auth_code, true
        from plan p
       where not (p.acq is not null and p.method in ('credit', 'debit'))
    )
    insert into public.receivable (
      clinic_id, description, source, competence_date, due_date, method,
      gross_amount, fee, status, patient_id, installment_number,
      installment_count, acquirer_id, sale_id, card_brand, authorization_code,
      received_at, received_amount
    )
    select v_clinic,
           'Venda: ' || v_description
             || case when g.cnt > 1 then ' — parcela ' || g.sub_n || '/' || g.cnt else '' end,
           'Vendas', v_sale_day, g.due_date, g.method, g.gross, g.fee,
           case when g.paid_now then 'paid' else 'pending' end::public.payment_status,
           p_patient, g.sub_n, g.cnt, g.acquirer, v_sale, g.brand, g.auth_code,
           case when g.paid_now then g.due_date else null end,
           case when g.paid_now then g.gross - g.fee else 0 end
      from gen g
     order by g.ord, g.sub_n;
  end if;

  return v_sale;
end;
$$;

-- ── Débito: recorrente conta mas não tem teto; validade agora vale para os dois ─
create or replace function private.tg_debit_entitlement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_remaining  integer;
  v_specialty  public.clinic_specialty;
  v_kind       public.entitlement_kind;
  v_expires    date;
begin
  if tg_op = 'DELETE' then
    if old.entitlement_id is not null then
      if old.status in ('completed', 'no_show') then
        update public.patient_service_entitlement
           set used_sessions = used_sessions - 1
         where id = old.entitlement_id;
      elsif old.status <> 'canceled' then
        update public.patient_service_entitlement
           set scheduled_sessions = scheduled_sessions - 1
         where id = old.entitlement_id;
      end if;
    end if;
    return old;
  end if;

  if tg_op = 'INSERT' then
    if new.entitlement_id is null then
      select specialty into v_specialty
        from public.clinic where id = new.clinic_id;

      if v_specialty = 'physiotherapy' then
        raise exception
          'Este paciente não tem pacote ou contrato ativo. Registre a venda no Ponto de Venda antes de agendar.'
          using errcode = 'P0001';
      end if;

      return new;
    end if;

    select e.kind, e.expires_at, e.total_sessions - e.used_sessions - e.scheduled_sessions
      into v_kind, v_expires, v_remaining
      from public.patient_service_entitlement e
     where e.id = new.entitlement_id and e.clinic_id = new.clinic_id
       for update;
    if not found then
      raise exception 'Pacote não encontrado.' using errcode = '23503';
    end if;

    -- Validade vale para os DOIS tipos. No recorrente é o único limite; no
    -- pacote fecha um buraco antigo (o banco aceitava consulta fora da validade,
    -- só a tela filtrava — ver isEntitlementActive).
    if v_expires is not null and new.date > v_expires then
      raise exception 'Este pacote/contrato venceu em %.', to_char(v_expires, 'DD/MM/YYYY')
        using errcode = 'P0001';
    end if;

    if v_kind = 'package' and v_remaining <= 0 then
      raise exception 'O paciente não tem sessões disponíveis neste pacote.' using errcode = 'P0001';
    end if;

    update public.patient_service_entitlement
       set scheduled_sessions = scheduled_sessions + 1
     where id = new.entitlement_id;

    if new.status in ('completed', 'no_show') then
      update public.patient_service_entitlement
         set scheduled_sessions = scheduled_sessions - 1, used_sessions = used_sessions + 1
       where id = new.entitlement_id;
    elsif new.status = 'canceled' then
      update public.patient_service_entitlement
         set scheduled_sessions = scheduled_sessions - 1
       where id = new.entitlement_id;
    end if;

    return new;
  end if;

  if new.entitlement_id is not null and new.status is distinct from old.status then
    if old.status in ('completed', 'no_show') and new.status not in ('completed', 'no_show') then
      update public.patient_service_entitlement
         set used_sessions = used_sessions - 1, scheduled_sessions = scheduled_sessions + 1
       where id = new.entitlement_id;
    elsif old.status = 'canceled' and new.status <> 'canceled' then
      select e.kind, e.total_sessions - e.used_sessions - e.scheduled_sessions
        into v_kind, v_remaining
        from public.patient_service_entitlement e
       where e.id = new.entitlement_id
         for update;
      if v_kind = 'package' and v_remaining <= 0 then
        raise exception 'O paciente não tem sessões disponíveis neste pacote.' using errcode = 'P0001';
      end if;
      update public.patient_service_entitlement
         set scheduled_sessions = scheduled_sessions + 1
       where id = new.entitlement_id;
    end if;

    if new.status in ('completed', 'no_show') and old.status not in ('completed', 'no_show') then
      update public.patient_service_entitlement
         set scheduled_sessions = scheduled_sessions - 1, used_sessions = used_sessions + 1
       where id = new.entitlement_id;
    elsif new.status = 'canceled' and old.status <> 'canceled' then
      update public.patient_service_entitlement
         set scheduled_sessions = scheduled_sessions - 1
       where id = new.entitlement_id;
    end if;
  end if;

  return new;
end;
$$;
