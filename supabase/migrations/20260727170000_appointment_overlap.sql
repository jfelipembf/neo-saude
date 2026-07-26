-- ═══════════════════════════════════════════════════════════════════════════
-- TRAVA DE AGENDA DUPLA DO PROFISSIONAL — de volta, com escape explícito
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Ela existia (appointment_professional_overlap_ex) e foi removida de propósito
-- em 20260722120400_schedule.sql:326-330, com um argumento correto:
--
--   "overbooking é operação real, não erro, e o banco não distingue o encaixe
--    proposital do choque acidental."
--
-- O que muda aqui: o banco PASSA a distinguir. `is_overbook` é a declaração de
-- intenção — marcada, a consulta fica fora da trava e o encaixe continua
-- possível; não marcada, choque acidental é barrado.
--
-- Por que voltar agora: a regra de "onde pode marcar" vivia só no CLIENTE, e
-- pior, dentro do botão "+" do ScheduleGrid — o AppointmentModal tinha uma
-- versão mais fraca que ignorava bloqueio, ausência e consulta existente. Com a
-- assistente de voz agendando, o choque acidental deixaria de exigir um arrastar
-- consciente na grade e passaria a caber numa frase mal entendida.
--
-- CANCELADA e FALTA continuam não ocupando, igual à trava de sala: o horário
-- vagou e a recepção precisa poder revender aquele espaço.
alter table public.appointment
  add column if not exists is_overbook boolean not null default false;

comment on column public.appointment.is_overbook is
  'Encaixe declarado: tira a consulta da trava de agenda dupla do profissional. '
  'Existe para o banco distinguir o encaixe proposital do choque acidental — que '
  'era exatamente a razão de a trava ter sido removida.';

grant insert (is_overbook) on public.appointment to authenticated;
grant update (is_overbook) on public.appointment to authenticated;

alter table public.appointment
  drop constraint if exists appointment_professional_overlap_ex;

alter table public.appointment
  add constraint appointment_professional_overlap_ex exclude using gist (
    professional_id extensions.gist_uuid_ops with =,
    tsrange(starts_at, ends_at) with &&
  ) where (
    professional_id is not null
    and status <> 'canceled'
    and status <> 'no_show'
    and is_overbook = false
  );
