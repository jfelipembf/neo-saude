-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — TURMAS COLETIVAS (Administrativo → Turmas)
--
-- Cadastro de uma turma recorrente (Pilates, RPG em grupo…): nome, profissional
-- responsável, sala, dias da semana + horário/duração compartilhados, capacidade
-- máxima e o período de vigência (início/fim). Mesmo desenho de `service`
-- (02-cadastros): LER é direito de qualquer membro do tenant, ESCREVER exige a
-- feature `admin`.
--
-- Um teste de "Pilates Solo" pode legitimamente repetir o NOME em duas turmas
-- com dias/horários diferentes (turma da manhã e da noite) — por isso, ao
-- contrário de room/service, NÃO há unique index no nome.
--
-- Escopo desta migration é só o CADASTRO da turma — matrícula de paciente e
-- controle de frequência (se vierem a existir) são fatias futuras separadas.
--
-- Depende de: 01-fundacao (clinic, private.auth_clinic_ids, can_edit_feature,
--             tg_touch_updated_at, tg_audit),
--             20260722120400_schedule.sql (professional, room — unique (id, clinic_id)).
-- ═════════════════════════════════════════════════════════════════════════════

create table public.class_group (
  id               uuid primary key default gen_random_uuid(),
  clinic_id        uuid not null references public.clinic(id) on delete cascade,
  name             text not null,
  professional_id  uuid,
  room_id          uuid,
  -- 0 = Dom … 6 = Sáb — mesma base do Date.getDay() do JS (ver schedule_slot.weekday).
  weekdays         smallint[] not null,
  start_time       time not null,
  duration_minutes integer not null,
  max_capacity     integer not null,
  start_date       date not null,
  end_date         date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint class_group_name_not_blank_ck check (btrim(name) <> ''),
  constraint class_group_weekdays_not_empty_ck check (cardinality(weekdays) > 0),
  constraint class_group_weekdays_range_ck check (weekdays <@ array[0,1,2,3,4,5,6]::smallint[]),
  constraint class_group_duration_positive_ck check (duration_minutes > 0),
  constraint class_group_capacity_positive_ck check (max_capacity > 0),
  constraint class_group_dates_ck check (end_date is null or end_date >= start_date),

  -- Alvo de futuras FKs compostas (matrícula/frequência).
  constraint class_group_id_clinic_uk unique (id, clinic_id),

  constraint class_group_professional_fk
    foreign key (professional_id, clinic_id) references public.professional(id, clinic_id)
    on delete set null (professional_id),
  constraint class_group_room_fk
    foreign key (room_id, clinic_id) references public.room(id, clinic_id)
    on delete set null (room_id)
);

comment on table public.class_group is
  'Turma coletiva recorrente (domain.ts ClassGroup) — Administrativo → Turmas. '
  'Nome/profissional/sala/horário/capacidade compartilhados por todos os dias '
  'da semana selecionados (weekdays); sem matrícula/frequência ainda.';
comment on column public.class_group.weekdays is
  'Dias da semana em que a turma acontece, 0=Dom…6=Sáb — todos compartilham o '
  'mesmo start_time/duration_minutes (não há horário diferente por dia).';
comment on column public.class_group.end_date is
  'NULL = turma contínua, sem data prevista de encerramento.';

create index class_group_clinic_idx on public.class_group (clinic_id);

-- ── Triggers ─────────────────────────────────────────────────────────────────
create trigger tr_touch before update on public.class_group
  for each row execute function private.tg_touch_updated_at();
create trigger tr_audit after insert or update or delete on public.class_group
  for each row execute function private.tg_audit();

-- ── Privilégios de coluna (RLS decide QUAIS LINHAS; GRANT, QUAIS COLUNAS) ─────
revoke all on public.class_group from anon;
revoke update, truncate on public.class_group from anon, authenticated;
grant update (name, professional_id, room_id, weekdays, start_time, duration_minutes, max_capacity, start_date, end_date)
  on public.class_group to authenticated;
-- `clinic_id` fora da lista: mudar o tenant de uma linha É o vazamento.

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.class_group enable row level security;

create policy class_group_select on public.class_group
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids()));

create policy class_group_insert on public.class_group
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

create policy class_group_update on public.class_group
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy class_group_delete on public.class_group
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );
