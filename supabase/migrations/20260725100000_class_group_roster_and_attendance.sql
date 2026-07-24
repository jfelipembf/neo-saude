-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — MATRÍCULA E FREQUÊNCIA EM TURMAS COLETIVAS
--
-- class_group_enrollment: paciente matriculado numa turma — matrícula é
-- PERMANENTE (vale pra toda ocorrência futura da turma, não é por dia).
-- class_group_attendance: presença/falta (+ justificativa e o prontuário da
-- sessão) de UM paciente matriculado NUMA ocorrência específica (turma+data).
--
-- Mesmo padrão de patient_test/patient_test_result: leitura/escrita exigem a
-- feature 'patients' (dado clínico/operacional de paciente, diferente do
-- catálogo puro de Admin em class_group, que é leitura livre no tenant).
--
-- Depende de: 01-fundacao (clinic, auth_clinic_ids, can_access_feature,
--             can_edit_feature, tg_touch_updated_at, tg_audit),
--             20260722120400_schedule.sql (patient — unique (id, clinic_id)),
--             20260724220000_class_group_catalog.sql (class_group).
-- ═════════════════════════════════════════════════════════════════════════════

create table public.class_group_enrollment (
  id             uuid primary key default gen_random_uuid(),
  clinic_id      uuid not null references public.clinic(id) on delete cascade,
  class_group_id uuid not null,
  patient_id     uuid not null,
  enrolled_at    timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint class_group_enrollment_id_clinic_uk unique (id, clinic_id),
  -- Um paciente só pode ter UMA matrícula por turma.
  constraint class_group_enrollment_uk unique (class_group_id, patient_id),

  constraint class_group_enrollment_group_fk
    foreign key (class_group_id, clinic_id) references public.class_group(id, clinic_id)
    on delete cascade,
  constraint class_group_enrollment_patient_fk
    foreign key (patient_id, clinic_id) references public.patient(id, clinic_id)
    on delete cascade
);

comment on table public.class_group_enrollment is
  'Matrícula PERMANENTE de um paciente numa turma coletiva (domain.ts '
  'ClassGroupRosterEntry) — vale pra toda ocorrência futura, não é por dia.';

create index class_group_enrollment_group_idx on public.class_group_enrollment (class_group_id, clinic_id);
create index class_group_enrollment_patient_idx on public.class_group_enrollment (patient_id, clinic_id);

create trigger tr_touch before update on public.class_group_enrollment
  for each row execute function private.tg_touch_updated_at();
create trigger tr_audit after insert or update or delete on public.class_group_enrollment
  for each row execute function private.tg_audit();

revoke all on public.class_group_enrollment from anon;
revoke update, truncate on public.class_group_enrollment from anon, authenticated;

alter table public.class_group_enrollment enable row level security;

create policy class_group_enrollment_select on public.class_group_enrollment
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy class_group_enrollment_insert on public.class_group_enrollment
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy class_group_enrollment_delete on public.class_group_enrollment
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );


-- ── Frequência (presença/falta por ocorrência) ────────────────────────────────

create type public.class_attendance_status as enum ('present', 'absent');

create table public.class_group_attendance (
  id                 uuid primary key default gen_random_uuid(),
  clinic_id          uuid not null references public.clinic(id) on delete cascade,
  class_group_id     uuid not null,
  patient_id         uuid not null,
  -- A OCORRÊNCIA (dia concreto) da turma — materializada no cliente, nunca
  -- persistida como linha própria (ver utils/classGroupOccurrences); aqui
  -- entra só a DATA, que junto com class_group_id identifica a sessão.
  occurred_on        date not null,
  status             public.class_attendance_status not null default 'present',
  -- Só relevante quando status='absent'; opcional (dá pra marcar falta sem motivo).
  justification      text,
  -- Prontuário da SESSÃO deste paciente nesta turma+data — mesmo uso de
  -- appointment.clinical_note_html, mas turma não tem appointment por trás.
  clinical_note_html text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint class_group_attendance_uk unique (class_group_id, patient_id, occurred_on),

  constraint class_group_attendance_group_fk
    foreign key (class_group_id, clinic_id) references public.class_group(id, clinic_id)
    on delete cascade,
  constraint class_group_attendance_patient_fk
    foreign key (patient_id, clinic_id) references public.patient(id, clinic_id)
    on delete cascade
);

comment on table public.class_group_attendance is
  'Presença/falta (+ justificativa e prontuário da sessão) de UM paciente '
  'matriculado numa ocorrência específica (turma + data) — domain.ts '
  'ClassGroupRosterEntry.';

create index class_group_attendance_group_date_idx
  on public.class_group_attendance (class_group_id, clinic_id, occurred_on);

create trigger tr_touch before update on public.class_group_attendance
  for each row execute function private.tg_touch_updated_at();
create trigger tr_audit after insert or update or delete on public.class_group_attendance
  for each row execute function private.tg_audit();

revoke all on public.class_group_attendance from anon;
revoke delete, truncate on public.class_group_attendance from anon, authenticated;
grant update (status, justification, clinical_note_html)
  on public.class_group_attendance to authenticated;

alter table public.class_group_attendance enable row level security;

create policy class_group_attendance_select on public.class_group_attendance
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy class_group_attendance_insert on public.class_group_attendance
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy class_group_attendance_update on public.class_group_attendance
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));
