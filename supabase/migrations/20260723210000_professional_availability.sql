-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — DISPONIBILIDADE RECORRENTE DO PROFISSIONAL
--
-- Modela: ProfessionalAvailabilitySlot (src/types/domain.ts).
--
-- Roda DEPOIS de 04-profissionais.sql (public.professional +
-- professional_id_clinic_uk) e 05-agenda (public.schedule_slot, cuja pendência
-- nº 6 é exatamente esta: "não há tabela de disponibilidade do profissional").
--
-- REGRA ÚNICA, sem exceção por semana (decisão do dono: a grade é a mesma
-- toda semana — não há hoje ajuste pontual de uma semana específica).
--
-- SEMÂNTICA DE PRESENÇA: a LINHA EXISTIR é o "disponível". Não há coluna
-- booleana — ausência da linha já significa que o profissional não atende
-- naquele weekday/hora.
--
-- SEM SEED PADRÃO: todo profissional nasce com a grade VAZIA (nenhuma
-- célula marcada) — o dono clica célula por célula nos horários em que ele
-- realmente atende. Existiu uma versão que semeava 06h-20h Seg-Sáb
-- automaticamente; foi removida por decisão do dono antes de qualquer
-- clínica real usar a tela: a grade cheia por padrão escondia o gesto de
-- marcar (tudo já vinha "disponível") e não refletia o expediente real de
-- ninguém.
-- ═════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · PROFESSIONAL_AVAILABILITY — a grade semanal recorrente
-- ─────────────────────────────────────────────────────────────────────────────

create table public.professional_availability (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinic(id) on delete cascade,

  -- FK COMPOSTA com clinic_id (ver o comentário em schedule_slot_patient_fk da
  -- fatia de Agenda): FK simples aceitaria o uuid de um profissional de OUTRA
  -- clínica, porque a checagem de FK roda dentro do servidor e não passa por
  -- RLS. professional_id_clinic_uk (04-profissionais.sql) existe para isso.
  professional_id uuid not null,

  weekday         smallint not null,
  hour            smallint not null,
  created_at      timestamptz not null default now(),

  constraint professional_availability_weekday_ck check (weekday between 0 and 6),
  constraint professional_availability_hour_ck check (hour between 0 and 23),

  -- A chave natural da regra (o que a UI risca/desriscar na grade). O índice
  -- que ela cria, com professional_id à esquerda, já atende toda leitura da
  -- tela ("a grade deste profissional") — sem índice separado.
  constraint professional_availability_uk unique (professional_id, clinic_id, weekday, hour),

  constraint professional_availability_professional_fk
    foreign key (professional_id, clinic_id) references public.professional(id, clinic_id)
    -- CASCADE (e não NO ACTION, como schedule_slot faz com paciente/profissional):
    -- disponibilidade não é documento — é preferência de agenda do profissional,
    -- não sobrevive a ele. Na prática o professional não tem policy de DELETE
    -- (sai de circulação com status='inactive'), então isso quase nunca dispara;
    -- fica correto para o dia em que um cadastro de teste for removido à mão.
    on delete cascade
);

comment on table public.professional_availability is
  'Grade semanal recorrente de disponibilidade (domain.ts '
  'ProfessionalAvailabilitySlot) — "este profissional atende toda ‹weekday› às '
  '‹hour›h". A LINHA EXISTIR é o "disponível"; não apagar não é "indisponível '
  'chumbado", é só "nunca foi marcado". Editada na aba Agenda do perfil do '
  'profissional. Sem conceito de exceção por semana: a grade vale igual toda '
  'semana. Sem seed padrão: nasce vazia, o dono marca célula por célula.';
comment on column public.professional_availability.weekday is
  '0 = Dom … 6 = Sáb — MESMA base do Date.getDay() do JavaScript e de '
  'schedule_slot.weekday, para consistência entre as duas grades semanais do '
  'sistema. A UI hoje só edita 1-6 (Seg-Sáb), mas a coluna aceita a faixa toda.';
comment on column public.professional_availability.hour is
  'Início do bloco de 1h (6 = 06:00–07:00 … 19 = 19:00–20:00). Granularidade '
  'fixa em hora cheia por decisão de produto — não existem meia-hora nem '
  'intervalos variáveis aqui, ao contrário de schedule_slot.start_time/end_time.';

-- O unique acima tem professional_id à esquerda, não clinic_id — ao contrário
-- de room/schedule_slot, não cobre o FK para clinic. Índice mínimo só para
-- isso (apagar uma clínica precisa achar as linhas em cascade sem seq scan).
create index professional_availability_clinic_idx
  on public.professional_availability (clinic_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · AUDITORIA
-- ─────────────────────────────────────────────────────────────────────────────

-- "Quem tirou meu horário de segunda?" é pergunta tão real quanto "quem tirou
-- meu horário fixo de segunda?" (o motivo de schedule_slot ter tr_audit).
create trigger tr_audit after insert or update or delete on public.professional_availability
  for each row execute function private.tg_audit();


-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · PRIVILÉGIOS DE COLUNA
--
-- `id`/`created_at` fora do INSERT (mesmo padrão do resto do schema).
-- `clinic_id` ENTRA no insert (como em room/schedule_slot): o cliente informa
-- a própria clínica e o WITH CHECK da policy confere que bate com
-- private.auth_clinic_ids().
-- ─────────────────────────────────────────────────────────────────────────────

revoke all on public.professional_availability from anon;

revoke insert, update, delete on public.professional_availability from authenticated;
grant insert (clinic_id, professional_id, weekday, hour) on public.professional_availability to authenticated;
grant delete on public.professional_availability to authenticated;
-- Sem GRANT de UPDATE: a célula só liga (INSERT) ou desliga (DELETE), nunca
-- muda de weekday/hour por baixo — trocar de célula é apagar uma e criar outra.


-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · RLS
--
-- Mesmo par de features de public.professional (professional_select/_update em
-- 04-profissionais.sql): 'professionals' é quem edita (a tela mora no perfil
-- do profissional). 'schedule' entra também no select porque a Agenda geral
-- já consulta esta tabela (filtro por profissional pinta a célula de verde
-- dentro do horário dele).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.professional_availability enable row level security;

create policy professional_availability_select on public.professional_availability
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'professionals', 'schedule')
  );

create policy professional_availability_insert on public.professional_availability
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'professionals')
  );

create policy professional_availability_delete on public.professional_availability
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'professionals')
  );


-- ═════════════════════════════════════════════════════════════════════════════
-- FIM DA FATIA — PENDÊNCIAS ASSUMIDAS
--
-- 1. Nada impede agendar uma consulta fora da disponibilidade marcada aqui —
--    a Agenda geral só EXIBE a disponibilidade (célula verde), não bloqueia
--    o agendamento fora dela.
-- 2. SEM EXCEÇÃO POR SEMANA. Existiu um desenho com uma segunda tabela
--    (professional_availability_exception) para desvio de UMA semana
--    específica — removido por decisão do dono antes de qualquer UI usar de
--    verdade. Se a necessidade voltar, o modelo natural é uma tabela irmã com
--    (professional_id, week_start, weekday, hour, available), igual ao que
--    schedule_slot × appointment já fazem para regra × ocorrência.
-- ═════════════════════════════════════════════════════════════════════════════
