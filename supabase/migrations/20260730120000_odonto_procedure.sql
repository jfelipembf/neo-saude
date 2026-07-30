-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — CATÁLOGO DE SERVIÇOS DA ODONTOLOGIA (Administrativo → Serviços)
--
-- Equivalente odontológico de `service` (20260723180000_service_catalog.sql),
-- mas SEM os campos de contrato/pacote (modalidade, duração, sessões, TUSS):
-- odontologia trabalha por procedimento avulso com preço de tabela, não por
-- assinatura — o próprio comentário de AdminPage.tsx já registra que
-- Serviços/Contratos não se aplica a esse ramo. Tabela separada em vez de
-- reaproveitar `service` pra não herdar campos que não fazem sentido aqui
-- (modality, duration_qty...) nem arriscar a feature que fisioterapia/
-- consultório médico já usam.
--
-- CADASTRO simples, no molde de `room` (nome + o essencial, sem `status`): nada
-- ainda referencia esta tabela (orçamento/tratamento de odontologia guardam o
-- procedimento em texto livre) — o dia que precisar de baixa lógica em vez de
-- exclusão, a coluna entra numa migration própria.
--
-- Depende de: 01-fundacao (clinic, private.auth_clinic_ids, can_edit_feature,
--             tg_touch_updated_at, tg_audit).
-- ═════════════════════════════════════════════════════════════════════════════

create table public.odonto_procedure (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinic(id) on delete cascade,
  name        text not null,
  price       numeric(12,2) not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint odonto_procedure_name_not_blank_ck check (btrim(name) <> ''),
  -- Preço negativo é erro de digitação, não desconto. Desconto mora na venda.
  constraint odonto_procedure_price_ck check (price >= 0),
  constraint odonto_procedure_id_clinic_uk unique (id, clinic_id)
);

comment on table public.odonto_procedure is
  'Catálogo de serviços/procedimentos avulsos da odontologia (nome + preço de '
  'tabela). Aba Administrativo → Serviços quando clinic.specialty = dentistry.';
comment on column public.odonto_procedure.price is
  'Valor de tabela (numeric, não float — dinheiro é contagem de centavos).';

-- Dois "Limpeza" na mesma clínica é typo, não cadastro novo. lower() porque
-- "Limpeza" e "limpeza" são o mesmo procedimento.
create unique index odonto_procedure_name_uk on public.odonto_procedure (clinic_id, lower(name));

-- ── Triggers ─────────────────────────────────────────────────────────────────
create trigger tr_touch before update on public.odonto_procedure
  for each row execute function private.tg_touch_updated_at();
create trigger tr_audit after insert or update or delete on public.odonto_procedure
  for each row execute function private.tg_audit();

-- ── Privilégios de coluna (RLS decide QUAIS LINHAS; GRANT, QUAIS COLUNAS) ─────
revoke all on public.odonto_procedure from anon;
revoke update, truncate on public.odonto_procedure from anon, authenticated;
grant update (name, price) on public.odonto_procedure to authenticated;
-- `clinic_id` fora da lista: mudar o tenant de uma linha É o vazamento.

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.odonto_procedure enable row level security;

create policy odonto_procedure_select on public.odonto_procedure
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids()));

create policy odonto_procedure_insert on public.odonto_procedure
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

create policy odonto_procedure_update on public.odonto_procedure
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy odonto_procedure_delete on public.odonto_procedure
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );
