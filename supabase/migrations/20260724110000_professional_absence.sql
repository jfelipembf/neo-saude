-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — AUSÊNCIA POR PERÍODO DO PROFISSIONAL (VIAGEM, FÉRIAS, ATESTADO)
--
-- Modela: ProfessionalAbsence (src/types/domain.ts).
--
-- Roda DEPOIS de professional_availability.sql e professional_blocked_slot.sql.
--
-- TRÊS MECANISMOS DE DISPONIBILIDADE, cada um resolvendo uma pergunta:
--   professional_availability     REGRA recorrente     ("toda quinta, 8h-12h")
--   professional_absence          PERÍODO INTEIRO fora  ("de 03/03 a 10/03 estou fora")
--   professional_blocked_slot     HORA pontual fora     ("só dia 20/11 das 14h às 15h")
--
-- Por que não é tudo professional_blocked_slot (uma linha por hora)? Uma
-- semana de viagem seriam ~84 linhas (7 dias × 12h) só pra dizer "não vim
-- trabalhar" — professional_absence resolve isso com UMA linha (início/fim),
-- e é o desenho natural pra quem pensa em "estou fora esses dias", não em
-- "desliguei estas 84 células". Continuam existindo os dois porque servem a
-- telas diferentes: ausência é editada no perfil (Agenda > Disponibilidade),
-- bloqueio pontual é editado na Agenda geral, célula a célula.
--
-- SEMÂNTICA: o profissional fica INDISPONÍVEL em TODO horário de TODOS os
-- dias dentro de [start_date, end_date] (inclusive), independente do que a
-- regra recorrente diz pra aquele weekday.
-- ═════════════════════════════════════════════════════════════════════════════

create table public.professional_absence (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinic(id) on delete cascade,

  -- FK COMPOSTA com clinic_id — mesmo motivo de professional_availability.
  professional_id uuid not null,

  start_date      date not null,
  end_date        date not null,
  -- Livre e opcional ("Viagem", "Atestado", "Férias") — só pra contexto na
  -- tela; nada no sistema decide comportamento a partir do texto.
  reason          text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint professional_absence_range_ck check (end_date >= start_date),

  constraint professional_absence_professional_fk
    foreign key (professional_id, clinic_id) references public.professional(id, clinic_id)
    on delete cascade
);

comment on table public.professional_absence is
  'Período em que o profissional fica indisponível em TODOS os horários,
  TODOS os dias do intervalo (domain.ts ProfessionalAbsence) — viagem, férias,
  atestado. Diferente de professional_blocked_slot (hora pontual, um dia só):
  aqui é o dia INTEIRO, por quantos dias o período cobrir. Editado na aba
  Agenda > Disponibilidade do perfil do profissional.';
comment on column public.professional_absence.start_date is
  'Primeiro dia indisponível (inclusive).';
comment on column public.professional_absence.end_date is
  'Último dia indisponível (inclusive) — igual a start_date para um único dia.';
comment on column public.professional_absence.reason is
  'Motivo livre e opcional, só de contexto pra quem olha a agenda — não afeta '
  'nenhuma regra do sistema.';

-- Não há trava de sobreposição entre períodos do mesmo profissional (dois
-- períodos que se cruzam são redundantes, não errados — a checagem de
-- indisponibilidade é um "existe ALGUM período que cobre esta data", então
-- overlap não muda o resultado. Mesma filosofia de overbooking do resto do
-- schema: o banco não trava o que não é logicamente um erro.
create index professional_absence_lookup_idx
  on public.professional_absence (professional_id, clinic_id, start_date, end_date);
-- O índice acima tem professional_id à esquerda, não clinic_id — não cobre o
-- FK para clinic. Índice mínimo só para isso (mesma correção de
-- professional_availability_clinic_idx).
create index professional_absence_clinic_idx
  on public.professional_absence (clinic_id);

create trigger tr_touch before update on public.professional_absence
  for each row execute function private.tg_touch_updated_at();

create trigger tr_audit after insert or update or delete on public.professional_absence
  for each row execute function private.tg_audit();

revoke all on public.professional_absence from anon;

revoke insert, update, delete on public.professional_absence from authenticated;
grant insert (clinic_id, professional_id, start_date, end_date, reason)
  on public.professional_absence to authenticated;
grant update (start_date, end_date, reason) on public.professional_absence to authenticated;
grant delete on public.professional_absence to authenticated;

alter table public.professional_absence enable row level security;

-- Mesmo par de features de professional_availability/professional_blocked_slot.
create policy professional_absence_select on public.professional_absence
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'professionals', 'schedule')
  );

create policy professional_absence_insert on public.professional_absence
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'professionals')
  );

create policy professional_absence_update on public.professional_absence
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'professionals')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy professional_absence_delete on public.professional_absence
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'professionals')
  );
