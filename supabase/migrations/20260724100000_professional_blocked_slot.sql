-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — BLOQUEIO DE HORA ESPECÍFICA (DATA REAL) DO PROFISSIONAL
--
-- Modela: ProfessionalBlockedSlot (src/types/domain.ts).
--
-- Roda DEPOIS de professional_availability.sql.
--
-- DIFERENÇA PARA professional_availability: aquela é a REGRA recorrente
-- (vale toda semana, por weekday); esta é um bloqueio de UMA DATA REAL —
-- "esta quinta 20/11 das 14h às 15h o Dr. X não atende", sem mexer na regra
-- recorrente nem nas outras semanas. Mesma relação que schedule_slot (regra)
-- tem com appointment (ocorrência), só que aqui o que "ocorre" é uma
-- AUSÊNCIA, não uma consulta.
--
-- QUALQUER DIA DA SEMANA (não só Sáb/Dom — decisão revista do dono): serve
-- pra bloquear um horário pontual em qualquer dia. Para ausência do dia
-- INTEIRO por vários dias seguidos (viagem, férias), o mecanismo é outro —
-- ver professional_absence.sql, mais leve pra esse caso (uma linha por
-- período, não uma por hora).
--
-- SEMÂNTICA DE PRESENÇA (igual professional_availability): a LINHA EXISTIR é
-- o bloqueio. Não bloqueado = não existe linha.
-- ═════════════════════════════════════════════════════════════════════════════

create table public.professional_blocked_slot (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinic(id) on delete cascade,

  -- FK COMPOSTA com clinic_id — mesmo motivo de professional_availability
  -- (FK simples não passa por RLS, aceitaria profissional de outra clínica).
  professional_id uuid not null,

  date            date not null,
  hour            smallint not null,
  -- Livre e opcional, capturado no ConfirmDialog da Agenda geral no momento
  -- de salvar — só contexto, não afeta nenhuma regra do sistema.
  reason          text,
  created_at      timestamptz not null default now(),

  constraint professional_blocked_slot_hour_ck check (hour between 0 and 23),

  constraint professional_blocked_slot_uk unique (professional_id, clinic_id, date, hour),

  constraint professional_blocked_slot_professional_fk
    foreign key (professional_id, clinic_id) references public.professional(id, clinic_id)
    on delete cascade
);

comment on table public.professional_blocked_slot is
  'Bloqueio de UMA hora específica numa data real (domain.ts '
  'ProfessionalBlockedSlot) — "este profissional não atende nesta data, '
  'nesta hora". Não mexe em professional_availability (a regra recorrente) '
  'nem nas outras semanas. Para bloquear o DIA INTEIRO por vários dias '
  'seguidos (viagem/férias), ver professional_absence — mecanismo separado, '
  'mais leve para esse caso. Editado na Agenda geral, com um profissional '
  'filtrado.';
comment on column public.professional_blocked_slot.date is
  'Data real do calendário (não weekday) — é o que distingue este bloqueio da '
  'regra recorrente.';
comment on column public.professional_blocked_slot.hour is
  'Início do bloco de 1h bloqueado, mesma granularidade de '
  'professional_availability.hour.';
comment on column public.professional_blocked_slot.reason is
  'Motivo livre e opcional do bloqueio, capturado no ConfirmDialog da Agenda '
  'geral — só contexto, não afeta nenhuma regra do sistema.';

create index professional_blocked_slot_clinic_idx
  on public.professional_blocked_slot (clinic_id);
create index professional_blocked_slot_lookup_idx
  on public.professional_blocked_slot (professional_id, clinic_id, date);

create trigger tr_audit after insert or update or delete on public.professional_blocked_slot
  for each row execute function private.tg_audit();

revoke all on public.professional_blocked_slot from anon;

revoke insert, update, delete on public.professional_blocked_slot from authenticated;
grant insert (clinic_id, professional_id, date, hour, reason) on public.professional_blocked_slot to authenticated;
grant delete on public.professional_blocked_slot to authenticated;
-- Sem GRANT de UPDATE: mesmo raciocínio de professional_availability — a
-- célula só liga (insert) ou desliga (delete).

alter table public.professional_blocked_slot enable row level security;

-- Mesmo par de features de professional_availability: 'professionals' edita
-- (o controle mora na Agenda geral, mas quem pode mexer na disponibilidade do
-- profissional é a mesma permissão do perfil dele); 'schedule' no select
-- porque é a Agenda geral que lê isto pra apagar o "+" da célula bloqueada.
create policy professional_blocked_slot_select on public.professional_blocked_slot
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'professionals', 'schedule')
  );

create policy professional_blocked_slot_insert on public.professional_blocked_slot
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'professionals')
  );

create policy professional_blocked_slot_delete on public.professional_blocked_slot
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'professionals')
  );
