-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — PERGUNTAS PERSONALIZADAS DO PACIENTE (aba Anamnese → "Personalizado")
--
-- A anamnese é um questionário RÍGIDO por CLÍNICA (anamnesis_template →
-- section → question): toda pergunta pertence ao template do ramo, compartilhada
-- por todos os pacientes. Isto aqui é o oposto — uma pergunta que o profissional
-- cria para UM PACIENTE específico ("alérgico a este gel", "prefere sessão pela
-- manhã"...), sem virar pergunta do catálogo da clínica.
--
-- Presa ao PACIENTE, não à ficha (anamnesis): é permanente — não reseta quando
-- uma ficha nova é aberta no retorno (private.archive_anamnesis). Por isso não
-- tem template_id/anamnesis_id: é irmã de patient_document, não de
-- anamnesis_answer.
--
-- Depende de: 01-fundacao (clinic, auth_clinic_ids, can_access_feature,
--             can_edit_feature, tg_touch_updated_at, tg_audit),
--             03-pacientes (patient, unique (id, clinic_id)).
-- ═════════════════════════════════════════════════════════════════════════════

create table public.patient_custom_question (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinic(id) on delete cascade,
  patient_id    uuid not null,
  question_text text not null,
  -- Nascer sem resposta é legítimo: o profissional pode anotar a pergunta antes
  -- de ter a resposta do paciente em mãos.
  answer_text   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint patient_custom_question_text_not_blank_ck check (btrim(question_text) <> ''),
  constraint patient_custom_question_patient_fk
    foreign key (patient_id, clinic_id)
    references public.patient(id, clinic_id)
    on delete cascade
);

comment on table public.patient_custom_question is
  'Pergunta ad-hoc criada por um profissional para UM paciente (aba Anamnese → '
  'Personalizado). Independe de template/ficha — não é o catálogo compartilhado '
  'da clínica (isso é anamnesis_question) nem uma resposta versionada por ficha '
  '(isso é anamnesis_answer). Some só se o paciente for excluído (LGPD).';
comment on column public.patient_custom_question.answer_text is
  'Nulável: a pergunta pode nascer antes da resposta.';

create index patient_custom_question_patient_idx
  on public.patient_custom_question (patient_id, created_at);

create trigger tr_touch before update on public.patient_custom_question
  for each row execute function private.tg_touch_updated_at();
create trigger tr_audit after insert or update or delete on public.patient_custom_question
  for each row execute function private.tg_audit();

-- ── Privilégios de coluna ──────────────────────────────────────────────────
revoke all on public.patient_custom_question from anon;
revoke update, truncate on public.patient_custom_question from anon, authenticated;
grant insert (clinic_id, patient_id, question_text, answer_text) on public.patient_custom_question to authenticated;
grant update (question_text, answer_text) on public.patient_custom_question to authenticated;
grant delete on public.patient_custom_question to authenticated;
-- `patient_id`/`clinic_id` fora do UPDATE: mover a nota para outro paciente ou
-- tenant é o vazamento — quem erra a pergunta cria outra e apaga a errada.

-- ── RLS — mesma chave 'patients' de patient_document (ver 03-pacientes) ──────
alter table public.patient_custom_question enable row level security;

create policy patient_custom_question_select on public.patient_custom_question
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy patient_custom_question_insert on public.patient_custom_question
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy patient_custom_question_update on public.patient_custom_question
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy patient_custom_question_delete on public.patient_custom_question
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );
