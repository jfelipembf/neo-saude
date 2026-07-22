-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — 05 · AGENDA E ATENDIMENTOS
--
-- Modela: Room, ScheduleSlot, Appointment, AppointmentHistory, UsedMaterial
--         (src/types/domain.ts).
--
-- Roda DEPOIS de (ver 00-README.md para a ordem completa):
--   01-fundacao.sql      → clinic, private.auth_clinic_ids(),
--                          private.can_access_feature/can_edit_feature,
--                          private.tg_touch_updated_at(), private.tg_audit(),
--                          domínio public.hex_color
--   02-cadastros.sql     → public.material     (+ material_id_clinic_uk)
--   03-pacientes.sql     → public.patient      (+ patient_id_clinic_uk)
--   04-profissionais.sql → public.professional (+ professional_id_clinic_uk,
--                          private.is_clean_text_array)
--
-- ORDENAÇÃO RESOLVIDA NA CONSOLIDAÇÃO: `material` nascia em 07-comercial.sql,
-- que rodava depois desta fatia. Foi movida para 02-cadastros.sql, junto com
-- `insurance` (mesmo problema em 03-pacientes.sql). Os prefixos numéricos atuais
-- são a ordem de execução — rodar em ordem alfabética funciona.
--
-- ── O MODELO EM UMA FRASE ────────────────────────────────────────────────────
--
--   schedule_slot        REGRA semanal recorrente  ("toda segunda 07:00–08:00")
--   appointment          OCORRÊNCIA de um dia      ("segunda 20/07, 07:00")
--   appointment_history  O QUE ACONTECEU           (evolução clínica, prontuário)
--
-- São três tabelas e não uma porque respondem a três perguntas com ciclos de
-- vida diferentes:
--   · a regra vale até alguém mudá-la (baixa rotatividade, é a grade da tela);
--   · a ocorrência tem status próprio (confirmou? faltou? está em atendimento?)
--     e NÃO pode morrer junto com a regra — cancelar a recorrência não apaga a
--     consulta de terça que já foi atendida;
--   · o histórico é documento clínico: nasce depois do atendimento, sobrevive a
--     tudo e é o que o Conselho pede para ver.
-- Achatar as três em uma tabela obrigaria a materializar o ano inteiro de
-- ocorrências no cadastro da regra (e a reescrever tudo a cada alteração).
--
-- A MATERIALIZAÇÃO (virar a regra em ocorrências do dia) é da aplicação/cron,
-- não do banco: depende de feriado, férias do profissional e janela de
-- antecedência — regra de negócio que muda sem migration.
--
-- ── DIVERGÊNCIAS CONSCIENTES EM RELAÇÃO AO domain.ts ─────────────────────────
--   ScheduleSlot.room (nome, texto)  → schedule_slot.room_id (FK real)
--   Appointment (só `time`)          → appointment.date + start_time + duração
--   AppointmentHistory.duration "40 min" → duration_minutes integer
--   AppointmentHistory.time          → start_time (evita o keyword `time`)
-- Cada uma está comentada no ponto de uso.
-- ═════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 0 · EXTENSÃO
--
-- btree_gist é o que permite misturar `uuid WITH =` (e `smallint WITH =`) com
-- `tsrange WITH &&` no mesmo índice GiST — sem ele não existe trava de
-- sobreposição de horário.
--
-- CONTINUA OBRIGATÓRIA depois de as travas de PROFISSIONAL saírem (ver seções 3
-- e 4): as duas travas de SALA que ficaram dependem dela, e NÃO pela mesma
-- combinação de tipos — appointment_room_overlap_ex mistura `room_id uuid
-- WITH =` com `tsrange WITH &&`; schedule_slot_room_overlap_ex acrescenta a
-- essas duas o `weekday smallint WITH =`. Nem uuid nem smallint entram num GiST
-- sem btree_gist, então tirar a extensão derruba as duas travas de sala junto.
--
-- Os opclasses abaixo são referenciados QUALIFICADOS (extensions.gist_uuid_ops)
-- de propósito: assim a criação das constraints não depende do search_path da
-- sessão que rodar a migration.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists btree_gist with schema extensions;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · ENUMS DA FATIA
--
-- Valores idênticos aos literais do domain.ts — nada traduzido, nada inventado.
-- ─────────────────────────────────────────────────────────────────────────────

create type public.appointment_status as enum (
  'scheduled', 'confirmed', 'in_service', 'completed', 'canceled', 'no_show'
);
comment on type public.appointment_status is
  'domain.ts AppointmentStatus. Ciclo de vida da consulta do dia: scheduled '
  '(marcada) → confirmed (paciente confirmou) → in_service (na cadeira) → '
  'completed. canceled = desmarcada com aviso, no_show = não apareceu. A '
  'distinção existe porque só uma das duas cobra taxa e entra no indicador de '
  'falta do profissional.';

create type public.schedule_slot_status as enum ('active', 'canceled');
comment on type public.schedule_slot_status is
  'domain.ts ScheduleSlotStatus. NÃO é public.active_status (active|inactive): a '
  'grade semanal fala em "cancelado", e o card cancelado continua desenhado na '
  'tela riscado — some da operação, não da vista.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · ROOM — sala de atendimento (Administrativo → Salas)
--
-- Hoje o front referencia a sala por NOME dentro de ScheduleSlot.room. Aqui ela
-- é entidade com id: renomear "Sala 2" para "Consultório Fundos" não pode
-- desagendar ninguém, e a grade precisa saber se a sala está ocupada.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.room (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references public.clinic(id) on delete cascade,
  name       text not null,
  photo_url  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint room_name_not_blank_ck check (btrim(name) <> ''),
  -- Alvo das FKs compostas de schedule_slot e appointment. É o que impede
  -- agendar na sala de OUTRA clínica: a checagem de FK roda por dentro do
  -- servidor e NÃO passa por RLS, então a policy sozinha não protegeria aqui.
  constraint room_id_clinic_uk unique (id, clinic_id)
);

comment on table public.room is
  'Sala/consultório físico (domain.ts Room). ON DELETE CASCADE na clínica: sala '
  'não existe fora do tenant.';
comment on column public.room.name is
  'Nome exibido ("Consultório 1"). Único por clínica sem diferenciar caixa — é a '
  'chave natural que a equipe usa em voz alta, e duas "Sala 2" na mesma lista é '
  'erro de digitação, não cadastro.';
comment on column public.room.photo_url is
  'domain.ts Room.photo — URL pública do Storage (o mock usa object URL local).';

create unique index room_name_uk on public.room (clinic_id, lower(name));
-- Sem índice separado em clinic_id: o unique acima já tem clinic_id à esquerda e
-- atende a policy de RLS.


-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · SCHEDULE_SLOT — a grade semanal recorrente
-- ─────────────────────────────────────────────────────────────────────────────

create table public.schedule_slot (
  id                uuid primary key default gen_random_uuid(),
  clinic_id         uuid not null references public.clinic(id) on delete cascade,

  -- Paciente e profissional são de OUTRAS fatias, e as FKs para eles são
  -- COMPOSTAS com clinic_id (constraints no fim da tabela) — 03-pacientes.sql e
  -- 04-profissionais.sql declaram `unique (id, clinic_id)` exatamente para isso.
  -- FK simples aqui seria buraco de tenant: a checagem de FK roda por dentro do
  -- servidor e NÃO passa por RLS, então um patient_id de outra clínica entraria.
  patient_id        uuid not null,
  professional_id   uuid not null,

  room_id           uuid,
  activity          text not null,
  weekday           smallint not null,
  start_time        time not null,
  end_time          time not null,
  color             public.hex_color,
  status            public.schedule_slot_status not null default 'active',
  notes             text,
  send_confirmation boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint schedule_slot_activity_not_blank_ck check (btrim(activity) <> ''),
  constraint schedule_slot_weekday_ck check (weekday between 0 and 6),
  constraint schedule_slot_time_order_ck check (end_time > start_time),

  -- Alvo da FK composta de appointment.
  constraint schedule_slot_id_clinic_uk unique (id, clinic_id),

  -- Paciente e profissional da MESMA clínica. ON DELETE NO ACTION (e não
  -- RESTRICT) pelo mesmo motivo que a fundação usa em clinic_user: os dois
  -- barram apagar um registro com agenda pendurada, mas RESTRICT confere na
  -- hora e NO ACTION confere no fim do statement. Ao apagar uma clínica, o
  -- CASCADE remove patient/professional/schedule_slot na MESMA instrução, em
  -- ordem indefinida — com RESTRICT isso estouraria conforme a sorte do plano.
  constraint schedule_slot_patient_fk
    foreign key (patient_id, clinic_id) references public.patient(id, clinic_id)
    on delete no action,
  constraint schedule_slot_professional_fk
    foreign key (professional_id, clinic_id) references public.professional(id, clinic_id)
    on delete no action,

  -- Sala da MESMA clínica (ver o comentário em room_id_clinic_uk).
  -- `on delete set null (room_id)` — a lista de colunas (PG 15+) é obrigatória
  -- aqui: sem ela o SET NULL zeraria TAMBÉM o clinic_id da FK composta, e
  -- clinic_id é NOT NULL. Seria um erro em produção no dia em que alguém
  -- apagasse uma sala.
  constraint schedule_slot_room_fk
    foreign key (room_id, clinic_id) references public.room(id, clinic_id)
    on delete set null (room_id),

  -- NÃO EXISTE MAIS trava de sobreposição por PROFISSIONAL aqui. Havia
  -- `schedule_slot_professional_overlap_ex` (mesma forma da de sala, trocando
  -- room_id por professional_id) e ela foi REMOVIDA por decisão do dono:
  -- consultório com duas cadeiras faz overbooking DE PROPÓSITO — um dentista
  -- alterna entre dois pacientes na mesma hora, e o banco recusava a grade que
  -- descreve o trabalho real da clínica.
  --
  -- O QUE SE PERDEU: a trava também resolvia a CORRIDA — duas recepcionistas
  -- salvando ao mesmo tempo passam por qualquer validação feita antes do INSERT,
  -- e só o índice via as duas linhas. Isso agora é impossível de barrar no
  -- banco: overbooking legítimo e choque acidental são, para o Postgres, a
  -- mesma linha. A trava virou AVISO — public.professional_slot_conflicts()
  -- (seção 11) devolve os horários que se sobrepõem para a UI perguntar "este
  -- profissional já tem horário aqui — confirmar mesmo assim?".
  -- Aviso não vence corrida: se as duas recepcionistas salvarem no mesmo
  -- instante, as duas linhas entram. É o preço aceito para liberar overbooking.
  --
  -- A trava de SALA continua: espaço físico não se divide.
  --
  -- CONSEQUÊNCIA A CONHECER: `room` é UNIDADE DE OCUPAÇÃO, não parede. Se o
  -- consultório de duas cadeiras for cadastrado como UMA sala, a trava de sala
  -- barra o overbooking que acabamos de liberar — o profissional passa, a sala
  -- não. Cadeira que atende em paralelo é UMA LINHA em `room` ("Consultório 1 —
  -- Cadeira A", "… Cadeira B"), e é assim que a grade fica honesta: dois
  -- atendimentos ao mesmo tempo em lugares distintos. Deixar room_id NULL também
  -- passa (a trava é parcial), mas aí a sala some da grade.
  --
  -- A data fixa é só o eixo do intervalo: interessa o par (início, fim) dentro
  -- do dia da semana, que já entra como coluna de igualdade.
  constraint schedule_slot_room_overlap_ex exclude using gist (
    room_id extensions.gist_uuid_ops with =,
    weekday extensions.gist_int2_ops with =,
    tsrange(date '2000-01-01' + start_time, date '2000-01-01' + end_time) with &&
  ) where (status = 'active' and room_id is not null)
);

comment on table public.schedule_slot is
  'REGRA semanal recorrente da agenda (domain.ts ScheduleSlot) — é o que a tela '
  'Agenda desenha e o que o modal "Nova consulta" grava. Não é a consulta de um '
  'dia: essa é public.appointment.';
comment on column public.schedule_slot.weekday is
  '0 = Dom … 6 = Sáb — MESMA base do Date.getDay() do JavaScript, que é o que o '
  'front já usa. Não é a numeração ISO (1–7, seg–dom): trocar a base aqui '
  'desloca a grade inteira em um dia e o bug só aparece no domingo.';
comment on column public.schedule_slot.activity is
  'Tipo de atendimento/etiqueta ("Fisioterapia", "Pilates clínico"). Texto livre '
  'porque o domain.ts é texto livre — quando existir catálogo de serviços, vira '
  'service_id e a cor sai daqui para lá.';
comment on column public.schedule_slot.color is
  'Cor do card na grade. Hoje viaja junto com a atividade (o mock repete o mesmo '
  'hex para toda linha de "Fisioterapia") — é o sintoma de que a cor pertence ao '
  'catálogo de serviços, não ao horário.';
comment on column public.schedule_slot.room_id is
  'domain.ts traz ScheduleSlot.room como NOME. Aqui é FK: renomear a sala não '
  'pode quebrar o vínculo, e sem id não dá para travar sala ocupada. Nulável — '
  'atendimento remoto/domiciliar não tem sala.';
comment on column public.schedule_slot.status is
  'canceled não apaga a regra: a grade mostra o horário cancelado para que a '
  'recepção saiba que aquele espaço vagou (e para quem).';
comment on column public.schedule_slot.send_confirmation is
  'Dispara a mensagem de confirmação ao paciente (add-on whatsapp). NOT NULL com '
  'default false: mandar mensagem é opt-in explícito, nunca consequência de um '
  'campo esquecido em NULL.';

create index schedule_slot_grid_idx
  on public.schedule_slot (clinic_id, weekday, start_time);
create index schedule_slot_professional_idx
  on public.schedule_slot (clinic_id, professional_id, weekday, start_time);
create index schedule_slot_patient_idx
  on public.schedule_slot (clinic_id, patient_id);
create index schedule_slot_room_idx
  on public.schedule_slot (room_id) where room_id is not null;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · APPOINTMENT — a consulta de um DIA
-- ─────────────────────────────────────────────────────────────────────────────

create table public.appointment (
  id               uuid primary key default gen_random_uuid(),
  clinic_id        uuid not null references public.clinic(id) on delete cascade,

  -- De qual regra semanal esta ocorrência nasceu. Nulável: encaixe e consulta
  -- avulsa não vêm de regra nenhuma.
  schedule_slot_id uuid,

  -- FKs COMPOSTAS com clinic_id no fim da tabela (ver schedule_slot).
  patient_id       uuid not null,
  professional_id  uuid not null,
  room_id          uuid,

  service          text not null,
  date             date not null,
  start_time       time not null,
  duration_minutes integer not null default 30,
  status           public.appointment_status not null default 'scheduled',

  -- Relógio da clínica, materializado: dá ordenação, é o eixo da trava de sala e
  -- o par que public.professional_conflicts() compara (seção 11).
  -- `timestamp` SEM fuso de propósito — 14:00 é 14:00 na parede da
  -- clínica, e converter para UTC faria a agenda andar sozinha no horário de
  -- verão de um país que já o aboliu (e pode reinstituí-lo).
  starts_at timestamp generated always as ("date" + start_time) stored,
  ends_at   timestamp generated always as
              ("date" + start_time + make_interval(mins => duration_minutes)) stored,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint appointment_service_not_blank_ck check (btrim(service) <> ''),
  constraint appointment_duration_ck check (duration_minutes > 0 and duration_minutes <= 1440),

  -- Alvo da FK composta de appointment_history.
  constraint appointment_id_clinic_uk unique (id, clinic_id),

  -- Paciente e profissional da MESMA clínica (ver schedule_slot_patient_fk).
  constraint appointment_patient_fk
    foreign key (patient_id, clinic_id) references public.patient(id, clinic_id)
    on delete no action,
  constraint appointment_professional_fk
    foreign key (professional_id, clinic_id) references public.professional(id, clinic_id)
    on delete no action,

  -- Regra semanal da MESMA clínica. SET NULL só na coluna do slot (ver a nota
  -- em schedule_slot_room_fk): apagar a recorrência não pode apagar — nem
  -- desamarrar do tenant — a consulta que já aconteceu.
  constraint appointment_schedule_slot_fk
    foreign key (schedule_slot_id, clinic_id)
    references public.schedule_slot(id, clinic_id)
    on delete set null (schedule_slot_id),

  constraint appointment_room_fk
    foreign key (room_id, clinic_id) references public.room(id, clinic_id)
    on delete set null (room_id),

  -- NÃO EXISTE MAIS trava de agenda dupla do PROFISSIONAL (era
  -- `appointment_professional_overlap_ex`). Mesma decisão de schedule_slot:
  -- overbooking é operação real, não erro, e o banco não distingue o encaixe
  -- proposital do choque acidental. O aviso equivalente é
  -- public.professional_conflicts() (seção 11) — não bloqueia, informa.
  --
  -- A trava de SALA fica. Cancelada e falta NÃO ocupam: o horário vagou e a
  -- recepção precisa poder revender aquele espaço.
  constraint appointment_room_overlap_ex exclude using gist (
    room_id extensions.gist_uuid_ops with =,
    tsrange(starts_at, ends_at) with &&
  ) where (room_id is not null and status <> 'canceled' and status <> 'no_show')
);

comment on table public.appointment is
  'A consulta de um DIA (domain.ts Appointment) — o que a lista "Consultas de '
  'hoje" do Dashboard mostra e onde vive o status do atendimento. Ocorrência '
  'materializada da regra semanal (schedule_slot) ou encaixe avulso.';
comment on column public.appointment.date is
  'domain.ts Appointment não tem data porque o mock é sempre "hoje". No banco a '
  'data é obrigatória: sem ela não existe histórico, nem no-show de ontem, nem '
  'gráfico de consultas por período.';
comment on column public.appointment.start_time is
  'domain.ts Appointment.time. Hora de parede (`time`), não timestamp — a '
  'combinação com `date` está materializada em starts_at.';
comment on column public.appointment.duration_minutes is
  'Duração em minutos. É o que o domain.ts guarda como texto ("40 min") em '
  'AppointmentHistory.duration — aqui é número, porque a agenda soma, compara e '
  'desenha altura de card com ele. Default 30 para que um INSERT no formato do '
  'mock (que não tem duração) não quebre — o front manda a duração do serviço.';
comment on column public.appointment.schedule_slot_id is
  'Regra que gerou esta ocorrência. Nulável e com SET NULL: encaixe não tem '
  'regra, e regra apagada não pode levar o atendimento junto.';
comment on column public.appointment.room_id is
  'Sala do dia. Não está no domain.ts (só ScheduleSlot tem sala), e está aqui '
  'porque a ocorrência precisa poder divergir da regra: sala em manutenção troca '
  'o atendimento de quinta sem reescrever a grade semanal inteira.';
comment on column public.appointment.service is
  'Tipo do atendimento ("Consulta clínica", "Retorno"). Mesmo conceito de '
  'schedule_slot.activity — os dois nomes vêm do domain.ts e foram mantidos para '
  'o service do front mapear 1:1.';
comment on column public.appointment.ends_at is
  'Fim calculado. Coluna GERADA (não confie no client para mantê-la) e STORED '
  'porque é indexada pela trava de sobreposição de sala — e é o que '
  'professional_conflicts() compara para avisar de agenda dupla.';

create index appointment_day_idx
  on public.appointment (clinic_id, date, start_time);
create index appointment_professional_day_idx
  on public.appointment (clinic_id, professional_id, date, start_time);
create index appointment_patient_idx
  on public.appointment (clinic_id, patient_id, date desc);
-- Dashboard: "confirmações pendentes" é uma fatia pequena de uma tabela que
-- cresce para sempre — índice parcial paga muito mais que o índice cheio.
create index appointment_pending_idx
  on public.appointment (clinic_id, date)
  where status in ('scheduled', 'confirmed');
-- Índice da FK composta appointment_schedule_slot_fk. NÃO dá para substituí-lo
-- pelo unique abaixo: aquele é parcial em `status <> 'canceled'`, e o SET NULL
-- disparado ao apagar uma regra precisa achar TAMBÉM as ocorrências canceladas —
-- com índice parcial demais, vira seq scan na tabela que mais cresce.
create index appointment_slot_idx
  on public.appointment (schedule_slot_id, clinic_id) where schedule_slot_id is not null;
create index appointment_room_idx
  on public.appointment (room_id) where room_id is not null;

-- Idempotência da MATERIALIZAÇÃO. Uma regra semanal gera no MÁXIMO uma ocorrência
-- viva por data — sem esta chave, um cron que roda duas vezes (retry, deploy
-- concorrente, job manual) duplica a agenda inteira do dia.
-- AGORA É A ÚNICA PROTEÇÃO CONTRA ISSO: enquanto existiu a trava de sobreposição
-- por profissional, a duplicata esbarrava nela por acidente; com o overbooking
-- liberado, duas ocorrências idênticas do mesmo profissional no mesmo horário
-- são um INSERT válido. Esta chave é o que separa "encaixe proposital" de "o job
-- rodou duas vezes".
-- `canceled` fica FORA do índice de propósito: desmarcar e reagendar o mesmo dia
-- é operação normal da recepção, e a linha cancelada não pode travar a nova.
create unique index appointment_slot_date_uk
  on public.appointment (schedule_slot_id, date)
  where schedule_slot_id is not null and status <> 'canceled';


-- ─────────────────────────────────────────────────────────────────────────────
-- 5 · APPOINTMENT_HISTORY — o que aconteceu (timeline do prontuário)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.appointment_history (
  id               uuid primary key default gen_random_uuid(),
  clinic_id        uuid not null references public.clinic(id) on delete cascade,
  -- FKs COMPOSTAS com clinic_id no fim da tabela (ver schedule_slot).
  patient_id       uuid not null,
  professional_id  uuid not null,

  -- Consulta que originou o registro. Nulável de propósito: atendimento
  -- retroativo, importação de base antiga e encaixe registrado só no fim do dia
  -- existem, e um prontuário nunca pode ser recusado por falta de agendamento.
  appointment_id   uuid,

  date             date not null,
  start_time       time not null,
  service          text not null,
  duration_minutes integer,
  procedures       text[] not null default '{}',
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint appointment_history_service_not_blank_ck check (btrim(service) <> ''),
  constraint appointment_history_duration_ck
    check (duration_minutes is null or (duration_minutes > 0 and duration_minutes <= 1440)),
  -- Mesma regra dos arrays de currículo do profissional (helper de
  -- 04-profissionais.sql): sem elemento NULL, sem string em branco e com teto.
  -- O check anterior só barrava NULL — procedimento vazio ("") entrava, sumia da
  -- tela e ainda contava na lista.
  constraint appointment_history_procedures_ck
    check (private.is_clean_text_array(procedures, 60)),

  -- Alvo da FK composta de appointment_history_material.
  constraint appointment_history_id_clinic_uk unique (id, clinic_id),

  -- Paciente e profissional da MESMA clínica (ver schedule_slot_patient_fk).
  constraint appointment_history_patient_fk
    foreign key (patient_id, clinic_id) references public.patient(id, clinic_id)
    on delete no action,
  constraint appointment_history_professional_fk
    foreign key (professional_id, clinic_id) references public.professional(id, clinic_id)
    on delete no action,

  constraint appointment_history_appointment_fk
    foreign key (appointment_id, clinic_id)
    references public.appointment(id, clinic_id)
    on delete set null (appointment_id)
);

comment on table public.appointment_history is
  'Evolução clínica: o registro do que foi FEITO na consulta (domain.ts '
  'AppointmentHistory) — a timeline do perfil do paciente. Separado de '
  'appointment porque documento clínico não compartilha ciclo de vida com '
  'compromisso de agenda: a consulta pode ser remarcada, o atendimento não '
  'volta atrás.';
comment on column public.appointment_history.start_time is
  'domain.ts AppointmentHistory.time. Renomeado porque `time` é palavra-chave de '
  'tipo em SQL e vira ambiguidade em expressão (`time + interval`).';
comment on column public.appointment_history.duration_minutes is
  'Duração real do atendimento em minutos. O domain.ts guarda "40 min" (texto de '
  'tela). Aqui é número porque média de duração por serviço é a conta que '
  'dimensiona a grade. Nulável: registro antigo/importado pode não ter.';
comment on column public.appointment_history.procedures is
  'O que foi feito, em ordem. text[] e NÃO tabela filha porque cada item é um '
  'escalar sem atributo próprio (a regra de tabela filha vale para array de '
  'OBJETO — é o caso de materials logo abaixo). Vira tabela no dia em que o '
  'procedimento tiver código TUSS/valor.';
comment on column public.appointment_history.appointment_id is
  'Consulta de origem, quando houve. SET NULL só na coluna (a FK é composta com '
  'clinic_id, que é NOT NULL).';

create index appointment_history_patient_idx
  on public.appointment_history (clinic_id, patient_id, date desc, start_time desc);
create index appointment_history_professional_idx
  on public.appointment_history (clinic_id, professional_id, date desc);
create index appointment_history_appointment_idx
  on public.appointment_history (appointment_id) where appointment_id is not null;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6 · APPOINTMENT_HISTORY_MATERIAL — insumos gastos (domain.ts UsedMaterial)
--
-- Array de OBJETO no TS ({ name, quantity }) ⇒ tabela filha, não jsonb: é o que
-- permite responder "quanto de anestésico saiu este mês" sem varrer jsonb.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.appointment_history_material (
  id                     uuid primary key default gen_random_uuid(),
  clinic_id              uuid not null references public.clinic(id) on delete cascade,
  appointment_history_id uuid not null,

  -- Insumo do estoque, quando o material usado estiver cadastrado. Nulável e
  -- SET NULL: o registro clínico não pode depender de o almoxarifado ter
  -- cadastrado o item, nem sumir quando alguém limpar o cadastro de materiais.
  -- A FK COMPOSTA está declarada no fim do CREATE TABLE (ver
  -- appointment_history_material_material_fk) — aqui a coluna nasce sem FK.
  material_id            uuid,

  name                   text not null,
  quantity               text not null,
  position               integer not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  constraint appointment_history_material_name_not_blank_ck check (btrim(name) <> ''),
  constraint appointment_history_material_quantity_not_blank_ck check (btrim(quantity) <> ''),
  constraint appointment_history_material_position_ck check (position >= 0),

  -- CASCADE: o insumo só existe dentro do registro da consulta. FK composta com
  -- clinic_id para que ninguém pendure material no prontuário de outra clínica
  -- (a checagem de FK não passa por RLS).
  constraint appointment_history_material_parent_fk
    foreign key (appointment_history_id, clinic_id)
    references public.appointment_history(id, clinic_id)
    on delete cascade,

  -- CORRIGIDO NA CONSOLIDAÇÃO. Era `references public.material(id)` — FK SIMPLES,
  -- que aceita o uuid de um material de OUTRA clínica: a checagem de FK roda por
  -- dentro do servidor e NÃO passa por RLS. 02-cadastros.sql declara
  -- `material_id_clinic_uk unique (id, clinic_id)` justamente para permitir a
  -- forma composta, que é o padrão do conjunto.
  --
  -- SET NULL COM LISTA DE COLUNAS (PostgreSQL 15+): sem a lista, o SET NULL de
  -- uma FK composta zeraria TAMBÉM `clinic_id`, que é NOT NULL, e o DELETE do
  -- material estouraria. Descadastrar um insumo desamarra a linha do prontuário;
  -- não apaga nem move o registro de tenant.
  constraint appointment_history_material_material_fk
    foreign key (material_id, clinic_id)
    references public.material(id, clinic_id)
    on delete set null (material_id)
);

comment on table public.appointment_history_material is
  'Insumos consumidos na consulta (domain.ts UsedMaterial). clinic_id é '
  'redundante por join e está aqui de propósito — é a regra 1 da fundação: '
  'policy direta, sem subselect.';
comment on column public.appointment_history_material.name is
  'Nome CONGELADO no momento do atendimento. Existe mesmo com material_id '
  'preenchido: o prontuário tem de continuar legível depois de o item ser '
  'renomeado ou descadastrado — referência é por id, mas aqui o texto é o ponto.';
comment on column public.appointment_history_material.quantity is
  'Quantidade como texto ("2 un", "5 ml") — é o que o domain.ts entrega. Vira '
  'quantity numeric + unit no dia em que o consumo baixar estoque de verdade.';
comment on column public.appointment_history_material.position is
  'Ordem de exibição. Sem ela a lista sai na ordem física do heap, que muda '
  'depois do primeiro UPDATE — o usuário vê os materiais se reordenando sozinhos.';

create index appointment_history_material_parent_idx
  on public.appointment_history_material (clinic_id, appointment_history_id, position);
create index appointment_history_material_material_idx
  on public.appointment_history_material (material_id) where material_id is not null;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7 · CARIMBO DE patient.last_visit
--
-- CONTRATO COM A FATIA DE PACIENTES: 03-pacientes.sql declara `last_visit` como
-- CACHE e o deixa FORA do GRANT de UPDATE do cliente, com a nota "é a Agenda que
-- carimba". Sem esta trigger a coluna fica NULL para sempre e a listagem de
-- pacientes (que ordena e filtra por ela) nasce quebrada.
--
-- SECURITY DEFINER porque é justamente o ponto: o cliente NÃO pode escrever a
-- data da última visita, senão a lista mentiria sem deixar rastro.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function private.tg_appointment_touch_last_visit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Só AVANÇA a data. Reabrir uma consulta antiga (ou corrigir o status de um
  -- atendimento de março) não pode fazer o paciente "regredir" na lista — o
  -- cache responde "quando veio pela última vez", não "qual foi o último UPDATE".
  update public.patient p
     set last_visit = new.date
   where p.id = new.patient_id
     and p.clinic_id = new.clinic_id
     and (p.last_visit is null or p.last_visit < new.date);
  return null;
end;
$$;

comment on function private.tg_appointment_touch_last_visit() is
  'Carimba public.patient.last_visit quando uma consulta vira completed. É a '
  'contrapartida da fatia de Pacientes, que reserva a coluna para a Agenda. Não '
  'recalcula para trás: se um atendimento concluído for apagado, o cache fica '
  'adiantado — imprecisão barata perto de varrer o histórico a cada DELETE.';

revoke execute on function private.tg_appointment_touch_last_visit() from public;

-- WHEN no gatilho (e não `if` no corpo): consulta que nunca fica completed não
-- paga sequer a chamada da função.
create trigger tr_touch_patient_last_visit
  after insert or update of status, "date", patient_id on public.appointment
  for each row
  when (new.status = 'completed'::public.appointment_status)
  execute function private.tg_appointment_touch_last_visit();


-- ─────────────────────────────────────────────────────────────────────────────
-- 8 · TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

create trigger tr_touch before update on public.room
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.schedule_slot
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.appointment
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.appointment_history
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.appointment_history_material
  for each row execute function private.tg_touch_updated_at();

-- Auditoria onde a pergunta "quem fez isso?" aparece de verdade:
--   appointment          → "eu confirmei essa consulta" / "não fui eu que marquei falta"
--   appointment_history  → prontuário; alteração retroativa de registro clínico
--                          NÃO pode ser silenciosa
--   schedule_slot        → "quem tirou meu horário fixo de segunda?"
-- Fora: room (cadastro estático) e appointment_history_material (o pai já
-- registra o contexto; auditar o filho só duplicaria a mesma linha N vezes).
create trigger tr_audit after insert or update or delete on public.appointment
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.appointment_history
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.schedule_slot
  for each row execute function private.tg_audit();


-- ─────────────────────────────────────────────────────────────────────────────
-- 9 · PRIVILÉGIOS DE COLUNA
--
-- RLS decide QUAIS LINHAS; GRANT decide QUAIS COLUNAS. `clinic_id` fica fora de
-- todo UPDATE: mudar o tenant de uma linha é mover um atendimento de clínica, e
-- isso não é edição — é migração, e roda com service_role.
--
-- O INSERT também é por coluna (mesmo padrão de 03-pacientes.sql): sem isso o
-- cliente escreve `id`, `created_at` e `updated_at` à mão — ou seja, escolhe a
-- data em que o prontuário "foi criado". Em registro clínico isso é falsificação
-- de documento, e o audit_log guardaria a mentira sem saber.
--
-- (Ordem obrigatória: REVOKE de tabela primeiro; privilégio de coluna só existe
-- quando o de tabela não existe.)
-- ─────────────────────────────────────────────────────────────────────────────

revoke all on public.room                         from anon;
revoke all on public.schedule_slot                from anon;
revoke all on public.appointment                  from anon;
revoke all on public.appointment_history          from anon;
revoke all on public.appointment_history_material from anon;

revoke insert, update, delete on public.room from authenticated;
grant insert (clinic_id, name, photo_url) on public.room to authenticated;
grant update (name, photo_url) on public.room to authenticated;
grant delete on public.room to authenticated;

revoke insert, update, delete on public.schedule_slot from authenticated;
grant insert (
  clinic_id, patient_id, professional_id, room_id, activity, weekday,
  start_time, end_time, color, status, notes, send_confirmation
) on public.schedule_slot to authenticated;
grant update (
  patient_id, professional_id, room_id, activity, weekday,
  start_time, end_time, color, status, notes, send_confirmation
) on public.schedule_slot to authenticated;
grant delete on public.schedule_slot to authenticated;

revoke insert, update, delete on public.appointment from authenticated;
grant insert (
  clinic_id, schedule_slot_id, patient_id, professional_id, room_id,
  service, date, start_time, duration_minutes, status
) on public.appointment to authenticated;
grant update (
  schedule_slot_id, patient_id, professional_id, room_id,
  service, date, start_time, duration_minutes, status
) on public.appointment to authenticated;
grant delete on public.appointment to authenticated;
-- starts_at/ends_at ficam de fora por serem colunas GERADAS (o banco recusaria
-- a escrita de qualquer jeito; deixá-las fora do grant transforma um erro
-- obscuro de runtime em "permission denied", que se lê).

revoke insert, update, delete on public.appointment_history from authenticated;
grant insert (
  clinic_id, patient_id, professional_id, appointment_id, date, start_time,
  service, duration_minutes, procedures, notes
) on public.appointment_history to authenticated;
grant update (
  patient_id, professional_id, appointment_id, date, start_time,
  service, duration_minutes, procedures, notes
) on public.appointment_history to authenticated;
grant delete on public.appointment_history to authenticated;

revoke insert, update, delete on public.appointment_history_material from authenticated;
grant insert (
  clinic_id, appointment_history_id, material_id, name, quantity, position
) on public.appointment_history_material to authenticated;
grant update (material_id, name, quantity, position)
  on public.appointment_history_material to authenticated;
grant delete on public.appointment_history_material to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 10 · RLS
--
-- Forma obrigatória da policy: clinic_id = any(private.auth_clinic_ids()).
-- Além do tenant, cada tabela exige a FEATURE correspondente — senão um cargo
-- sem acesso à Agenda leria a agenda inteira direto pela API REST, que é o
-- mesmo dado da tela que o menu escondeu dele.
--
-- As chaves são VARIADIC porque a mesma tabela alimenta telas diferentes:
--   appointment      → Agenda e o card "Consultas de hoje" do Dashboard
--   schedule_slot    → Agenda, Dashboard e a aba Agenda do perfil do profissional
--   *_history        → prontuário do paciente ⇒ só 'patients'. Recepção que só
--                      tem 'schedule' NÃO lê evolução clínica.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.room                         enable row level security;
alter table public.schedule_slot                enable row level security;
alter table public.appointment                  enable row level security;
alter table public.appointment_history          enable row level security;
alter table public.appointment_history_material enable row level security;

-- ── room ─────────────────────────────────────────────────────────────────────
-- Leitura sem exigir feature: o nome da sala aparece em todo card da agenda e
-- não é dado sensível. Escrita é do Administrativo.
create policy room_select on public.room
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids()));

create policy room_insert on public.room
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

create policy room_update on public.room
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy room_delete on public.room
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

-- ── schedule_slot ────────────────────────────────────────────────────────────
create policy schedule_slot_select on public.schedule_slot
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'schedule', 'dashboard', 'professionals')
  );

create policy schedule_slot_insert on public.schedule_slot
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'schedule')
  );

create policy schedule_slot_update on public.schedule_slot
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'schedule')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy schedule_slot_delete on public.schedule_slot
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'schedule')
  );

-- ── appointment ──────────────────────────────────────────────────────────────
create policy appointment_select on public.appointment
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'schedule', 'dashboard')
  );

create policy appointment_insert on public.appointment
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'schedule')
  );

create policy appointment_update on public.appointment
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'schedule')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

-- DELETE existe (erro de digitação da recepção acontece), mas a operação
-- normal de desmarcar é status='canceled': a consulta apagada leva junto a
-- resposta de "por que esse horário vagou?".
create policy appointment_delete on public.appointment
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'schedule')
  );

-- ── appointment_history ──────────────────────────────────────────────────────
create policy appointment_history_select on public.appointment_history
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy appointment_history_insert on public.appointment_history
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy appointment_history_update on public.appointment_history
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy appointment_history_delete on public.appointment_history
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

-- ── appointment_history_material ─────────────────────────────────────────────
create policy appointment_history_material_select on public.appointment_history_material
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy appointment_history_material_insert on public.appointment_history_material
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy appointment_history_material_update on public.appointment_history_material
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy appointment_history_material_delete on public.appointment_history_material
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );


-- ═════════════════════════════════════════════════════════════════════════════
-- 11 · RPCs DE CONFLITO — o que substituiu a trava do profissional
--
-- A TRAVA VIROU AVISO. As duas constraints EXCLUDE por profissional saíram
-- (seções 3 e 4) porque overbooking é operação legítima: um profissional
-- alternando entre duas cadeiras é agenda sobreposta DE PROPÓSITO. O banco não
-- tem como distinguir isso de um choque acidental — são a mesma linha.
--
-- O que se perde ao remover é REAL e está dito aqui em voz alta: a constraint
-- também era a única coisa que via a CORRIDA entre duas recepcionistas salvando
-- no mesmo instante. Estas funções NÃO recuperam isso — elas leem o estado
-- committed no momento da chamada, e entre a leitura e o INSERT cabe outro
-- INSERT. Aviso não é trava. A troca foi consciente: barrar a corrida custava
-- barrar o encaixe, e o encaixe é o trabalho da clínica.
--
-- O contrato com a UI é: chame antes de salvar; se voltar linha, pergunte
-- "este profissional já tem atendimento neste horário — confirmar mesmo
-- assim?"; se o usuário confirmar, salve. Nada aqui bloqueia.
--
-- SECURITY INVOKER (o padrão, dito em voz alta porque importa): as policies da
-- seção 10 valem dentro delas. Um aviso de conflito com SECURITY DEFINER
-- vazaria a agenda de outra clínica por um p_professional chutado — quem não
-- enxerga a linha na tabela não pode enxergá-la no aviso. Consequência aceita:
-- quem não passa na policy recebe lista vazia, o que é correto (não pode
-- agendar mesmo). O recorte NÃO é o mesmo nas duas: appointment_select exige
-- 'schedule' ou 'dashboard'; schedule_slot_select aceita também
-- 'professionals'. Ou seja, um cargo que só vê Profissionais recebe aviso na
-- grade semanal e lista vazia na consulta do dia — e está certo, porque ele
-- também não escreve em appointment.
-- ═════════════════════════════════════════════════════════════════════════════

-- 11.1 · Conflito na CONSULTA do dia (o que a tela realmente salva) ------------
--
-- p_starts/p_ends são `timestamp` SEM fuso, e não timestamptz como seria o
-- reflexo: appointment.starts_at/ends_at são hora de PAREDE (ver o comentário na
-- seção 4). Receber timestamptz obrigaria a converter na comparação, e a janela
-- de conflito andaria conforme o fuso da conexão — o aviso mentiria por uma ou
-- três horas, que é exatamente a duração de uma consulta.
create or replace function public.professional_conflicts(
  p_professional uuid,
  p_starts       timestamp,
  p_ends         timestamp,
  p_ignore       uuid default null
)
returns table (
  id               uuid,
  patient_id       uuid,
  patient_name     text,
  service          text,
  "date"           date,
  start_time       time,
  duration_minutes integer,
  starts_at        timestamp,
  ends_at          timestamp,
  status           public.appointment_status,
  room_id          uuid,
  room_name        text
)
language sql
stable
set search_path = ''
as $$
  select a.id, a.patient_id, pa.name, a.service, a."date", a.start_time,
         a.duration_minutes, a.starts_at, a.ends_at, a.status, a.room_id, r.name
    from public.appointment a
    -- LEFT JOIN nos dois, e não INNER: a recepção pode ter 'schedule' sem ter
    -- 'patients', e a policy de patient exige a feature. Com INNER JOIN a linha
    -- do paciente invisível SUMIRIA e o aviso diria "sem conflito" — falso
    -- negativo silencioso, o pior defeito possível numa função de aviso. Assim o
    -- conflito aparece com patient_name NULL e a UI mostra "horário ocupado".
    left join public.patient pa
           on pa.id = a.patient_id and pa.clinic_id = a.clinic_id
    left join public.room r
           on r.id = a.room_id and r.clinic_id = a.clinic_id
   where a.professional_id = p_professional
     -- Mesmo recorte da trava que existia: cancelada e falta liberaram o horário.
     and a.status <> 'canceled'
     and a.status <> 'no_show'
     -- A própria consulta sendo editada não conflita consigo mesma.
     and (p_ignore is null or a.id <> p_ignore)
     -- Poda por `date` para cair no índice appointment_professional_day_idx —
     -- sem ela a busca varre a tabela que mais cresce do schema. O `- 1` não é
     -- paranoia: duration_minutes vai até 1440, então um atendimento que começou
     -- ONTEM pode terminar dentro da janela de hoje.
     and a."date" between (p_starts::date - 1) and p_ends::date
     -- Sobreposição de intervalos semiabertos: encostar não é conflito
     -- (09:00–10:00 e 10:00–11:00 convivem). Mesma semântica do && de tsrange,
     -- escrita como duas comparações porque assim o planner usa o btree.
     and a.starts_at < p_ends
     and a.ends_at   > p_starts
   order by a.starts_at;
$$;

comment on function public.professional_conflicts(uuid, timestamp, timestamp, uuid) is
  'AVISO (não trava) de agenda dupla: devolve os atendimentos vivos do '
  'profissional que se sobrepõem à janela informada, para a UI perguntar '
  '"confirmar mesmo assim?". Substitui a constraint '
  'appointment_professional_overlap_ex, removida para liberar overbooking. NÃO '
  'protege contra corrida: lê o committed e não segura nada até o INSERT. '
  'p_ignore serve para editar uma consulta sem ela conflitar consigo mesma.';

revoke execute on function public.professional_conflicts(uuid, timestamp, timestamp, uuid) from public;
grant execute on function public.professional_conflicts(uuid, timestamp, timestamp, uuid) to authenticated;


-- 11.2 · Conflito na REGRA semanal (o modal da grade) --------------------------
--
-- Existe porque foram DUAS constraints removidas, não uma: quem edita a grade
-- semanal não passa por appointment nenhum e ficaria sem aviso algum.
-- Compara `time` direto — dentro do mesmo weekday o dia é o mesmo, e o eixo
-- artificial de 2000-01-01 que a trava usava só existia para formar um tsrange.
create or replace function public.professional_slot_conflicts(
  p_professional uuid,
  p_weekday      smallint,
  p_start        time,
  p_end          time,
  p_ignore       uuid default null
)
returns table (
  id           uuid,
  patient_id   uuid,
  patient_name text,
  activity     text,
  weekday      smallint,
  start_time   time,
  end_time     time,
  room_id      uuid,
  room_name    text
)
language sql
stable
set search_path = ''
as $$
  select s.id, s.patient_id, pa.name, s.activity, s.weekday, s.start_time,
         s.end_time, s.room_id, r.name
    from public.schedule_slot s
    left join public.patient pa
           on pa.id = s.patient_id and pa.clinic_id = s.clinic_id
    left join public.room r
           on r.id = s.room_id and r.clinic_id = s.clinic_id
   where s.professional_id = p_professional
     and s.weekday = p_weekday
     -- Cancelada não ocupa — mesmo recorte da trava que saiu.
     and s.status = 'active'
     and (p_ignore is null or s.id <> p_ignore)
     and s.start_time < p_end
     and s.end_time   > p_start
   order by s.start_time;
$$;

comment on function public.professional_slot_conflicts(uuid, smallint, time, time, uuid) is
  'AVISO (não trava) de choque na grade semanal: horários ativos do profissional '
  'naquele weekday que se sobrepõem ao intervalo. Contraparte de '
  'professional_conflicts para schedule_slot, no lugar da constraint '
  'schedule_slot_professional_overlap_ex removida. weekday na base do '
  'Date.getDay() (0 = Dom), igual à coluna.';

revoke execute on function public.professional_slot_conflicts(uuid, smallint, time, time, uuid) from public;
grant execute on function public.professional_slot_conflicts(uuid, smallint, time, time, uuid) to authenticated;


-- ═════════════════════════════════════════════════════════════════════════════
-- FIM DA FATIA AGENDA
--
-- PENDÊNCIAS ASSUMIDAS (decisão do dono, não do banco):
--
-- 1. DECIDIDA. SOBREPOSIÇÃO: overbooking do PROFISSIONAL está liberado, sala
--    continua travada. Eram quatro constraints EXCLUDE; sobraram duas —
--    appointment_room_overlap_ex e schedule_slot_room_overlap_ex. Consultório de
--    duas cadeiras faz agenda sobreposta de propósito, e o banco não distingue
--    isso de erro; espaço físico continua não se dividindo.
--
--    O QUE FOI PERDIDO NA TROCA, para não redescobrirem depois:
--    · A trava era o único ponto que via a CORRIDA entre duas recepcionistas
--      salvando no mesmo instante. Não há substituto transacional — as RPCs de
--      aviso (seção 11) leem o committed e não seguram nada. Se algum dia a
--      clínica quiser "overbooking até N", isso volta como trigger contando
--      linhas em SERIALIZABLE (ou advisory lock por profissional+dia), não como
--      EXCLUDE.
--    · A idempotência da materialização passou a depender SÓ de
--      appointment_slot_date_uk — antes a trava a reforçava por acidente.
--
--    E O QUE ENTROU NO LUGAR: public.professional_conflicts() e
--    public.professional_slot_conflicts(), que devolvem os conflitos para a UI
--    perguntar "confirmar mesmo assim?" em vez de o banco recusar.
--
--    ATENÇÃO AO CADASTRO DE SALAS: com a trava de sala mantida, duas cadeiras
--    que atendem em paralelo precisam ser DUAS linhas em `room`. Cadastradas
--    como uma sala só, a trava de sala barra justamente o overbooking que esta
--    decisão liberou.
--
-- 2. RESOLVIDA NA CONSOLIDAÇÃO. TODA FK cruzada desta fatia é COMPOSTA com
--    clinic_id: patient (patient_id_clinic_uk), professional
--    (professional_id_clinic_uk) e, desde a consolidação, material
--    (material_id_clinic_uk, declarado em 02-cadastros.sql). Não há mais nenhuma
--    FK simples aqui — nenhum uuid de outro tenant passa pela checagem de FK,
--    que roda por dentro do servidor e NÃO vê RLS.
--
-- 3. VIGÊNCIA DA REGRA SEMANAL. schedule_slot não tem valid_from/valid_to porque
--    domain.ts não tem. Hoje encerrar uma recorrência é status='canceled', o que
--    perde a informação de "valeu de março a junho". Se a agenda precisar de
--    histórico de grade, são duas colunas `date`, um ajuste na trava de sala (o
--    intervalo de vigência entra como terceira dimensão) e o mesmo recorte em
--    professional_slot_conflicts(), senão o aviso passa a acusar horário que já
--    não vale mais.
--
-- 4. CATÁLOGO DE SERVIÇOS. schedule_slot.activity, appointment.service e
--    appointment_history.service são texto livre, e a cor viaja repetida em cada
--    linha da grade. É o desenho do mock. Um `service (clinic_id, name, color,
--    default_duration_minutes)` resolveria os três de uma vez — mas é tabela que
--    o domain.ts não tem, então não foi inventada aqui.
--
-- 5. DELETE DE PRONTUÁRIO. appointment_history e appointment_history_material têm
--    policy de DELETE para quem tem `patients` com can_edit. A fatia de Pacientes
--    tomou a decisão OPOSTA para `patient` (sem policy nem GRANT de DELETE: sai de
--    circulação com status='inactive'). Evolução clínica é documento com prazo de
--    guarda legal — se o dono quiser o mesmo tratamento, tire as duas policies de
--    DELETE e o `grant delete`, e acrescente uma coluna de anulação. Hoje o
--    apagamento existe e fica registrado no audit_log (old_data completo), o que é
--    rastreável, mas não é o mesmo que ser irreversível.
--
-- 6. HORÁRIO DE FUNCIONAMENTO. Nada impede agendar às 03:00 de domingo: não há
--    tabela de expediente da clínica nem de disponibilidade do profissional, e o
--    domain.ts não tem nenhuma das duas. As travas EXCLUDE que restaram só evitam
--    CHOQUE DE SALA, não horário absurdo — a validação de "fora do expediente"
--    está no front.
-- ═════════════════════════════════════════════════════════════════════════════
