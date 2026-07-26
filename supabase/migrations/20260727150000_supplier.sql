-- ─────────────────────────────────────────────────────────────────────────────
-- FORNECEDOR (Administrativo → Fornecedores, só odontologia) — catálogo simples
-- de quem supre os materiais da clínica.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.supplier (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinic(id) on delete cascade,
  name         text not null,
  photo_url    text,
  cnpj         public.cnpj_digits,
  phone        public.phone_digits,
  cep          public.cep_digits,
  state        public.uf,
  city         text,
  neighborhood text,
  street       text,
  number       text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint supplier_name_not_blank_ck check (btrim(name) <> ''),
  -- Alvo da FK composta de material_supplier — a checagem de FK roda por
  -- dentro do servidor e NÃO passa por RLS (mesmo motivo de room_id_clinic_uk).
  constraint supplier_id_clinic_uk unique (id, clinic_id)
);

comment on table public.supplier is
  'Fornecedor de materiais (Administrativo → Fornecedores, só odontologia).';
comment on column public.supplier.photo_url is
  'Logo do fornecedor — path do bucket privado (assinado na leitura).';

create trigger tr_touch before update on public.supplier
  for each row execute function private.tg_touch_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- MATERIAL_SUPPLIER — junção N:N: um material pode vir de mais de um
-- fornecedor (ex.: a mesma resina comprada de dois distribuidores diferentes).
-- Sem UPDATE: a linha é atômica — existe o vínculo ou não existe, mesmo
-- desenho de patient_test.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.material_supplier (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinic(id) on delete cascade,
  material_id uuid not null,
  supplier_id uuid not null,
  created_at  timestamptz not null default now(),
  constraint material_supplier_uk unique (material_id, supplier_id),
  constraint material_supplier_material_fk foreign key (material_id, clinic_id)
    references public.material(id, clinic_id) on delete cascade,
  constraint material_supplier_supplier_fk foreign key (supplier_id, clinic_id)
    references public.supplier(id, clinic_id) on delete cascade
);

comment on table public.material_supplier is
  'Junção N:N material↔fornecedor — um material pode ter mais de um fornecedor.';


-- ─────────────────────────────────────────────────────────────────────────────
-- PRIVILÉGIOS DE COLUNA
-- ─────────────────────────────────────────────────────────────────────────────

revoke all on public.supplier from anon;
revoke all on public.material_supplier from anon;

revoke insert, update, delete on public.supplier from authenticated;
grant insert (
  clinic_id, name, photo_url, cnpj, phone, cep, state, city, neighborhood, street, number
) on public.supplier to authenticated;
grant update (
  name, photo_url, cnpj, phone, cep, state, city, neighborhood, street, number
) on public.supplier to authenticated;
-- `clinic_id` fora das duas listas: mudar o tenant de uma linha É o vazamento.
grant delete on public.supplier to authenticated;

revoke insert, update, delete on public.material_supplier from authenticated;
grant insert (clinic_id, material_id, supplier_id) on public.material_supplier to authenticated;
grant delete on public.material_supplier to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.supplier enable row level security;
alter table public.material_supplier enable row level security;

-- ── supplier ─────────────────────────────────────────────────────────────────
-- Leitura sem exigir feature, mesmo desenho de material/room/insurance: nome e
-- contato do fornecedor não são dado sensível. Escrita é do Administrativo.
create policy supplier_select on public.supplier
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids()));

create policy supplier_insert on public.supplier
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

create policy supplier_update on public.supplier
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy supplier_delete on public.supplier
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

-- ── material_supplier ───────────────────────────────────────────────────────
create policy material_supplier_select on public.material_supplier
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids()));

create policy material_supplier_insert on public.material_supplier
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

create policy material_supplier_delete on public.material_supplier
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );
