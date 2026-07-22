-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — 06 · PRONTUÁRIO CLÍNICO
--            (tratamento, procedimento/sessão, odontograma, prescrições)
--
-- Depende de: 01-fundacao.sql  (clinic, private.auth_clinic_ids(),
--             private.can_access_feature/can_edit_feature, private.next_code(),
--             private.tg_set_code(), private.tg_audit(),
--             private.tg_touch_updated_at(), domínio money_brl)
-- Depende de OUTRAS FATIAS (só referencia, não cria):
--             public.patient        (03-pacientes.sql,     via patient_id_clinic_uk)
--             public.professional   (04-profissionais.sql, via professional_id_clinic_uk)
--             public.material       (02-cadastros.sql,     via material_id_clinic_uk)
--
-- ORDENAÇÃO RESOLVIDA NA CONSOLIDAÇÃO: `material` nascia em 07-comercial.sql,
-- que rodava DEPOIS deste arquivo, e a FK de treatment_session_material falhava.
-- Ela subiu para 02-cadastros.sql — é cadastro do Administrativo, não do
-- Comercial — junto com `insurance`, que tinha o mesmo problema com
-- 03-pacientes.sql. Os prefixos numéricos atuais SÃO a ordem de execução.
--
-- ── A DECISÃO ESTRUTURAL DESTE ARQUIVO ──────────────────────────────────────
--
-- O prontuário tem uma ESPINHA genérica e EXTENSÕES por especialidade.
--
--   ESPINHA (serve odontologia, fisioterapia, nutrição, psicologia…):
--       treatment                    → o guarda-chuva, atravessa vários dias
--       treatment_session            → o que foi feito NUM dia
--       treatment_session_action     → as etapas realizadas na sessão
--       treatment_session_material   → os insumos gastos na sessão
--
--   EXTENSÃO DE ODONTOLOGIA (as "tabelas irmãs"):
--       treatment_tooth              → dentes do tratamento (FDI)
--       treatment_session_tooth      → dentes trabalhados na sessão (FDI)
--       treatment_session_odontogram → o snapshot do motor de odontograma
--
-- Nenhuma coluna de dente entra na espinha. É isso que permite a fisioterapia
-- pendurar depois `treatment_session_rom` (amplitude de movimento) ou a
-- nutrição `treatment_session_anthropometry` SEM tocar em treatment/
-- treatment_session — e sem que a clínica de psicologia carregue uma coluna
-- `tooth_fdi` eternamente nula. As tabelas irmãs se protegem sozinhas com
-- private.tg_require_clinic_specialty('dentistry'): a próxima fatia de
-- especialidade só troca o argumento.
--
-- Prescrições (receituário, atestado, evolução clínica, documento) são
-- genéricas por natureza — todo ramo emite — e ficam na espinha.
--
-- ── NOTAÇÃO FDI ─────────────────────────────────────────────────────────────
-- Dois dígitos: quadrante + posição. Permanentes 11–18, 21–28, 31–38, 41–48;
-- decíduos 51–55, 61–65, 71–75, 81–85. Guardado como TEXTO e não inteiro: '11'
-- não é onze, é "quadrante 1, incisivo central" — aritmética sobre isso não
-- significa nada, e o zero à esquerda de uma futura notação não pode se perder.
--
-- ── MAPA domain.ts → BANCO ──────────────────────────────────────────────────
--   Treatment.tooth (string "16, 21, 25")  → treatment_tooth (N linhas)
--   Treatment.sessions[]                   → treatment_session
--   TreatmentSession.date                  → treatment_session.performed_on
--   TreatmentSession.actions[]             → treatment_session_action
--   TreatmentSession.materials[]           → treatment_session_material
--   TreatmentSession.odontogram            → treatment_session_odontogram.payload
--   Prescription.date                      → prescription.issued_on
--   Prescription.medications[]             → prescription_medication
-- (`date` não vira coluna `date` de propósito: coluna com nome de tipo é a
--  primeira coisa que confunde quem lê um EXPLAIN às duas da manhã.)
-- ═════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · DOMÍNIO — o dente
-- ─────────────────────────────────────────────────────────────────────────────

create domain public.tooth_fdi as text
  check (value ~ '^([1-4][1-8]|[5-8][1-5])$');

comment on domain public.tooth_fdi is
  'Dente na notação FDI (ISO 3950): permanentes 11–48, decíduos 51–85. O CHECK '
  'existe porque "37" e "73" são dentes diferentes e um typo aqui vira um '
  'procedimento registrado na boca errada. Se a fatia de Orçamentos (QuoteItem.'
  'teeth) subir ANTES desta, mova este domínio para a fundação — ele é o mesmo.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · ENUMS DA FATIA
--
-- Valores idênticos aos literais do domain.ts. Nada traduzido, nada inventado.
-- ─────────────────────────────────────────────────────────────────────────────

create type public.tooth_status as enum ('open', 'finished', 'extracted');

comment on type public.tooth_status is
  'domain.ts ToothStatus — na prática é o STATUS DO TRATAMENTO (é ele que colore '
  'o dente no odontograma, estável entre as sessões). O nome vem do domínio e '
  'foi preservado para o front achar o tipo. `extracted` só faz sentido em '
  'odontologia; os outros ramos usam open/finished — por isso o enum não ganhou '
  'valores por especialidade: a espinha fica comum e cada ramo usa o subconjunto '
  'que significa alguma coisa para ele.';

create type public.prescription_type as enum (
  'prescription', 'clinical_record', 'certificate', 'document'
);

comment on type public.prescription_type is
  'domain.ts PrescriptionType. prescription = receituário (o único que tem '
  'medicamentos); clinical_record = evolução clínica; certificate = atestado; '
  'document = orientação/termo livre.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · TRIGGERS GENÉRICAS DESTA FATIA
--
-- Todas em `private`, todas reaproveitáveis pelas próximas fatias de
-- especialidade. Corpo plpgsql (não é validado contra as tabelas na criação),
-- por isso podem nascer antes delas.
-- ─────────────────────────────────────────────────────────────────────────────

-- 3.1 · Coerência de tenant nas FKs que atravessam fatias -----------------------
create or replace function private.tg_check_ref_clinic()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ref    uuid;
  v_ok     boolean;
begin
  if tg_nargs <> 2 then
    raise exception 'tg_check_ref_clinic espera 2 argumentos: (tabela_referenciada, coluna_fk)';
  end if;

  v_ref := (to_jsonb(new) ->> tg_argv[1])::uuid;
  if v_ref is null then
    return new;   -- FK opcional não preenchida: nada a conferir
  end if;

  execute format(
    'select exists (select 1 from public.%I t where t.id = $1 and t.clinic_id = $2)',
    tg_argv[0]
  )
  into v_ok
  using v_ref, (to_jsonb(new) ->> 'clinic_id')::uuid;

  if not v_ok then
    raise exception '%.%: o registro apontado em "%" não pertence a esta clínica.',
      tg_table_schema, tg_table_name, tg_argv[1]
      using errcode = '23503';
  end if;

  return new;
end;
$$;

comment on function private.tg_check_ref_clinic() is
  'BEFORE INSERT OR UPDATE: garante que a FK aponta para um registro DA MESMA '
  'clínica. Uso: execute function private.tg_check_ref_clinic(''material'', ''material_id''). '
  'É o PLANO B, não o padrão: onde a outra fatia expõe `unique (id, clinic_id)` '
  'a FK COMPOSTA é melhor em tudo (declarativa, verificada sob lock da linha '
  'pai, sem custo de plpgsql por linha) e é o que esta fatia usa. NENHUMA tabela '
  'daqui a chama mais: `material` passou a declarar o unique composto em '
  '02-cadastros.sql e a última trigger que dependia dela foi removida na '
  'consolidação. A função fica como infraestrutura para a próxima fatia que '
  'referencie uma tabela sem o unique composto — e, nesse caso, o certo é '
  'primeiro tentar fazê-la declarar.';

revoke execute on function private.tg_check_ref_clinic() from public;


-- 3.2 · Tabela irmã de especialidade só existe na especialidade certa ----------
create or replace function private.tg_require_clinic_specialty()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_spec public.clinic_specialty;
begin
  if tg_nargs <> 1 then
    raise exception 'tg_require_clinic_specialty espera 1 argumento (a especialidade exigida)';
  end if;

  select c.specialty into v_spec
    from public.clinic c
   where c.id = (to_jsonb(new) ->> 'clinic_id')::uuid;

  if v_spec is distinct from tg_argv[0]::public.clinic_specialty then
    raise exception '%.% é exclusiva de clínicas com especialidade "%" (esta clínica é "%").',
      tg_table_schema, tg_table_name, tg_argv[0], coalesce(v_spec::text, 'desconhecida')
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function private.tg_require_clinic_specialty() is
  'BEFORE INSERT nas tabelas irmãs de especialidade. É o contrato do modelo: '
  'odontograma só nasce em clínica de odontologia, e a futura tabela de '
  'antropometria só em clínica de nutrição — trocando o argumento. Só em INSERT '
  'de propósito: se uma clínica mudar de ramo, o histórico antigo continua '
  'legível e editável (corrigir um dado passado é obrigação legal); o que fica '
  'barrado é criar registro novo do ramo errado.';

revoke execute on function private.tg_require_clinic_specialty() from public;


-- 3.3 · Dentes da sessão sobem para o tratamento ------------------------------
create or replace function private.tg_merge_treatment_tooth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Espelha a regra que hoje vive no service (treatmentsService.addTreatmentSession):
  -- "mescla os dentes trabalhados neste procedimento aos do tratamento".
  -- No banco porque agregado mantido pela aplicação é agregado que diverge no
  -- primeiro request que falha na metade.
  insert into public.treatment_tooth (clinic_id, treatment_id, tooth_fdi)
  select s.clinic_id, s.treatment_id, new.tooth_fdi
    from public.treatment_session s
   where s.id = new.session_id
  on conflict (treatment_id, tooth_fdi) do nothing;

  return new;
end;
$$;

comment on function private.tg_merge_treatment_tooth() is
  'AFTER INSERT em treatment_session_tooth: acrescenta o dente à lista do '
  'tratamento. SECURITY DEFINER para não depender da policy de INSERT de '
  'treatment_tooth (quem pode registrar o procedimento já provou que pode). '
  'CUMULATIVO de propósito: apagar uma sessão NÃO tira o dente do tratamento — '
  'o dente entrou no plano quando foi trabalhado, e o odontograma continua '
  'colorindo por ele.';

revoke execute on function private.tg_merge_treatment_tooth() from public;


-- 3.4 · completed_at anda junto com o status ----------------------------------
create or replace function private.tg_treatment_completion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'open' then
    new.completed_at := null;                                   -- reabriu: não há data de fim
  else
    new.completed_at := coalesce(new.completed_at, current_date); -- fechou: data obrigatória
  end if;
  return new;
end;
$$;

comment on function private.tg_treatment_completion() is
  'BEFORE INSERT OR UPDATE em treatment: normaliza completed_at a partir do '
  'status, para que o CHECK do par nunca dispare por esquecimento do client. '
  'coalesce e não atribuição direta: quem informa a data (o RPC informa a data '
  'do procedimento) manda mais que o relógio do servidor — fechar hoje um '
  'tratamento concluído na semana passada seria falsificar o prontuário.';

revoke execute on function private.tg_treatment_completion() from public;


-- ═════════════════════════════════════════════════════════════════════════════
-- 4 · ESPINHA — TRATAMENTO
-- ═════════════════════════════════════════════════════════════════════════════

create table public.treatment (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinic(id) on delete cascade,
  patient_id   uuid not null,
  procedure    text not null,
  status       public.tooth_status not null default 'open',
  started_at   date not null default current_date,
  completed_at date,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint treatment_procedure_not_blank_ck check (btrim(procedure) <> ''),
  -- Aberto sem data de fim, fechado com data de fim. O par é mantido honesto
  -- pela trigger tr_completion; este CHECK é o cinto além do suspensório
  -- (importação, service_role, psql na madrugada).
  constraint treatment_completion_ck check ((status = 'open') = (completed_at is null)),
  constraint treatment_completion_order_ck
    check (completed_at is null or completed_at >= started_at),
  -- Alvo das FKs compostas das tabelas filhas: é o que impede pendurar uma
  -- sessão de uma clínica em um tratamento de outra.
  constraint treatment_id_clinic_uk unique (id, clinic_id),
  -- Paciente da MESMA clínica, declarativamente (patient_id_clinic_uk existe na
  -- fatia Pacientes e a fatia Agenda já a usa assim). ON DELETE NO ACTION e não
  -- RESTRICT: os dois barram apagar um paciente com prontuário, mas RESTRICT
  -- confere na hora e NO ACTION no fim do statement — ao apagar a clínica
  -- inteira (service_role), o CASCADE remove patient e treatment na MESMA
  -- instrução, em ordem indefinida, e RESTRICT estouraria conforme a sorte do
  -- plano de execução.
  constraint treatment_patient_fk
    foreign key (patient_id, clinic_id) references public.patient(id, clinic_id)
    on delete no action
);

comment on table public.treatment is
  'O GUARDA-CHUVA do prontuário (domain.ts Treatment): um plano que atravessa '
  'vários dias, cada dia uma treatment_session (modelo Open Dental / evolução '
  'clínica). Não é específico de odontologia — os dentes moram nas tabelas irmãs.';
comment on column public.treatment.procedure is
  'Nome do tratamento ("Tratamento de canal", "Reabilitação oral"). Texto livre '
  'e não FK para um catálogo de procedimentos: o catálogo (tabela de preços, '
  'TUSS) é outra fatia e o prontuário não pode ficar refém dela para nascer.';
comment on column public.treatment.status is
  'Situação do tratamento — é ela que colore o dente no odontograma, estável '
  'entre as sessões (a sessão registra o que foi feito; o status diz onde parou).';
comment on column public.treatment.completed_at is
  'Data em que virou finished/extracted. NULL enquanto aberto — garantido pelo '
  'par CHECK + trigger.';
comment on column public.treatment.patient_id is
  'Dono do prontuário. Imutável na prática (o GRANT de coluna abaixo não permite '
  'UPDATE): mover um tratamento de paciente é apagar um fato e inventar outro.';

create index treatment_clinic_patient_idx
  on public.treatment (clinic_id, patient_id, started_at desc);
comment on index public.treatment_clinic_patient_idx is
  'Consulta quente: a aba Tratamentos do perfil do paciente, mais recente primeiro.';

create index treatment_clinic_status_idx
  on public.treatment (clinic_id, status, started_at desc);
comment on index public.treatment_clinic_status_idx is
  'Painel de tratamentos em aberto da clínica (o "o que falta terminar").';

create index treatment_patient_idx on public.treatment (patient_id);
comment on index public.treatment_patient_idx is
  'Índice da FK: sem ele, apagar/inativar um paciente varre a tabela inteira.';


-- ── Tabela irmã (ODONTOLOGIA): dentes do tratamento ──────────────────────────
create table public.treatment_tooth (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinic(id) on delete cascade,
  treatment_id uuid not null,
  tooth_fdi    public.tooth_fdi not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint treatment_tooth_uk unique (treatment_id, tooth_fdi),
  constraint treatment_tooth_treatment_fk
    foreign key (treatment_id, clinic_id)
    references public.treatment(id, clinic_id) on delete cascade
);

comment on table public.treatment_tooth is
  'Dentes envolvidos no tratamento — domain.ts Treatment.tooth, que no mock é a '
  'string "16, 21, 25". Vira LINHA e não string por três motivos: dá para '
  'perguntar "o que já foi feito no dente 36 desta paciente?", o odontograma '
  'monta a cor por dente sem parsear texto, e ninguém precisa acertar o split. '
  'Tabela IRMÃ de especialidade: só existe para odontologia.';
comment on column public.treatment_tooth.tooth_fdi is
  'Notação FDI. A lista é CUMULATIVA (mesclada dos procedimentos, ver '
  'private.tg_merge_treatment_tooth) — o front reconstrói a string juntando por ", ".';

create index treatment_tooth_clinic_tooth_idx
  on public.treatment_tooth (clinic_id, tooth_fdi);
comment on index public.treatment_tooth_clinic_tooth_idx is
  'Busca por dente dentro da clínica (relatório de procedimentos por elemento).';


-- ═════════════════════════════════════════════════════════════════════════════
-- 5 · ESPINHA — SESSÃO (o procedimento de UM dia)
-- ═════════════════════════════════════════════════════════════════════════════

create table public.treatment_session (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinic(id) on delete cascade,
  treatment_id    uuid not null,
  description     text,
  performed_on    date not null,
  professional_id uuid,
  amount          public.money_brl,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint treatment_session_amount_ck check (amount is null or amount >= 0),
  constraint treatment_session_description_not_blank_ck
    check (description is null or btrim(description) <> ''),
  constraint treatment_session_treatment_fk
    foreign key (treatment_id, clinic_id)
    references public.treatment(id, clinic_id) on delete cascade,
  -- ON DELETE NO ACTION: profissional não se apaga, se INATIVA (ActiveStatus).
  -- Procedimento sem autor é prontuário sem valor legal — quem assinou o ato
  -- tem de continuar identificável para sempre. Composta com clinic_id para que
  -- não se assine um procedimento com o CRO de outra clínica. MATCH SIMPLE (o
  -- padrão) é o que queremos: professional_id nulo dispensa a checagem inteira,
  -- que é a semântica de "procedimento sem autor identificado".
  constraint treatment_session_professional_fk
    foreign key (professional_id, clinic_id)
    references public.professional(id, clinic_id) on delete no action,
  -- Alvo das FKs compostas dos filhos da sessão.
  constraint treatment_session_id_clinic_uk unique (id, clinic_id)
);

comment on table public.treatment_session is
  'UM procedimento — o que foi feito num dia (domain.ts TreatmentSession). '
  'ON DELETE CASCADE do tratamento: sessão não existe fora do guarda-chuva.';
comment on column public.treatment_session.performed_on is
  'Data do procedimento (domain.ts TreatmentSession.date). `date` de verdade, '
  'não string dd/mm/aaaa: ordenação, intervalo e "quantos dias desde a última '
  'sessão" só existem com tipo de data.';
comment on column public.treatment_session.amount is
  'Valor cobrado POR PROCEDIMENTO — o tratamento soma os valores. Nulável '
  'porque procedimento de cortesia/retorno existe; >= 0 e não > 0 pelo mesmo '
  'motivo. O recebimento em si é da fatia Financeiro (payment/receivable): aqui '
  'fica a produção, lá fica o caixa.';
comment on column public.treatment_session.professional_id is
  'Quem executou. Nulável no domínio (importação, procedimento coletivo), mas '
  'nunca apagável: ver o ON DELETE.';

create index treatment_session_treatment_idx
  on public.treatment_session (treatment_id, performed_on, created_at);
comment on index public.treatment_session_treatment_idx is
  'A timeline do tratamento, em ordem cronológica. created_at desempata duas '
  'sessões no mesmo dia (acontece: manhã e tarde).';

create index treatment_session_clinic_date_idx
  on public.treatment_session (clinic_id, performed_on desc);
comment on index public.treatment_session_clinic_date_idx is
  'Produção do dia/período da clínica (relatório e comissão).';

create index treatment_session_professional_idx
  on public.treatment_session (professional_id, performed_on desc)
  where professional_id is not null;
comment on index public.treatment_session_professional_idx is
  'Produção por profissional — a base do cálculo de comissão por "realizado".';


-- ── Etapas realizadas na sessão ──────────────────────────────────────────────
create table public.treatment_session_action (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinic(id) on delete cascade,
  session_id  uuid not null,
  sort_order  integer not null default 0,
  description text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint treatment_session_action_not_blank_ck check (btrim(description) <> ''),
  constraint treatment_session_action_sort_ck check (sort_order >= 0),
  constraint treatment_session_action_session_fk
    foreign key (session_id, clinic_id)
    references public.treatment_session(id, clinic_id) on delete cascade
);

comment on table public.treatment_session_action is
  'Cada etapa/sinalização realizada na sessão — domain.ts TreatmentSession.'
  'actions[] ("Dente 36: Abertura coronária"). É TABELA e não text[] mesmo '
  'sendo array de escalar: no prontuário cada linha é um FATO com ordem '
  'estável, e fato precisa de id próprio para ser corrigido, auditado e '
  'contado sem reescrever o vetor inteiro (com o array, o audit_log registraria '
  'a lista toda a cada correção de vírgula).';
comment on column public.treatment_session_action.sort_order is
  'Ordem de exibição (é a ordem cronológica do atendimento). Não é UNIQUE de '
  'propósito: reordenar com unique exige constraint diferida ou dois passos.';

create index treatment_session_action_session_idx
  on public.treatment_session_action (session_id, sort_order);
create index treatment_session_action_clinic_idx
  on public.treatment_session_action (clinic_id);


-- ── Insumos gastos na sessão ─────────────────────────────────────────────────
create table public.treatment_session_material (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinic(id) on delete cascade,
  session_id  uuid not null,
  sort_order  integer not null default 0,
  -- Catálogo é opcional e some sem levar o registro junto: ver o ON DELETE e o
  -- comentário de `name`. A FK está no fim do CREATE TABLE, em forma COMPOSTA.
  material_id uuid,
  name        text not null,
  quantity    text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint treatment_session_material_name_not_blank_ck check (btrim(name) <> ''),
  constraint treatment_session_material_qty_not_blank_ck check (btrim(quantity) <> ''),
  constraint treatment_session_material_sort_ck check (sort_order >= 0),
  constraint treatment_session_material_session_fk
    foreign key (session_id, clinic_id)
    references public.treatment_session(id, clinic_id) on delete cascade,

  -- CORRIGIDO NA CONSOLIDAÇÃO. Era `references public.material(id)` (FK simples)
  -- + a trigger tr_material_clinic. 02-cadastros.sql declara
  -- `material_id_clinic_uk unique (id, clinic_id)`, então a garantia passa a ser
  -- DECLARATIVA: verificada sob lock da linha-pai, sem SQL dinâmico por linha, e
  -- protegida também contra um UPDATE futuro em material.clinic_id — coisas que
  -- a trigger BEFORE não fazia. A trigger foi removida (seção 7).
  --
  -- SET NULL COM LISTA DE COLUNAS (PostgreSQL 15+): sem a lista, o SET NULL de
  -- uma FK composta zeraria também `clinic_id`, que é NOT NULL.
  constraint treatment_session_material_material_fk
    foreign key (material_id, clinic_id)
    references public.material(id, clinic_id)
    on delete set null (material_id)
);

comment on table public.treatment_session_material is
  'Materiais usados no procedimento — domain.ts UsedMaterial[]. Array de OBJETO '
  'vira tabela filha (regra do projeto), nunca jsonb.';
comment on column public.treatment_session_material.name is
  'Nome CONGELADO no momento do uso. Redundante com material.name de propósito: '
  'o insumo pode ser renomeado ou sair do catálogo, e o prontuário de julho não '
  'pode mudar em outubro porque alguém corrigiu uma etiqueta de estoque.';
comment on column public.treatment_session_material.material_id is
  'Vínculo com o catálogo, quando existe (habilita baixa de estoque e custo). '
  'ON DELETE SET NULL: sumiu do catálogo, o registro clínico continua legível '
  'graças ao nome congelado.';
comment on column public.treatment_session_material.quantity is
  'Quantidade COM unidade, como o profissional digitou ("2 un", "5 ml", '
  '"1 tubete") — é o que domain.ts define. Texto e não numeric+unidade: a '
  'unidade real varia por insumo e a fatia de estoque ainda não decidiu a '
  'tabela de unidades. Quando decidir, entram duas colunas ao lado desta, sem '
  'perder o texto original.';

create index treatment_session_material_session_idx
  on public.treatment_session_material (session_id, sort_order);
create index treatment_session_material_material_idx
  on public.treatment_session_material (material_id) where material_id is not null;
create index treatment_session_material_clinic_idx
  on public.treatment_session_material (clinic_id);


-- ── Tabela irmã (ODONTOLOGIA): dentes trabalhados na sessão ──────────────────
create table public.treatment_session_tooth (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references public.clinic(id) on delete cascade,
  session_id uuid not null,
  tooth_fdi  public.tooth_fdi not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint treatment_session_tooth_uk unique (session_id, tooth_fdi),
  constraint treatment_session_tooth_session_fk
    foreign key (session_id, clinic_id)
    references public.treatment_session(id, clinic_id) on delete cascade
);

comment on table public.treatment_session_tooth is
  'Dentes efetivamente trabalhados NESTA sessão (domain.ts TreatmentSession.'
  'teeth). Separado de treatment_tooth porque as perguntas são diferentes: '
  '"quais dentes o plano cobre" (tratamento) e "no que se mexeu no dia 19" '
  '(sessão) — e é a segunda que responde a um questionamento de conselho.';

create index treatment_session_tooth_clinic_tooth_idx
  on public.treatment_session_tooth (clinic_id, tooth_fdi);


-- ── Tabela irmã (ODONTOLOGIA): o snapshot do odontograma ─────────────────────
create table public.treatment_session_odontogram (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references public.clinic(id) on delete cascade,
  -- UNIQUE e não PK: a PK é `id` como em toda tabela do projeto (o contrato da
  -- fundação), e é o UNIQUE que garante o 1–1 com a sessão.
  session_id uuid not null,
  -- Versão do motor, extraída do próprio payload: derivada, então coluna
  -- GERADA — dado derivado que se digita é dado que diverge.
  version    text generated always as (payload ->> 'version') stored,
  payload    jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint treatment_session_odontogram_session_uk unique (session_id),
  constraint treatment_session_odontogram_payload_ck
    check (jsonb_typeof(payload) = 'object'),
  constraint treatment_session_odontogram_session_fk
    foreign key (session_id, clinic_id)
    references public.treatment_session(id, clinic_id) on delete cascade
);

comment on table public.treatment_session_odontogram is
  'Snapshot do odontograma no fim do procedimento — reabre a ficha exatamente '
  'como ficou. 1–1 com a sessão (unique em session_id). Tabela SEPARADA e não coluna '
  'em treatment_session por dois motivos: mantém a espinha do prontuário livre '
  'de odontologia (fisioterapia penduraria a irmã dela aqui do lado) e tira o '
  'documento grande da linha lida em toda listagem de timeline.';
comment on column public.treatment_session_odontogram.payload is
  'JSONB — e aqui o jsonb é CERTO, não preguiça: é o export do motor de '
  'odontograma (React-Odontogram-Modul, formato {version, globals, teeth}), com '
  'dezenas de marcações por dente (cárie por face e severidade ICDAS, material '
  'de restauração por face, endodontia, prótese, implante…) que o VENDOR define '
  'e versiona. Normalizar isso seria reimplementar o motor no schema e quebrar '
  'a cada atualização dele. O que precisa ser consultável — dente e status — já '
  'está normalizado em treatment_session_tooth e treatment.status. Este campo é '
  'o pixel do "como estava naquele dia", não fonte de consulta.';
comment on column public.treatment_session_odontogram.version is
  'Versão do formato do motor (payload->>''version''), para uma futura migração '
  'de snapshot saber o que está lendo.';

create index treatment_session_odontogram_clinic_idx
  on public.treatment_session_odontogram (clinic_id);


-- ═════════════════════════════════════════════════════════════════════════════
-- 6 · PRESCRIÇÕES E DOCUMENTOS
-- ═════════════════════════════════════════════════════════════════════════════

create table public.prescription (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinic(id) on delete cascade,
  code            text not null,
  patient_id      uuid not null,
  type            public.prescription_type not null,
  title           text not null,
  issued_on       date not null default current_date,
  professional_id uuid,
  body            text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint prescription_code_uk unique (clinic_id, code),
  constraint prescription_title_not_blank_ck check (btrim(title) <> ''),
  -- Alvo da FK composta de prescription_medication. As TRÊS colunas juntas de
  -- propósito: `type` impede um medicamento pendurado num ATESTADO, e clinic_id
  -- impede um medicamento da clínica A pendurado num receituário da clínica B
  -- (a policy de INSERT só sabe conferir o clinic_id da PRÓPRIA linha — sem esta
  -- coluna na FK, bastava mandar um prescription_id alheio para escrever dentro
  -- do documento de outro tenant e, de quebra, descobrir quais ids existem lá).
  constraint prescription_id_type_clinic_uk unique (id, type, clinic_id),
  -- Paciente e signatário da MESMA clínica, declarativamente. NO ACTION nos
  -- dois: documento emitido não fica órfão de destinatário nem de quem assinou.
  constraint prescription_patient_fk
    foreign key (patient_id, clinic_id) references public.patient(id, clinic_id)
    on delete no action,
  constraint prescription_professional_fk
    foreign key (professional_id, clinic_id)
    references public.professional(id, clinic_id) on delete no action
);

comment on table public.prescription is
  'Receituário, atestado, evolução clínica e documentos do paciente (domain.ts '
  'Prescription). Genérico por natureza: todo ramo emite documento — por isso '
  'está na espinha e não nas tabelas irmãs.';
comment on column public.prescription.code is
  'Referência humana sequencial por clínica (REC-000001), preenchida pela '
  'trigger private.tg_set_code(''prescription'', ''REC'') — nunca por max()+1 na '
  'aplicação. É o número que vai impresso no documento entregue ao paciente.';
comment on column public.prescription.body is
  'Corpo do documento — domain.ts Prescription.text. Renomeado porque `text` é '
  'nome de tipo em Postgres e coluna com nome de tipo confunde leitura de '
  'função e de erro. Vazio no receituário, que se expressa em '
  'prescription_medication.';
comment on column public.prescription.issued_on is
  'Data de emissão (domain.ts Prescription.date). É a data que consta no '
  'documento impresso — por isso não é derivada de created_at.';
comment on column public.prescription.professional_id is
  'Quem assina. ON DELETE NO ACTION: documento assinado não pode ficar órfão de '
  'signatário (profissional se inativa, não se apaga).';

create index prescription_clinic_patient_idx
  on public.prescription (clinic_id, patient_id, issued_on desc);
comment on index public.prescription_clinic_patient_idx is
  'A aba Prescrições do perfil do paciente, mais recente primeiro.';

create index prescription_clinic_type_idx
  on public.prescription (clinic_id, type, issued_on desc);
create index prescription_patient_idx on public.prescription (patient_id);
create index prescription_professional_idx
  on public.prescription (professional_id) where professional_id is not null;


create table public.prescription_medication (
  id                uuid primary key default gen_random_uuid(),
  clinic_id         uuid not null references public.clinic(id) on delete cascade,
  prescription_id   uuid not null,
  -- Coluna "âncora": existe só para participar da FK composta abaixo. Fixa em
  -- 'prescription' pelo CHECK, o que faz a FK só encontrar par quando o
  -- documento É um receituário.
  prescription_type public.prescription_type not null default 'prescription',
  sort_order        integer not null default 0,
  name              text not null,
  dosage            text not null,
  quantity          text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint prescription_medication_name_not_blank_ck check (btrim(name) <> ''),
  constraint prescription_medication_dosage_not_blank_ck check (btrim(dosage) <> ''),
  constraint prescription_medication_qty_not_blank_ck
    check (quantity is null or btrim(quantity) <> ''),
  constraint prescription_medication_sort_ck check (sort_order >= 0),
  constraint prescription_medication_type_ck check (prescription_type = 'prescription'),
  constraint prescription_medication_prescription_fk
    foreign key (prescription_id, prescription_type, clinic_id)
    references public.prescription(id, type, clinic_id) on delete cascade
);

comment on table public.prescription_medication is
  'Medicamentos do receituário (domain.ts PrescribedMedication[]). Duas regras '
  'no BANCO e sem trigger, as duas pela mesma FK composta de TRÊS colunas: '
  '(1) "medicamentos SÓ em receituário" — a FK aponta para (prescription.id, '
  'prescription.type) e o CHECK trava esta ponta em ''prescription'', então um '
  'atestado não tem par para casar; (2) "medicamento e receituário são da MESMA '
  'clínica" — clinic_id entra na FK porque a policy de INSERT confere apenas o '
  'clinic_id desta linha, e uma FK que ignorasse o tenant deixaria escrever '
  'dentro do documento de outra clínica. De quebra, mudar o tipo de um '
  'receituário que já tem remédio passa a falhar (NO ACTION no UPDATE da FK), '
  'que é exatamente o desejado.';
comment on column public.prescription_medication.name is 'Ex.: "Amoxicilina 500 mg" — princípio/apresentação como escrito na receita.';
comment on column public.prescription_medication.dosage is 'Posologia: "1 cápsula a cada 8h por 7 dias". Obrigatória — receita sem posologia não se dispensa.';
comment on column public.prescription_medication.quantity is 'Quantidade a dispensar ("1 caixa"). Opcional no domínio.';

create index prescription_medication_prescription_idx
  on public.prescription_medication (prescription_id, sort_order);
create index prescription_medication_clinic_idx
  on public.prescription_medication (clinic_id);


-- ═════════════════════════════════════════════════════════════════════════════
-- 7 · TRIGGERS
-- ═════════════════════════════════════════════════════════════════════════════

-- 7.1 · updated_at ------------------------------------------------------------
create trigger tr_touch before update on public.treatment
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.treatment_tooth
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.treatment_session
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.treatment_session_action
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.treatment_session_material
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.treatment_session_tooth
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.treatment_session_odontogram
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.prescription
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.prescription_medication
  for each row execute function private.tg_touch_updated_at();

-- 7.2 · Código humano ---------------------------------------------------------
create trigger tr_code before insert on public.prescription
  for each row when (new.code is null)
  execute function private.tg_set_code('prescription', 'REC');

-- 7.3 · Coerência de status e de tenant ---------------------------------------
create trigger tr_completion before insert or update on public.treatment
  for each row execute function private.tg_treatment_completion();

-- NENHUMA trigger de coerência de tenant nesta fatia: TODA referência cruzada é
-- FK COMPOSTA (treatment_patient_fk, prescription_patient_fk,
-- treatment_session_professional_fk, prescription_professional_fk e — desde a
-- consolidação — treatment_session_material_material_fk). A antiga
-- `tr_material_clinic`, que chamava private.tg_check_ref_clinic('material',
-- 'material_id'), foi REMOVIDA: 02-cadastros.sql passou a declarar
-- `material_id_clinic_uk unique (id, clinic_id)` e a FK composta é estritamente
-- mais forte que a trigger (ver o comentário da função, seção 3.1).

-- 7.4 · Tabelas irmãs: só na especialidade certa ------------------------------
create trigger tr_specialty before insert on public.treatment_tooth
  for each row execute function private.tg_require_clinic_specialty('dentistry');
create trigger tr_specialty before insert on public.treatment_session_tooth
  for each row execute function private.tg_require_clinic_specialty('dentistry');
create trigger tr_specialty before insert on public.treatment_session_odontogram
  for each row execute function private.tg_require_clinic_specialty('dentistry');

-- 7.5 · Dentes da sessão sobem para o tratamento ------------------------------
create trigger tr_merge_treatment_tooth after insert on public.treatment_session_tooth
  for each row execute function private.tg_merge_treatment_tooth();

-- 7.6 · Auditoria -------------------------------------------------------------
-- Prontuário é o dado mais sensível do sistema e o único que um conselho pode
-- pedir para conferir anos depois: TUDO que descreve o ato clínico entra na
-- trilha.
create trigger tr_audit after insert or update or delete on public.treatment
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.treatment_session
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.treatment_session_action
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.treatment_session_material
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.prescription
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.prescription_medication
  for each row execute function private.tg_audit();

-- FORA da trilha, de propósito:
--   · treatment_tooth / treatment_session_tooth — derivadas do ato, que já é
--     auditado; auditá-las dobraria o volume para repetir "dente 36".
--   · treatment_session_odontogram — o payload é um documento grande; copiá-lo
--     inteiro em old_data e new_data a cada correção transformaria o audit_log
--     na maior tabela do banco. O QUE mudou clinicamente está nas actions e no
--     status, que são auditados.


-- ═════════════════════════════════════════════════════════════════════════════
-- 8 · PRIVILÉGIOS DE COLUNA
--
-- RLS decide QUAIS LINHAS; GRANT decide QUAIS COLUNAS. Aqui a coluna proibida é
-- sempre a mesma família: a que reescreveria a HISTÓRIA (a que clínica pertence,
-- de quem é o prontuário, qual é o número do documento).
-- (Ordem obrigatória: REVOKE de tabela antes — privilégio de coluna só existe
-- onde o de tabela não existe.)
-- ═════════════════════════════════════════════════════════════════════════════

-- Prontuário nunca é público. `anon` não tem nada aqui, nem SELECT.
revoke all on public.treatment                     from anon;
revoke all on public.treatment_tooth               from anon;
revoke all on public.treatment_session             from anon;
revoke all on public.treatment_session_action      from anon;
revoke all on public.treatment_session_material    from anon;
revoke all on public.treatment_session_tooth       from anon;
revoke all on public.treatment_session_odontogram  from anon;
revoke all on public.prescription                  from anon;
revoke all on public.prescription_medication       from anon;

-- ── INSERT por coluna ────────────────────────────────────────────────────────
-- Sem isto o `authenticated` herda INSERT de TABELA das default privileges do
-- Supabase e escolhe QUALQUER coluna. Em prontuário isso é grave por três
-- motivos, nesta ordem: (1) `prescription.code` — o número que vai impresso na
-- mão do paciente — passaria a ser escolhido pelo cliente, porque tg_set_code só
-- dispara `when (new.code is null)`; (2) `created_at`/`updated_at` de um ato
-- clínico seriam datáveis à vontade, e prontuário com carimbo forjável não
-- serve de prova; (3) `id` deixaria de ser sempre gen_random_uuid(). Mesma
-- forma da fatia Pacientes (grant insert por coluna em toda tabela).
revoke insert on public.treatment                     from anon, authenticated;
revoke insert on public.treatment_tooth               from anon, authenticated;
revoke insert on public.treatment_session             from anon, authenticated;
revoke insert on public.treatment_session_action      from anon, authenticated;
revoke insert on public.treatment_session_material    from anon, authenticated;
revoke insert on public.treatment_session_tooth       from anon, authenticated;
revoke insert on public.treatment_session_odontogram  from anon, authenticated;
revoke insert on public.prescription                  from anon, authenticated;
revoke insert on public.prescription_medication       from anon, authenticated;

grant insert (clinic_id, patient_id, procedure, status, started_at, completed_at, notes)
  on public.treatment to authenticated;
grant insert (clinic_id, treatment_id, tooth_fdi)
  on public.treatment_tooth to authenticated;
grant insert (clinic_id, treatment_id, description, performed_on, professional_id, amount, notes)
  on public.treatment_session to authenticated;
grant insert (clinic_id, session_id, sort_order, description)
  on public.treatment_session_action to authenticated;
grant insert (clinic_id, session_id, sort_order, material_id, name, quantity)
  on public.treatment_session_material to authenticated;
grant insert (clinic_id, session_id, tooth_fdi)
  on public.treatment_session_tooth to authenticated;
-- `version` fica fora porque é coluna GERADA (o Postgres nem aceitaria).
grant insert (clinic_id, session_id, payload)
  on public.treatment_session_odontogram to authenticated;
-- Fora: `code`. É a trigger tr_code → private.next_code() que numera; deixar o
-- cliente informá-lo permitiria pular números ou colidir de propósito.
grant insert (clinic_id, patient_id, type, title, issued_on, professional_id, body, notes)
  on public.prescription to authenticated;
-- Fora: `prescription_type`, que é a âncora da FK composta e vem do DEFAULT.
grant insert (clinic_id, prescription_id, sort_order, name, dosage, quantity)
  on public.prescription_medication to authenticated;

-- ── UPDATE por coluna ────────────────────────────────────────────────────────
revoke update on public.treatment from authenticated;
grant update (procedure, status, started_at, completed_at, notes)
  on public.treatment to authenticated;
-- Fora: clinic_id e patient_id. Corrigir "prontuário lançado no paciente
-- errado" é apagar e refazer — e assim a auditoria mostra os dois atos.

revoke update on public.treatment_session from authenticated;
grant update (description, performed_on, professional_id, amount, notes)
  on public.treatment_session to authenticated;
-- Fora: treatment_id (mover um dia de atendimento para outro plano é reescrever
-- o histórico) e clinic_id.

revoke update on public.treatment_session_action from authenticated;
grant update (sort_order, description) on public.treatment_session_action to authenticated;

revoke update on public.treatment_session_material from authenticated;
grant update (sort_order, material_id, name, quantity)
  on public.treatment_session_material to authenticated;

-- Dente não se edita: se errou o elemento, apaga a linha e insere a certa
-- (INSERT e DELETE ficam liberados pelas policies; UPDATE, não). Um UPDATE de
-- tooth_fdi apagaria em silêncio o fato de que se mexeu no dente errado.
revoke update on public.treatment_tooth         from authenticated;
revoke update on public.treatment_session_tooth from authenticated;

revoke update on public.treatment_session_odontogram from authenticated;
grant update (payload) on public.treatment_session_odontogram to authenticated;

revoke update on public.prescription from authenticated;
grant update (type, title, issued_on, professional_id, body, notes)
  on public.prescription to authenticated;
-- Fora: `code` (o número já saiu impresso na mão do paciente), clinic_id e
-- patient_id.

revoke update on public.prescription_medication from authenticated;
grant update (sort_order, name, dosage, quantity)
  on public.prescription_medication to authenticated;
-- Fora: prescription_id e prescription_type (a âncora da FK composta).


-- ═════════════════════════════════════════════════════════════════════════════
-- 8.1 · GUARDA DE APAGAMENTO — usada pela policy de DELETE de treatment
--
-- Fica AQUI e não junto das outras funções lá em cima por um motivo de
-- execução, não de estética: `language sql` TEM o corpo validado contra as
-- tabelas no CREATE (check_function_bodies), ao contrário de plpgsql. Nascer
-- antes de treatment_session faria a migration falhar.
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function private.treatment_has_session(p_treatment uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.treatment_session s
      join public.treatment t on t.id = s.treatment_id
     where s.treatment_id = p_treatment
       -- Escopo do tenant DENTRO da função: sem isto, o EXECUTE liberado viraria
       -- oráculo ("existe tratamento com este uuid em alguma clínica?").
       and t.clinic_id = any(private.auth_clinic_ids())
  );
$$;

comment on function private.treatment_has_session(uuid) is
  'Usada pela policy de DELETE de treatment. SECURITY DEFINER de propósito: se a '
  'policy fizesse o EXISTS direto em treatment_session, a subconsulta passaria '
  'pela RLS DAQUELA tabela — e um cargo com can_edit sem can_view (as duas flags '
  'são INDEPENDENTES em access_profile_permission) enxergaria ZERO sessões, o '
  'EXISTS daria falso e o DELETE do tratamento cascatearia sessões, etapas, '
  'materiais, dentes e odontograma em silêncio. Um portão de apagamento não pode '
  'depender de quem está olhando.';

revoke execute on function private.treatment_has_session(uuid) from public;
grant execute on function private.treatment_has_session(uuid) to authenticated;


-- ═════════════════════════════════════════════════════════════════════════════
-- 9 · RLS
--
-- Duas condições em TODA policy:
--   1. clinic_id = any(private.auth_clinic_ids())     → é do meu tenant
--   2. private.can_access/can_edit_feature(clinic_id, 'patients')
--                                                     → plano libera E cargo permite
-- O prontuário mora dentro da aba do paciente, então a chave é a mesma da tela
-- (AppPage 'patients'). Se um dia o prontuário virar permissão própria (a
-- recepcionista agenda mas não lê evolução clínica), cria-se a feature
-- 'clinical_record' no catálogo e troca-se a string aqui — a forma da policy
-- não muda.
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.treatment                    enable row level security;
alter table public.treatment_tooth              enable row level security;
alter table public.treatment_session            enable row level security;
alter table public.treatment_session_action     enable row level security;
alter table public.treatment_session_material   enable row level security;
alter table public.treatment_session_tooth      enable row level security;
alter table public.treatment_session_odontogram enable row level security;
alter table public.prescription                 enable row level security;
alter table public.prescription_medication      enable row level security;

-- ── treatment ────────────────────────────────────────────────────────────────
create policy treatment_select on public.treatment
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy treatment_insert on public.treatment
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy treatment_update on public.treatment
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy treatment_delete on public.treatment
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
    -- Só enquanto NADA foi registrado: apagar um tratamento aberto por engano é
    -- legítimo; apagar um que já tem procedimento é apagar prontuário, e isso
    -- não se faz pelo navegador — o histórico se corrige com nova sessão.
    -- Via função SECURITY DEFINER e não com EXISTS inline: o EXISTS inline seria
    -- filtrado pela RLS de treatment_session e um cargo com can_edit sem can_view
    -- veria zero sessões, transformando o portão em porta aberta (o CASCADE
    -- levaria sessões, etapas, materiais, dentes e odontograma junto).
    and not private.treatment_has_session(treatment.id)
  );

-- ── treatment_tooth ──────────────────────────────────────────────────────────
create policy treatment_tooth_select on public.treatment_tooth
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy treatment_tooth_insert on public.treatment_tooth
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy treatment_tooth_delete on public.treatment_tooth
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );
-- Sem UPDATE (nem policy, nem GRANT): dente errado se remove e se insere.

-- ── treatment_session ────────────────────────────────────────────────────────
create policy treatment_session_select on public.treatment_session
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy treatment_session_insert on public.treatment_session
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy treatment_session_update on public.treatment_session
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy treatment_session_delete on public.treatment_session
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );
-- DELETE existe (lançamento em duplicidade acontece) e é AUDITADO: o
-- audit_log guarda old_data inteiro, então o registro apagado continua
-- recuperável por quem tem acesso ao Administrativo.

-- ── treatment_session_action ─────────────────────────────────────────────────
create policy treatment_session_action_select on public.treatment_session_action
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy treatment_session_action_insert on public.treatment_session_action
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy treatment_session_action_update on public.treatment_session_action
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy treatment_session_action_delete on public.treatment_session_action
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

-- ── treatment_session_material ───────────────────────────────────────────────
create policy treatment_session_material_select on public.treatment_session_material
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy treatment_session_material_insert on public.treatment_session_material
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy treatment_session_material_update on public.treatment_session_material
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy treatment_session_material_delete on public.treatment_session_material
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

-- ── treatment_session_tooth ──────────────────────────────────────────────────
create policy treatment_session_tooth_select on public.treatment_session_tooth
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy treatment_session_tooth_insert on public.treatment_session_tooth
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy treatment_session_tooth_delete on public.treatment_session_tooth
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

-- ── treatment_session_odontogram ─────────────────────────────────────────────
create policy treatment_session_odontogram_select on public.treatment_session_odontogram
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy treatment_session_odontogram_insert on public.treatment_session_odontogram
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy treatment_session_odontogram_update on public.treatment_session_odontogram
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy treatment_session_odontogram_delete on public.treatment_session_odontogram
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

-- ── prescription ─────────────────────────────────────────────────────────────
create policy prescription_select on public.prescription
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy prescription_insert on public.prescription
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy prescription_update on public.prescription
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy prescription_delete on public.prescription
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

-- ── prescription_medication ──────────────────────────────────────────────────
create policy prescription_medication_select on public.prescription_medication
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy prescription_medication_insert on public.prescription_medication
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy prescription_medication_update on public.prescription_medication
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy prescription_medication_delete on public.prescription_medication
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );


-- ═════════════════════════════════════════════════════════════════════════════
-- 10 · RPCs
--
-- Ambas SECURITY INVOKER (o padrão, dito aqui em voz alta porque importa): as
-- policies acima valem dentro delas. Uma RPC de prontuário com SECURITY DEFINER
-- seria um túnel por baixo da RLS — o oposto do que este arquivo inteiro faz.
-- ═════════════════════════════════════════════════════════════════════════════

-- 10.1 · Leitura: a aba Tratamentos inteira em UMA ida --------------------------
create or replace function public.patient_treatments(p_patient uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(x.payload order by x.started_at desc, x.created_at desc), '[]'::jsonb)
    from (
      select
        t.started_at,
        t.created_at,
        jsonb_build_object(
          'id',           t.id,
          'clinic_id',    t.clinic_id,
          'patient_id',   t.patient_id,
          'procedure',    t.procedure,
          'status',       t.status,
          'started_at',   t.started_at,
          'completed_at', t.completed_at,
          'notes',        t.notes,
          'teeth', coalesce((
            select jsonb_agg(tt.tooth_fdi order by tt.tooth_fdi)
              from public.treatment_tooth tt
             where tt.treatment_id = t.id
          ), '[]'::jsonb),
          'sessions', coalesce((
            select jsonb_agg(
                     jsonb_build_object(
                       'id',              s.id,
                       'description',     s.description,
                       'performed_on',    s.performed_on,
                       'professional_id', s.professional_id,
                       'amount',          s.amount,
                       'notes',           s.notes,
                       'teeth', coalesce((
                         select jsonb_agg(st.tooth_fdi order by st.tooth_fdi)
                           from public.treatment_session_tooth st
                          where st.session_id = s.id
                       ), '[]'::jsonb),
                       'actions', coalesce((
                         select jsonb_agg(a.description order by a.sort_order, a.created_at)
                           from public.treatment_session_action a
                          where a.session_id = s.id
                       ), '[]'::jsonb),
                       'materials', coalesce((
                         select jsonb_agg(
                                  jsonb_build_object(
                                    'material_id', m.material_id,
                                    'name',        m.name,
                                    'quantity',    m.quantity
                                  ) order by m.sort_order, m.created_at
                                )
                           from public.treatment_session_material m
                          where m.session_id = s.id
                       ), '[]'::jsonb),
                       'odontogram', (
                         select o.payload
                           from public.treatment_session_odontogram o
                          where o.session_id = s.id
                       )
                     ) order by s.performed_on, s.created_at
                   )
              from public.treatment_session s
             where s.treatment_id = t.id
          ), '[]'::jsonb)
        ) as payload
      from public.treatment t
      where t.patient_id = p_patient
    ) x;
$$;

comment on function public.patient_treatments(uuid) is
  'Todos os tratamentos do paciente, com sessões, etapas, materiais, dentes e '
  'snapshot — no formato que a aba Tratamentos desenha (espelha '
  'treatmentsService.listPatientTreatments). Sem isto seriam 6 requests '
  'aninhados para montar UMA timeline. Chaves em snake_case: a conversão para '
  'camelCase é do service no front, como nas colunas.';

revoke execute on function public.patient_treatments(uuid) from public;
grant execute on function public.patient_treatments(uuid) to authenticated;


-- 10.2 · Escrita: registrar um procedimento é UM ato ---------------------------
create or replace function public.record_treatment_session(
  p_treatment     uuid,
  p_performed_on  date,
  p_status_after  public.tooth_status,
  p_description   text            default null,
  p_professional  uuid            default null,
  p_amount        public.money_brl default null,
  p_notes         text            default null,
  p_teeth         text[]          default '{}',
  p_actions       text[]          default '{}',
  p_materials     jsonb           default '[]'::jsonb,
  p_odontogram    jsonb           default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_clinic  uuid;
  v_session uuid;
begin
  -- RLS aplicada: tratamento de outra clínica simplesmente não aparece, e a
  -- mensagem é a mesma de "não existe" — não se confirma a existência de um
  -- prontuário alheio nem pelo texto do erro.
  select t.clinic_id into v_clinic
    from public.treatment t
   where t.id = p_treatment;

  if v_clinic is null then
    raise exception 'Tratamento não encontrado.' using errcode = '42501';
  end if;

  insert into public.treatment_session (
    clinic_id, treatment_id, description, performed_on, professional_id, amount, notes
  ) values (
    v_clinic, p_treatment,
    nullif(btrim(coalesce(p_description, '')), ''),
    p_performed_on, p_professional, p_amount,
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning id into v_session;

  -- Dentes (a trigger tr_merge_treatment_tooth sobe cada um para o tratamento).
  insert into public.treatment_session_tooth (clinic_id, session_id, tooth_fdi)
  select distinct v_clinic, v_session, btrim(d.tooth)
    from unnest(coalesce(p_teeth, '{}'::text[])) as d(tooth)
   where btrim(d.tooth) <> ''
  on conflict (session_id, tooth_fdi) do nothing;

  -- Etapas: WITH ORDINALITY preserva a ordem em que o profissional descreveu.
  insert into public.treatment_session_action (clinic_id, session_id, sort_order, description)
  select v_clinic, v_session, a.ord, btrim(a.txt)
    from unnest(coalesce(p_actions, '{}'::text[])) with ordinality as a(txt, ord)
   where btrim(coalesce(a.txt, '')) <> '';

  -- Materiais: [{ "material_id": uuid|null, "name": text, "quantity": text }]
  insert into public.treatment_session_material
    (clinic_id, session_id, sort_order, material_id, name, quantity)
  select v_clinic, v_session, m.ord,
         nullif(btrim(coalesce(m.item ->> 'material_id', '')), '')::uuid,
         btrim(m.item ->> 'name'),
         btrim(coalesce(m.item ->> 'quantity', ''))
    from jsonb_array_elements(coalesce(p_materials, '[]'::jsonb)) with ordinality as m(item, ord)
   where btrim(coalesce(m.item ->> 'name', '')) <> '';

  if p_odontogram is not null then
    insert into public.treatment_session_odontogram (session_id, clinic_id, payload)
    values (v_session, v_clinic, p_odontogram);
  end if;

  -- Situação do tratamento APÓS o procedimento (NewTreatmentSession.statusAfter).
  -- A data de fim é a DO PROCEDIMENTO, não a de hoje.
  update public.treatment
     set status       = p_status_after,
         completed_at = case when p_status_after = 'open' then null else p_performed_on end
   where id = p_treatment;

  return v_session;
end;
$$;

comment on function public.record_treatment_session(
  uuid, date, public.tooth_status, text, uuid, public.money_brl, text, text[], text[], jsonb, jsonb
) is
  'Registra UM procedimento inteiro em uma transação: sessão + dentes + etapas + '
  'materiais + snapshot do odontograma + novo status do tratamento. Espelha '
  'treatmentsService.addTreatmentSession. Existe porque um procedimento é '
  'ATÔMICO na vida real — meia sessão gravada (etapas sem odontograma, dentes '
  'sem status) é um prontuário mentiroso, e é exatamente o que 6 requests '
  'independentes produzem quando o Wi-Fi do consultório cai no meio. '
  'SECURITY INVOKER: cada INSERT aqui dentro passa pela mesma policy que '
  'passaria vindo do PostgREST.';

revoke execute on function public.record_treatment_session(
  uuid, date, public.tooth_status, text, uuid, public.money_brl, text, text[], text[], jsonb, jsonb
) from public;
grant execute on function public.record_treatment_session(
  uuid, date, public.tooth_status, text, uuid, public.money_brl, text, text[], text[], jsonb, jsonb
) to authenticated;


-- ═════════════════════════════════════════════════════════════════════════════
-- FIM DA FATIA — PRONTUÁRIO CLÍNICO
--
-- O QUE FICOU DE FORA, E ONDE MORA:
--   · Anamnese (domain.ts Anamnesis) — questionário de saúde, com HISTÓRICO por
--     paciente (UMA ficha `status='active'` mais as `archived` que a guarda legal
--     exigir — não é 1–1, ver o cabeçalho de 03-pacientes.sql) e cheia de enums
--     próprios: é fatia do PACIENTE, não do prontuário de evolução.
--   · AppointmentHistory — timeline de CONSULTAS (agenda), não de tratamento.
--     Mora na fatia Agenda, que JÁ tem a própria appointment_history_material —
--     as duas tabelas de insumo são deliberadamente separadas (uma pendura na
--     consulta, a outra no procedimento) e não devem ser fundidas sem antes
--     decidir de quem é a baixa de estoque.
--   · O valor do procedimento vira dinheiro na fatia Financeiro
--     (payment/receivable). Aqui fica a PRODUÇÃO; lá, o caixa.
--
-- COMO A PRÓXIMA ESPECIALIDADE ENTRA (o teste do modelo):
--   1. Não toca em treatment / treatment_session / *_action / *_material.
--   2. Cria as próprias tabelas irmãs, com FK composta (session_id, clinic_id)
--      → treatment_session(id, clinic_id) on delete cascade.
--   3. Pendura nelas: private.tg_require_clinic_specialty('physiotherapy'),
--      tg_touch_updated_at, as 4 policies com a mesma forma, e pronto.
-- ═════════════════════════════════════════════════════════════════════════════
