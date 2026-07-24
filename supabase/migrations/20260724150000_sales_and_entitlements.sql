-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — PONTO DE VENDA + DIREITO A SESSÕES DE PACOTE
--
-- Vender um Serviço/Contrato (public.service) hoje não persiste nada — o PDV
-- (src/pages/Sales/SalesPoint) é casca visual sem tabela por trás. Este
-- arquivo cria:
--   1) sale/sale_item      — cabeçalho + itens da venda (mesmo desenho de
--                            quote/quote_item, 20260722120600_commercial.sql).
--   2) patient_service_entitlement — direito do paciente a N sessões de um
--      pacote comprado (modality='package'). Modelo de DOIS contadores
--      (scheduled_sessions / used_sessions), pesquisado na API da EVO antes
--      de desenhar: sessão fica RESERVADA no agendamento e vira USADA na
--      conclusão — nunca soma os dois além de total_sessions
--      (entitlement_balance_ck é a garantia de banco, não só de trigger).
--   3) appointment.entitlement_id — a consulta pode (opcional) descontar de
--      um pacote específico, escolhido no agendamento.
--   4) tg_debit_entitlement — reserva/confirma/devolve sessão conforme a
--      consulta muda de situação. Falta (no_show) CONSOME a sessão como se
--      tivesse concluído; só cancelamento devolve (decisão do produto).
--   5) checkout_sale() — RPC que fecha a venda: grava sale/sale_item, cria os
--      entitlements das linhas de pacote e gera os recebíveis do plano de
--      pagamento, no mesmo molde de approve_quote()
--      (20260723124324_quote_installment_per_line.sql) reaproveitando
--      private.card_installment_plan() para linhas no cartão.
--
-- Depende de: 01-fundacao, 02-cadastros (patient), 20260722120400_schedule
--             (appointment), 20260723180000+..._service_* (service,
--             modality/sessions/duration_qty/duration_unit),
--             20260722120700_finance (receivable, card_installment_plan).
-- ═════════════════════════════════════════════════════════════════════════════

-- ── 1 · Venda ────────────────────────────────────────────────────────────────

create table public.sale (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinic(id) on delete cascade,
  patient_id  uuid not null,
  sale_date   date not null default current_date,
  discount    public.money_brl not null default 0,
  -- Soma de sale_item.amount, mantida por tg_recalc_sale_total (igual quote.items_total).
  items_total public.money_brl not null default 0,
  total numeric(12,2) generated always as (
    case when items_total - discount > 0 then items_total - discount else 0 end
  ) stored,
  created_by  uuid references public.profile(id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint sale_patient_fk foreign key (patient_id, clinic_id)
    references public.patient(id, clinic_id) on delete no action,
  constraint sale_discount_ck check (discount >= 0),
  constraint sale_items_total_ck check (items_total >= 0),
  constraint sale_id_clinic_uk unique (id, clinic_id)
);

comment on table public.sale is
  'Cabeçalho de uma venda do Ponto de Venda (Administrativo → Serviços vendidos '
  'ao paciente). Venda finalizada é imutável — sem estorno/edição nesta fase.';

create index sale_patient_idx on public.sale (patient_id, clinic_id);
create index sale_clinic_idx  on public.sale (clinic_id);

create table public.sale_item (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references public.clinic(id) on delete cascade,
  sale_id    uuid not null,
  service_id uuid not null,
  -- Nome e preço CONGELADOS no momento da venda — o catálogo pode mudar depois,
  -- a linha já vendida não (mesmo motivo de quote_item/appointment_history_material).
  name       text not null,
  price      public.money_brl not null,
  quantity   integer not null default 1,
  amount numeric(12,2) generated always as (price * quantity) stored,
  created_at timestamptz not null default now(),
  constraint sale_item_sale_fk foreign key (sale_id, clinic_id)
    references public.sale(id, clinic_id) on delete cascade,
  -- RESTRICT: proteção redundante (service não tem DELETE via GRANT), mas
  -- declara a intenção — um serviço já vendido não pode sumir do catálogo.
  constraint sale_item_service_fk foreign key (service_id, clinic_id)
    references public.service(id, clinic_id) on delete restrict,
  constraint sale_item_price_ck check (price >= 0),
  constraint sale_item_quantity_ck check (quantity > 0),
  constraint sale_item_id_clinic_uk unique (id, clinic_id)
);

comment on table public.sale_item is
  'Linha de uma venda (domain.ts SaleItem). name/price congelados do catálogo '
  'no momento da venda.';

create index sale_item_sale_idx    on public.sale_item (sale_id, clinic_id);
create index sale_item_service_idx on public.sale_item (service_id);
create index sale_item_clinic_idx  on public.sale_item (clinic_id);

create or replace function private.tg_recalc_sale_total()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids uuid[] := '{}';
begin
  -- Mesmo desenho de private.tg_quote_recalc_total: recalcula por SOMA (não
  -- delta) e SECURITY DEFINER porque items_total não tem GRANT de UPDATE para
  -- authenticated (só esta trigger escreve nela).
  if tg_op <> 'DELETE' then
    v_ids := v_ids || new.sale_id;
  end if;
  if tg_op <> 'INSERT' and old.sale_id <> all(v_ids) then
    v_ids := v_ids || old.sale_id;
  end if;

  update public.sale s
     set items_total = coalesce((select sum(si.amount) from public.sale_item si where si.sale_id = s.id), 0)
   where s.id = any(v_ids);

  return coalesce(new, old);
end;
$$;

revoke execute on function private.tg_recalc_sale_total() from public;

create trigger tr_recalc_sale_total after insert or update or delete on public.sale_item
  for each row execute function private.tg_recalc_sale_total();

create trigger tr_audit after insert or update or delete on public.sale
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.sale_item
  for each row execute function private.tg_audit();

revoke all on public.sale      from anon;
revoke all on public.sale_item from anon;
-- Cliente nunca escreve direto: só checkout_sale() (SECURITY DEFINER) grava.
revoke insert, update, delete on public.sale      from authenticated;
revoke insert, update, delete on public.sale_item from authenticated;

alter table public.sale      enable row level security;
alter table public.sale_item enable row level security;

create policy sale_select on public.sale
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids()) and private.can_access_feature(clinic_id, 'finance'));

create policy sale_item_select on public.sale_item
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids()) and private.can_access_feature(clinic_id, 'finance'));

-- ── 2 · Direito a sessões de pacote ──────────────────────────────────────────

create table public.patient_service_entitlement (
  id                 uuid primary key default gen_random_uuid(),
  clinic_id          uuid not null references public.clinic(id) on delete cascade,
  patient_id         uuid not null,
  service_id         uuid not null,
  sale_item_id       uuid not null,
  total_sessions     integer not null,
  used_sessions      integer not null default 0,
  scheduled_sessions integer not null default 0,
  purchased_at       date not null default current_date,
  -- NULL = pacote sem validade de uso (service.duration_qty = 0).
  expires_at         date,
  constraint entitlement_patient_fk foreign key (patient_id, clinic_id)
    references public.patient(id, clinic_id) on delete cascade,
  constraint entitlement_service_fk foreign key (service_id, clinic_id)
    references public.service(id, clinic_id) on delete restrict,
  constraint entitlement_sale_item_fk foreign key (sale_item_id, clinic_id)
    references public.sale_item(id, clinic_id) on delete cascade,
  constraint entitlement_total_sessions_ck check (total_sessions > 0),
  constraint entitlement_used_sessions_ck check (used_sessions >= 0),
  constraint entitlement_scheduled_sessions_ck check (scheduled_sessions >= 0),
  -- A GARANTIA: reservado + usado nunca passa do comprado, não importa o que
  -- a trigger faça — se ela tiver um bug, o banco recusa antes de vazar saldo.
  constraint entitlement_balance_ck check (used_sessions + scheduled_sessions <= total_sessions),
  constraint entitlement_id_clinic_uk unique (id, clinic_id)
);

comment on table public.patient_service_entitlement is
  'Direito de UM paciente a N sessões de UM pacote comprado (domain.ts '
  'PatientServiceEntitlement). "Ativo" é derivado (não uma coluna): saldo '
  '= total_sessions - used_sessions - scheduled_sessions > 0 e '
  '(expires_at is null ou expires_at >= hoje) — calculado na leitura, não '
  'mantido por trigger, para não ter um segundo lugar podendo divergir do saldo.';
comment on column public.patient_service_entitlement.scheduled_sessions is
  'Sessões RESERVADAS (consulta agendada/confirmada apontando pra este '
  'pacote, ainda não concluída). Sobe no agendamento, desce na conclusão '
  '(vira used_sessions) ou no cancelamento (devolve o crédito).';
comment on column public.patient_service_entitlement.used_sessions is
  'Sessões efetivamente consumidas — conclusão E falta (no_show) contam '
  'igual aqui; só cancelamento não conta.';

create index entitlement_patient_idx on public.patient_service_entitlement (patient_id, clinic_id);
create index entitlement_service_idx on public.patient_service_entitlement (service_id);
create index entitlement_sale_item_idx on public.patient_service_entitlement (sale_item_id);
create index entitlement_clinic_idx  on public.patient_service_entitlement (clinic_id);

create trigger tr_audit after insert or update or delete on public.patient_service_entitlement
  for each row execute function private.tg_audit();

revoke all on public.patient_service_entitlement from anon;
-- Cliente nunca escreve direto: checkout_sale() cria a linha, tg_debit_entitlement
-- atualiza os contadores — os dois SECURITY DEFINER.
revoke insert, update, delete on public.patient_service_entitlement from authenticated;

alter table public.patient_service_entitlement enable row level security;

-- Leitura liberada tanto para 'patients' (bloco "Pacotes" do perfil) quanto
-- para 'schedule' (seletor de pacote no agendamento).
create policy entitlement_select on public.patient_service_entitlement
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients', 'schedule')
  );

-- ── 3 · Consulta pode descontar de um pacote ─────────────────────────────────

alter table public.appointment add column entitlement_id uuid;
alter table public.appointment add constraint appointment_entitlement_fk
  foreign key (entitlement_id, clinic_id)
  references public.patient_service_entitlement(id, clinic_id) on delete no action;

comment on column public.appointment.entitlement_id is
  'Pacote de sessões do qual esta consulta desconta — escolhido no '
  'agendamento, IMUTÁVEL depois (sem GRANT de update nesta coluna). NULL = '
  'consulta avulsa, fora de qualquer pacote (o caso comum hoje).';

create index appointment_entitlement_idx on public.appointment (entitlement_id);

-- Entra só no INSERT (a consulta escolhe o pacote ao nascer); não entra no
-- UPDATE já existente — mover uma consulta de pacote depois de criada não é
-- uma operação suportada (tg_debit_entitlement conta com isso).
grant insert (entitlement_id) on public.appointment to authenticated;

-- ── 4 · Débito automático ao mudar de situação ───────────────────────────────

create or replace function private.tg_debit_entitlement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_remaining integer;
begin
  if tg_op = 'INSERT' then
    if new.entitlement_id is null then
      return new;
    end if;

    select total_sessions - used_sessions - scheduled_sessions
      into v_remaining
      from public.patient_service_entitlement
     where id = new.entitlement_id and clinic_id = new.clinic_id
       for update;
    if v_remaining is null then
      raise exception 'Pacote não encontrado.' using errcode = '23503';
    end if;
    if v_remaining <= 0 then
      raise exception 'O paciente não tem sessões disponíveis neste pacote.' using errcode = 'P0001';
    end if;

    update public.patient_service_entitlement
       set scheduled_sessions = scheduled_sessions + 1
     where id = new.entitlement_id;

    -- Consulta que já nasce resolvida (importação/ajuste manual): passa
    -- direto de "reservada" pro estado final, sem ficar pendurada.
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

  -- UPDATE OF status: entitlement_id é imutável pro client (sem GRANT de
  -- update nessa coluna), então old.entitlement_id = new.entitlement_id aqui.
  if new.entitlement_id is not null and new.status is distinct from old.status then
    -- Reabrindo uma sessão já resolvida (completed/no_show → outra coisa):
    -- devolve pro balde "reservada".
    if old.status in ('completed', 'no_show') and new.status not in ('completed', 'no_show') then
      update public.patient_service_entitlement
         set used_sessions = used_sessions - 1, scheduled_sessions = scheduled_sessions + 1
       where id = new.entitlement_id;
    -- Reabrindo uma cancelada: reserva de novo — com checagem de saldo, o
    -- pacote pode ter se esgotado ou vencido nesse meio-tempo.
    elsif old.status = 'canceled' and new.status <> 'canceled' then
      select total_sessions - used_sessions - scheduled_sessions
        into v_remaining
        from public.patient_service_entitlement
       where id = new.entitlement_id
         for update;
      if v_remaining <= 0 then
        raise exception 'O paciente não tem sessões disponíveis neste pacote.' using errcode = 'P0001';
      end if;
      update public.patient_service_entitlement
         set scheduled_sessions = scheduled_sessions + 1
       where id = new.entitlement_id;
    end if;

    -- A partir do estado "reservada" (garantido pelos dois ramos acima, ou já
    -- era o caso), resolve pro novo status final.
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

comment on function private.tg_debit_entitlement() is
  'BEFORE INSERT/UPDATE OF status em appointment: reserva 1 sessão do pacote '
  '(entitlement_id) no agendamento, confirma (scheduled→used) na conclusão OU '
  'falta, devolve (scheduled-1) só no cancelamento. entitlement_balance_ck é '
  'quem garante de verdade que o saldo nunca fica negativo, mesmo se este '
  'código tiver um bug.';

revoke execute on function private.tg_debit_entitlement() from public;

create trigger tr_debit_entitlement before insert or update of status on public.appointment
  for each row execute function private.tg_debit_entitlement();

-- ── 5 · Fechar a venda ───────────────────────────────────────────────────────

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
             ord
        from jsonb_array_elements(p_plan) with ordinality as t(e, ord)
    ),
    gen as (
      -- CARTÃO com adquirente: repasse D+N com taxa, numerado pela própria
      -- card_installment_plan (mesma função que approve_quote reaproveita).
      select p.ord, cp.installment_number as sub_n, cp.installment_count as cnt,
             cp.due_date, p.method, cp.gross_amount as gross, cp.fee, p.acq as acquirer
        from plan p
        cross join lateral private.card_installment_plan(
          v_clinic, p.acq, p.amount, p.inst, coalesce(p_sale_date, current_date), p.method) cp
       where p.acq is not null and p.method in ('credit', 'debit')
      union all
      -- Demais formas: o PDV só oferece parcelamento em crédito (ver
      -- PaymentForm.tsx), então dinheiro/pix/débito sem adquirente são
      -- sempre à vista, vencendo na data da venda.
      select p.ord, 1, 1, coalesce(p_sale_date, current_date), p.method, p.amount, 0::numeric, null::uuid
        from plan p
       where not (p.acq is not null and p.method in ('credit', 'debit'))
    )
    insert into public.receivable (
      clinic_id, description, source, due_date, method, gross_amount, fee, status,
      patient_id, installment_number, installment_count, acquirer_id
    )
    select v_clinic,
           'Venda: ' || v_description
             || case when g.cnt > 1 then ' — parcela ' || g.sub_n || '/' || g.cnt else '' end,
           'Vendas', g.due_date, g.method, g.gross, g.fee, 'pending',
           p_patient, g.sub_n, g.cnt, g.acquirer
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
  'resto). p_items = [{service_id, quantity}]; p_plan = [{method, amount, '
  'installments?, acquirer_id?}]. SECURITY DEFINER: exige patients/schedule, '
  'não finance — quem vende pelo perfil do paciente não tem acesso ao '
  'Financeiro (ver record_treatment_session pro mesmo raciocínio).';

revoke all on function public.checkout_sale(uuid, date, numeric, jsonb, jsonb) from public;
grant execute on function public.checkout_sale(uuid, date, numeric, jsonb, jsonb) to authenticated, service_role;
