-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — TESTES DE FISIOTERAPIA (Administrativo → Testes + aba "Testes"
-- do perfil do paciente, exclusiva da especialidade fisioterapia)
--
-- Duas metades:
--   1) CATÁLOGO (physio_test + physio_test_level) — o que hoje vive só em
--      estado local do React (src/mocks/physioTests.ts), sem persistência.
--      Mesmo desenho de currículo do profissional (professional_education):
--      tabela filha ordenada, reescrita inteira a cada salvamento do form
--      (delete-then-insert), não jsonb.
--   2) USO NO PACIENTE (patient_test + patient_test_result) — quais testes do
--      catálogo estão "fixados" no sidenav de um paciente (patient_test) e o
--      histórico de aplicações desse teste ao longo do tempo
--      (patient_test_result). O nível atingido é CONGELADO na linha do
--      resultado (level_name/level_description) — mesmo motivo de
--      appointment_history_material.name: o catálogo pode mudar o texto do
--      nível depois, o resultado já registrado não pode.
--
-- Depende de: 01-fundacao (clinic, auth_clinic_ids, can_access_feature,
--             can_edit_feature, tg_touch_updated_at, tg_audit),
--             03-pacientes (patient, unique (id, clinic_id)),
--             20260722120300_professionals (professional, unique (id, clinic_id)).
-- ═════════════════════════════════════════════════════════════════════════════

-- ── Catálogo ─────────────────────────────────────────────────────────────────

create table public.physio_test (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinic(id) on delete cascade,
  name         text not null,
  -- Neurológica/Ortopédica/... (ver constants/testSpecialty) — texto livre: a
  -- lista fixa da UI é só sugestão, o cadastro aceita uma especialização própria.
  specialty    text not null,
  -- PATH no bucket privado clinic-assets, igual professional.photo_url — não a URL.
  image_url    text,
  instructions text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint physio_test_name_not_blank_ck check (btrim(name) <> ''),
  constraint physio_test_specialty_not_blank_ck check (btrim(specialty) <> ''),
  -- Alvo das FKs compostas abaixo (physio_test_level, patient_test, patient_test_result).
  constraint physio_test_id_clinic_uk unique (id, clinic_id)
);

comment on table public.physio_test is
  'Catálogo de testes/escalas de avaliação fisioterapêutica (Administrativo → '
  'Testes). Cada teste tem uma lista ordenada de NÍVEIS (physio_test_level) — '
  'a interpretação de uma pontuação/tempo total, não o formulário item a item.';

-- Dois "Berg" na mesma clínica é typo, não cadastro novo (mesmo raciocínio de service_name_uk).
create unique index physio_test_name_uk on public.physio_test (clinic_id, lower(name));

create trigger tr_touch before update on public.physio_test
  for each row execute function private.tg_touch_updated_at();
create trigger tr_audit after insert or update or delete on public.physio_test
  for each row execute function private.tg_audit();

revoke all on public.physio_test from anon;
revoke delete, truncate on public.physio_test from anon, authenticated;
grant insert (clinic_id, name, specialty, image_url, instructions) on public.physio_test to authenticated;
grant update (name, specialty, image_url, instructions) on public.physio_test to authenticated;
-- Sem DELETE: a tela de Admin hoje não tem "excluir teste" (mesmo motivo de
-- material/service — um teste já usado em patient_test_result não pode sumir
-- do catálogo por baixo do histórico).

alter table public.physio_test enable row level security;

-- Leitura liberada tanto para 'admin' (a própria tela do catálogo) quanto para
-- 'patients' (o menu de seleção da aba Testes do paciente precisa listar tudo).
create policy physio_test_select on public.physio_test
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'admin', 'patients')
  );

create policy physio_test_insert on public.physio_test
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

create policy physio_test_update on public.physio_test
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

-- Níveis do teste (Grau 0..5, faixas de pontuação...) — lista ordenada, filha
-- do teste. Reescrita inteira a cada salvamento do form (replaceEducation-style).
create table public.physio_test_level (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinic(id) on delete cascade,
  test_id     uuid not null,
  name        text not null,
  description text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- Alvo de patient_test_result.level_id.
  constraint physio_test_level_id_clinic_uk unique (id, clinic_id),
  -- CASCADE: um nível não existe sem o teste (mesmo raciocínio de professional_education).
  constraint physio_test_level_test_fk
    foreign key (test_id, clinic_id)
    references public.physio_test(id, clinic_id)
    on delete cascade,
  constraint physio_test_level_name_not_blank_ck check (btrim(name) <> ''),
  constraint physio_test_level_description_not_blank_ck check (btrim(description) <> '')
);

comment on table public.physio_test_level is
  'Nível/faixa de interpretação de um teste (domain.ts PhysioTestLevel). Tabela '
  'filha ordenada, não jsonb — mesmo desenho de professional_education.';

create index physio_test_level_test_idx
  on public.physio_test_level (test_id, clinic_id, sort_order);

create trigger tr_touch before update on public.physio_test_level
  for each row execute function private.tg_touch_updated_at();
create trigger tr_audit after insert or update or delete on public.physio_test_level
  for each row execute function private.tg_audit();

revoke all on public.physio_test_level from anon;
revoke update, truncate on public.physio_test_level from anon, authenticated;
grant insert (clinic_id, test_id, name, description, sort_order) on public.physio_test_level to authenticated;
grant delete on public.physio_test_level to authenticated;
-- Sem UPDATE de propósito: o form reescreve a lista inteira (delete + insert),
-- igual professional_education — nunca dá PATCH num nível isolado.

alter table public.physio_test_level enable row level security;

create policy physio_test_level_select on public.physio_test_level
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'admin', 'patients')
  );

create policy physio_test_level_insert on public.physio_test_level
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

create policy physio_test_level_delete on public.physio_test_level
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

-- ── Uso no paciente ──────────────────────────────────────────────────────────

-- Quais testes do catálogo estão "fixados" no sidenav de um paciente. Link,
-- não histórico: reescrito inteiro a cada seleção no menu (setPatientTests),
-- igual professional_availability.
create table public.patient_test (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references public.clinic(id) on delete cascade,
  patient_id uuid not null,
  test_id    uuid not null,
  created_at timestamptz not null default now(),
  constraint patient_test_uk unique (patient_id, clinic_id, test_id),
  -- CASCADE: é só um link de preferência do sidenav, some com o paciente
  -- (mesmo motivo de patient_custom_question — LGPD).
  constraint patient_test_patient_fk
    foreign key (patient_id, clinic_id)
    references public.patient(id, clinic_id)
    on delete cascade,
  -- RESTRICT: proteção redundante (physio_test não tem DELETE via GRANT), mas
  -- declara a intenção — um teste em uso nunca pode sumir do catálogo por baixo.
  constraint patient_test_test_fk
    foreign key (test_id, clinic_id)
    references public.physio_test(id, clinic_id)
    on delete restrict
);

comment on table public.patient_test is
  'Testes do catálogo fixados no sidenav de UM paciente (aba Testes do perfil). '
  'Desmarcar no menu de seleção REMOVE a linha daqui — os resultados já '
  'registrados em patient_test_result não são apagados, só saem de vista até o '
  'teste ser marcado de novo.';

create index patient_test_patient_idx on public.patient_test (patient_id, clinic_id);

revoke all on public.patient_test from anon;
revoke update, truncate on public.patient_test from anon, authenticated;
grant insert (clinic_id, patient_id, test_id) on public.patient_test to authenticated;
grant delete on public.patient_test to authenticated;

alter table public.patient_test enable row level security;

create policy patient_test_select on public.patient_test
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy patient_test_insert on public.patient_test
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy patient_test_delete on public.patient_test
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

-- Resultado de UMA aplicação do teste — o histórico "cards lado a lado" (mais
-- recente primeiro). Registro imutável: só nasce e pode ser apagado por erro
-- de digitação, nunca editado (mesmo raciocínio de appointment_delete).
create table public.patient_test_result (
  id                 uuid primary key default gen_random_uuid(),
  clinic_id          uuid not null references public.clinic(id) on delete cascade,
  patient_id         uuid not null,
  test_id            uuid not null,
  -- Nulável: quem registra pode não ter login vinculado a um profissional
  -- (mesmo motivo de treatment_session.professional_id) — melhor um campo
  -- vazio do que atribuir o teste a quem não o aplicou.
  professional_id    uuid,
  -- Nulável: SET NULL se o nível for apagado do catálogo depois (só sobra via
  -- physio_test_level_delete, que a Admin hoje não expõe, mas a coluna FK
  -- existe para o dia em que expuser). O texto abaixo já está CONGELADO.
  level_id           uuid,
  level_name         text not null,
  level_description  text not null,
  performed_at       date not null,
  created_at         timestamptz not null default now(),
  constraint patient_test_result_level_not_blank_ck check (btrim(level_name) <> ''),
  -- Histórico clínico: NO ACTION no paciente e no teste — resultado emitido não
  -- fica órfão por baixo (mesmo padrão de treatment_patient_fk/prescription).
  constraint patient_test_result_patient_fk
    foreign key (patient_id, clinic_id)
    references public.patient(id, clinic_id)
    on delete no action,
  constraint patient_test_result_test_fk
    foreign key (test_id, clinic_id)
    references public.physio_test(id, clinic_id)
    on delete no action,
  constraint patient_test_result_professional_fk
    foreign key (professional_id, clinic_id)
    references public.professional(id, clinic_id)
    on delete no action,
  constraint patient_test_result_level_fk
    foreign key (level_id, clinic_id)
    references public.physio_test_level(id, clinic_id)
    on delete set null (level_id)
);

comment on table public.patient_test_result is
  'Uma aplicação registrada de um teste a um paciente, com o nível atingido '
  '(domain.ts PatientTestResult). Aparece na tela como cards horizontais, mais '
  'recente à esquerda — ORDER BY performed_at desc, created_at desc.';
comment on column public.patient_test_result.level_name is
  'CONGELADO no momento do registro (mesmo padrão de '
  'appointment_history_material.name): o catálogo pode reescrever o texto do '
  'nível depois, o resultado já emitido não muda.';

create index patient_test_result_patient_test_idx
  on public.patient_test_result (patient_id, clinic_id, test_id, performed_at desc, created_at desc);

revoke all on public.patient_test_result from anon;
revoke update, truncate on public.patient_test_result from anon, authenticated;
grant insert (clinic_id, patient_id, test_id, professional_id, level_id, level_name, level_description, performed_at)
  on public.patient_test_result to authenticated;
grant delete on public.patient_test_result to authenticated;

alter table public.patient_test_result enable row level security;

create policy patient_test_result_select on public.patient_test_result
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy patient_test_result_insert on public.patient_test_result
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy patient_test_result_delete on public.patient_test_result
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );
