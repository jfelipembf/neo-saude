-- LEMBRETE POR PACIENTE — "no proximo atendimento da Michelle, usar outro material".
--
-- Por que tabela nova, e nao alguma coisa que ja existe:
--  · public.task e o kanban da RECEPCAO: nao tem patient_id e o gate e a
--    feature 'dashboard'. Nao serve, e nao da para servir sem mexer numa tabela
--    de outro dominio.
--  · public.patient nao tem NENHUM campo de texto livre, e nao deve ganhar um:
--    e a tabela do expurgo LGPD e do import, e um TEXT sem "concluido" vira
--    lixo permanente.
--  · appointment.notes e da CONSULTA — morre no remarcar, e a tela cheia do
--    odontograma nem le appointment (so conhece o ?patient= da URL), entao um
--    lembrete escrito ali seria invisivel justamente onde o atendimento comeca.
--
-- Molde copiado de public.patient_odontogram: FK composta, revoke antes dos
-- grants, updated_by por trigger.
create table public.patient_reminder (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references public.clinic(id) on delete cascade,
  patient_id uuid not null,
  texto      text not null,
  -- Aberto ou resolvido. Sem isso o lembrete vira lixo permanente: ele existe
  -- para aparecer UMA vez, no proximo atendimento, e sumir depois de atendido.
  done       boolean not null default false,
  done_at    timestamptz,
  -- DEFAULT auth.uid(): a coluna esta (corretamente) fora dos grants do cliente
  -- e a trigger tr_stamp_updated_by so mexe em updated_by, entao sem o default
  -- created_by ficaria NULL. Assim o rastro existe e continua inforjavel.
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patient_reminder_texto_ck check (btrim(texto) <> ''),
  constraint patient_reminder_patient_fk
    foreign key (patient_id, clinic_id)
    references public.patient(id, clinic_id) on delete cascade
);

comment on table public.patient_reminder is
  'Lembrete que o profissional deixa para o PROXIMO atendimento do paciente ("usar outro material", "conferir a oclusao"). Aparece quando o paciente e selecionado no atendimento e some quando marcado como feito.';

comment on column public.patient_reminder.created_by is
  'Quem deixou o lembrete. Preenchido por DEFAULT auth.uid() — fora dos grants do cliente, entao nao e forjavel.';

-- Indice parcial: a leitura quente e sempre "os lembretes ABERTOS deste
-- paciente". Resolvido so interessa em auditoria.
create index patient_reminder_open_idx
  on public.patient_reminder (patient_id) where done = false;

create trigger tr_touch before update on public.patient_reminder
  for each row execute function private.tg_touch_updated_at();

create trigger tr_stamp_updated_by before insert or update on public.patient_reminder
  for each row execute function private.tg_stamp_updated_by();

-- Auditoria ENTRA aqui (ao contrario de task/lead): e instrucao clinica, o
-- volume e baixo, e "quem apagou o lembrete?" e pergunta cara de responder sem
-- rastro.
create trigger tr_audit after insert or update or delete on public.patient_reminder
  for each row execute function private.tg_audit();

alter table public.patient_reminder enable row level security;

-- Leitura tambem para quem tem 'schedule': a recepcao que abre a consulta pode
-- nao ter a feature 'patients', e um lembrete que ela nao ve nao serve de nada.
-- (can_access_feature e VARIADIC: a lista e OR.)
create policy patient_reminder_select on public.patient_reminder
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients', 'schedule')
  );

create policy patient_reminder_insert on public.patient_reminder
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy patient_reminder_update on public.patient_reminder
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy patient_reminder_delete on public.patient_reminder
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

-- O revoke vem PRIMEIRO: o Supabase concede tudo em toda tabela nova
-- (alter default privileges), e os grants por coluna abaixo seriam so aditivos.
-- Sem isso o cliente forjaria created_by/updated_by — o rastro de quem escreveu
-- e de quem apagou o lembrete.
revoke all on public.patient_reminder from anon, authenticated;

grant select on public.patient_reminder to authenticated;
grant insert (clinic_id, patient_id, texto) on public.patient_reminder to authenticated;
grant update (texto, done, done_at) on public.patient_reminder to authenticated;
grant delete on public.patient_reminder to authenticated;
