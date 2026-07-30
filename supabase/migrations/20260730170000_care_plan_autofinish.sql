-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — O TRATAMENTO FECHA SOZINHO QUANDO AS SESSÕES PREVISTAS ACABAM
--
-- Regra do produto, em uma frase: um tratamento ATIVO por paciente (já
-- garantido pelo índice parcial `care_plan_active_per_patient_uk`); sem número
-- de sessões, ele é CONTÍNUO e só termina na alta; COM número, termina sozinho
-- na sessão que fecha a conta — e o próximo caso exige abrir outro tratamento.
--
-- ── Por que TRIGGER e não código de tela ─────────────────────────────────────
-- "Compareceu" é marcado de três lugares diferentes (Dashboard, Hoje, modal da
-- Agenda), e nenhum deles sabe de fisioterapia. Fechar o tratamento no cliente
-- significaria repetir a regra três vezes e perdê-la na quarta tela. Aqui a
-- conta é feita onde o dado muda: qualquer caminho que marque a consulta como
-- `completed` fecha o plano.
--
-- ── O carimbo passa a valer para a SESSÃO, não só para o plano ativo ─────────
-- `tg_carimba_plano` amarra cada aferição, teste, avaliação, anamnese e
-- diagnóstico ao plano ATIVO do paciente. Com o fechamento automático isso
-- abriria um buraco de algumas horas: a consulta é marcada como "compareceu"
-- no início do atendimento, o plano fecha na hora, e TUDO que o fisioterapeuta
-- escrevesse dali em diante — na sessão que acabou de fechar o tratamento —
-- nasceria sem vínculo, fora do relatório de evolução e fora do recorte de
-- todas as telas.
--
-- `private.plano_da_sessao` fecha esse buraco: sem plano ativo, o registro de
-- hoje herda o plano DA CONSULTA DE HOJE. Não é adivinhação — é a mesma sessão
-- que o profissional tem aberta na tela. Paciente sem consulta hoje e sem plano
-- ativo continua gravando sem vínculo, como deve ser.
--
-- Depende de: as migrations do care_plan (private.plano_ativo,
--             private.care_plan_snapshot, private.tg_carimba_plano).
-- ═════════════════════════════════════════════════════════════════════════════

-- ── O plano ao qual o registro de hoje pertence ──────────────────────────────

create or replace function private.plano_da_sessao(p_patient uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $fn$
  select coalesce(
    private.plano_ativo(p_patient),
    -- Sem plano ativo: o do atendimento de HOJE, que pode ter acabado de ser
    -- encerrado pela própria sessão em curso.
    (select a.care_plan_id
       from public.appointment a
      where a.patient_id = p_patient
        and a.date = current_date
        and a.care_plan_id is not null
      order by a.start_time desc
      limit 1)
  );
$fn$;

comment on function private.plano_da_sessao(uuid) is
  'O tratamento ao qual um registro feito AGORA pertence: o plano ativo do '
  'paciente ou, na falta dele, o plano da consulta de hoje (caso do tratamento '
  'que fechou automaticamente durante a própria sessão). Usada pelo carimbo '
  'tg_carimba_plano.';

-- ── Carimbo: mesma regra de antes, com a janela da sessão ────────────────────

create or replace function private.tg_carimba_plano()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  if tg_table_name = 'patient_clinical_entry' then
    -- Compartilhados (da pessoa) nunca recebem vinculo: antecedente cirurgico,
    -- historico familiar, riscos e uso de medicamentos valem alem do episodio.
    if new.kind::text not in ('diagnosis','problems') then
      new.care_plan_id := null;
      return new;
    end if;
  end if;

  new.care_plan_id := private.plano_da_sessao(new.patient_id);
  return new;
end;
$fn$;

-- ── A consulta entra no tratamento sozinha ───────────────────────────────────
--
-- Até aqui, quem ligava a consulta ao plano era A TELA: o atendimento de
-- fisioterapia gravava `care_plan_id` ao abrir (linkAppointmentToPlan). Isso
-- deixava a contagem dependendo de um clique — sessão marcada como
-- "compareceu" na tela de Hoje, sem ninguém abrir o atendimento, não contava; e
-- as sessões agendadas ANTES de o tratamento ser criado (o caso normal: marca
-- as 10 sessões e depois abre o tratamento) nunca entravam.
--
-- Numa clínica de FISIOTERAPIA, consulta de paciente com tratamento em
-- andamento É sessão do tratamento — então o vínculo é do banco. Restrito à
-- especialidade de propósito: `care_plan` só existe na fisioterapia, e
-- carimbar a agenda de uma clínica de odontologia ou medicina inventaria uma
-- relação que aquele produto não tem.
create or replace function private.tg_appointment_liga_plano()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  -- Vínculo já existente NUNCA é reescrito: sessão realizada pertence ao
  -- tratamento em que aconteceu, mesmo depois que ele fecha e outro começa.
  if new.care_plan_id is not null then
    return new;
  end if;

  if not exists (
    select 1 from public.clinic c
     where c.id = new.clinic_id and c.specialty = 'physiotherapy'
  ) then
    return new;
  end if;

  new.care_plan_id := private.plano_ativo(new.patient_id);
  return new;
end;
$fn$;

drop trigger if exists tr_appointment_liga_plano on public.appointment;

-- BEFORE, e também no UPDATE: a consulta agendada antes do tratamento entra
-- nele quando for marcada como realizada (ou em qualquer outra edição).
create trigger tr_appointment_liga_plano
before insert or update on public.appointment
for each row execute function private.tg_appointment_liga_plano();

-- ── Fechamento automático ────────────────────────────────────────────────────

create or replace function private.tg_care_plan_autofinish()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_patient uuid;
  v_started date;
  v_planned smallint;
  v_done    integer;
begin
  -- Só interessa a consulta que JÁ pertence a um tratamento e que acabou de
  -- contar como realizada. Falta, cancelamento e reagendamento não fecham nada.
  if new.care_plan_id is null or new.status <> 'completed' then
    return null;
  end if;

  -- `for update` serializa duas sessões marcadas ao mesmo tempo: sem ele, as
  -- duas leriam a mesma contagem e as duas tentariam encerrar.
  select cp.patient_id, cp.started_on, cp.planned_sessions
    into v_patient, v_started, v_planned
    from public.care_plan cp
   where cp.id = new.care_plan_id
     and cp.status = 'active'
     for update;

  -- Plano já encerrado, ou CONTÍNUO (sem previsão): nada a fazer — tratamento
  -- sem número de sessões termina na alta, quando o profissional decidir.
  if not found or v_planned is null then
    return null;
  end if;

  select count(*)
    into v_done
    from public.appointment a
   where a.care_plan_id = new.care_plan_id
     and a.status = 'completed';

  if v_done < v_planned then
    return null;
  end if;

  update public.care_plan set
    status = 'finished',
    -- A alta é do dia da sessão que fechou a conta, não do dia em que alguém
    -- lembrou de marcar presença; `greatest` respeita a mesma regra do
    -- finish_care_plan (alta nunca antes do início).
    finished_on = greatest(new.date, v_started),
    discharge_notes = coalesce(
      discharge_notes,
      case when v_planned = 1
        then 'Encerrado automaticamente: a sessão prevista foi realizada.'
        else 'Encerrado automaticamente: as ' || v_planned || ' sessões previstas foram realizadas.'
      end
    ),
    -- MESMO retrato da alta manual, com o recorte do tratamento.
    discharge = private.care_plan_snapshot(v_patient, new.care_plan_id)
  where id = new.care_plan_id
    and status = 'active';

  return null;
end;
$fn$;

comment on function private.tg_care_plan_autofinish() is
  'Encerra o tratamento quando as consultas realizadas alcançam as sessões '
  'previstas (planned_sessions). Plano sem previsão é contínuo e só termina na '
  'alta manual (finish_care_plan).';

drop trigger if exists tr_care_plan_autofinish on public.appointment;

-- AFTER, e nas duas operações: a consulta pode nascer marcada como realizada
-- (lançamento retroativo) e pode ganhar o vínculo com o plano DEPOIS de já
-- estar realizada — as duas fecham a conta do mesmo jeito.
create trigger tr_care_plan_autofinish
after insert or update on public.appointment
for each row execute function private.tg_care_plan_autofinish();
