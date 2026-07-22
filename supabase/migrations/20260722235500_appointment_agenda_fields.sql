-- ─────────────────────────────────────────────────────────────────────────────
-- A Agenda passa a criar consultas DATADAS direto em appointment (consulta é
-- um evento único, não recorrência semanal — decisão do dono). Os três campos
-- do modal que só existiam em schedule_slot passam a existir na consulta:
-- observações, cor do card e o aviso de confirmação ao paciente.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.appointment
  add column if not exists notes text,
  add column if not exists color text,
  add column if not exists send_confirmation boolean not null default false;

comment on column public.appointment.notes is
  'Observações livres do agendamento (modal da Agenda).';
comment on column public.appointment.color is
  'Cor do card na grade (hex) — derivada da especialidade ao criar.';
comment on column public.appointment.send_confirmation is
  'Enviar mensagem de confirmação ao paciente.';
