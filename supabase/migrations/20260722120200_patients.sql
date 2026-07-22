-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — 03 · PACIENTES E FICHA
--
-- Modela: domain.ts → Patient, PatientDocument, Anamnesis.
-- Depende de: 01-fundacao.sql (clinic, profile, private.auth_clinic_ids(),
--             private.can_access_feature(), private.tg_set_code(),
--             private.tg_audit(), private.tg_touch_updated_at(), domínios).
-- Depende de OUTRA fatia: public.insurance (07-comercial.sql), e SÓ no ALTER
--             isolado da seção 11 — o resto aplica sozinho (ver seção 11).
--
-- ── A DECISÃO CENTRAL DESTA FATIA: COMO GUARDAR A ANAMNESE ───────────────────
--
-- `Anamnesis` no domain.ts é uma interface achatada de ~30 campos. A tradução
-- literal seria uma tabela `anamnesis` com 30 colunas e 7 enums novos
-- (YesNo, YesNoUnknown, BloodPressure, BleedingLevel, HealingLevel, GumBleeding,
-- FlossUse). Consulta e constraint ficariam ótimas. NÃO é o que fizemos, por
-- três razões que valem mais que a ergonomia de um `where allergy = 'yes'`:
--
-- 1. O QUESTIONÁRIO NÃO É UM SÓ. `clinic.specialty` já tem cinco valores. O
--    questionário do CRO (o que está em questions.ts hoje) não serve para
--    nutrição — que pergunta recordatório alimentar, antropometria, hábito
--    intestinal — nem para psicologia. Colunas dedicadas dariam
--    `anamnesis_dentistry`, `anamnesis_nutrition`, `anamnesis_psychology`…
--    cinco tabelas largas e cinco telas, quando a tela é a MESMA: seções,
--    perguntas fechadas, campo de detalhe condicional.
--
-- 2. A PERGUNTA JÁ É DADO NO FRONT. `src/pages/Patients/Profile/Anamnesis/
--    questions.ts` é literalmente um catálogo declarativo (seção → pergunta →
--    opções → detalhe condicional) que gera a leitura, o formulário e a
--    impressão. Este arquivo move esse catálogo para o banco sem inventar nada:
--    as mesmas seções, os mesmos `field` (viram `code`), os mesmos `value` das
--    opções ('yes','no','unknown','during_brushing','controlled'…). Nenhum
--    literal do domínio foi traduzido ou criado.
--
-- 3. PERGUNTA NOVA NÃO PODE SER MIGRATION. Uma clínica que quer perguntar
--    "Como nos conheceu?" não pode depender de um deploy. Com colunas, cada
--    pergunta é um ALTER TABLE; aqui é um INSERT.
--
-- O QUE SE PERDE E COMO FOI DEVOLVIDO — o problema clássico do modelo
-- pergunta/resposta é virar EAV solto, com tudo em text e nenhuma garantia:
--
--   · Resposta fechada NÃO é texto livre: `anamnesis_answer.option_id` é FK
--     para a opção, com FK COMPOSTA (option_id, question_id) — o banco recusa
--     uma resposta que não pertença àquela pergunta. É garantia MAIOR que um
--     CHECK, porque a lista de opções é por questionário.
--   · Resposta não pode migrar de questionário: `template_id` viaja na resposta
--     e as FKs compostas (anamnesis_id, template_id) e (question_id, template_id)
--     impedem responder a pergunta de um formulário dentro da ficha de outro.
--   · Alerta clínico virou DADO (`anamnesis_question_option.is_alert`) em vez de
--     um `switch` no front (a função `isAlert()` de questions.ts). Hoje só a tela
--     de odontologia sabe que "alergia = sim" é tarja vermelha; com a flag na
--     opção, a próxima especialidade herda o comportamento sem código, e a
--     consulta "meus pacientes com alerta" existe.
--   · Consulta continua indexada: `anamnesis_answer_alert_idx` sobre
--     (clinic_id, question_id, option_id) responde "quais pacientes são
--     alérgicos" tão bem quanto uma coluna dedicada.
--   · Prontuário é documento legal: `question_text` e `answer_label` são
--     CONGELADOS na resposta por trigger — mesma solução de `audit_log.
--     actor_name` na fundação. Reescrever a pergunta amanhã não reescreve o que
--     o paciente respondeu ontem.
--
-- Custo assumido, de olhos abertos: ler a ficha é um join a mais e gravar são
-- N linhas em vez de uma. Por isso as RPCs no fim do arquivo
-- (`patient_anamnesis` e `save_anamnesis`) entregam/aceitam a ficha INTEIRA em
-- um jsonb — o front continua com a mesma assinatura de `anamnesisService.ts`.
--
-- ── A SEGUNDA DECISÃO: A FICHA TEM HISTÓRICO ─────────────────────────────────
--
-- O domain.ts diz "uma ficha por paciente", e a primeira versão deste arquivo
-- traduziu isso literalmente (`unique (patient_id)`). Para prontuário, está
-- errado: a ficha é revisada a cada retorno, o prontuário tem prazo legal de
-- guarda contado em ANOS, e sobrescrever a resposta de hoje sobre a de três anos
-- atrás apaga o que o paciente declarou NA ÉPOCA do procedimento — que é
-- exatamente o que se vai procurar quando algo der errado.
--
-- O que passou a valer, e por quê:
--
--   · `anamnesis.status` ('active' | 'archived') + o índice ÚNICO PARCIAL
--     `anamnesis_active_patient_uk (patient_id) where status = 'active'`: UMA
--     ficha ativa por paciente (a garantia que o serviço já esperava), e quantas
--     arquivadas o prontuário exigir. É índice e não constraint porque
--     `constraint ... unique` inline não aceita WHERE.
--
--   · SALVAR CONTINUA ATUALIZANDO A FICHA ATIVA. `save_anamnesis` não versiona a
--     cada chamada: o formulário envia a ficha inteira a cada clique em Salvar, e
--     versionar por digitação encheria o prontuário de cópias quase idênticas —
--     um histórico ilegível é o mesmo que não ter histórico.
--
--   · FECHAR A FICHA É ATO EXPLÍCITO: `archive_anamnesis(paciente)` marca a atual
--     como 'archived' e libera o slot; o `save_anamnesis` seguinte abre uma ficha
--     NOVA, com o questionário padrão vigente naquele dia. É a "nova anamnese do
--     retorno", e ela é uma decisão de quem atende, não um efeito colateral.
--
--   · FICHA ARQUIVADA É IMUTÁVEL: nem INSERT/UPDATE de resposta (trigger
--     tr_archived_lock, que vale para qualquer papel) nem DELETE (policy). Ver as
--     seções 6 e 8 — a assimetria trigger/policy no DELETE está explicada lá, e
--     tem motivo.
--
--   · LER: `patient_anamnesis` devolve a ficha ATIVA (mais o questionário, como
--     antes) e `patient_anamnesis_history` devolve TODAS, ativa e arquivadas, já
--     com as respostas congeladas de cada uma.
-- ═════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 0 · EXTENSÕES DE BUSCA
--
-- A lista de pacientes busca por nome digitado sem acento e no meio da palavra
-- ("sousa" tem de achar "Maria de Souza"). ILIKE '%x%' sem índice varre a
-- tabela; com trigrama, não.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pg_trgm  with schema extensions;
create extension if not exists unaccent with schema extensions;

create or replace function private.search_key(p_text text)
returns text
language sql
immutable
parallel safe
as $$
  -- A forma de 2 argumentos de unaccent() recebe o dicionário explícito e é
  -- IMMUTABLE de verdade — a de 1 argumento é STABLE (resolve o dicionário pela
  -- configuração da sessão) e o Postgres recusaria usá-la em índice.
  -- Sem `set search_path` de propósito: função com SET não é inlineada e a
  -- expressão do índice ficaria mais cara. Tudo aqui é qualificado por schema.
  select extensions.unaccent('extensions.unaccent'::regdictionary, lower(coalesce(p_text, '')));
$$;

comment on function private.search_key(text) is
  'Normaliza texto para busca: minúsculas e sem acento. Usada na EXPRESSÃO dos '
  'índices de nome — se o dicionário unaccent for trocado, os índices que a usam '
  'precisam de REINDEX (é o preço de marcá-la IMMUTABLE).';

grant execute on function private.search_key(text) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · ENUM DA FATIA
-- ─────────────────────────────────────────────────────────────────────────────

create type public.anamnesis_input_type as enum ('options', 'text', 'longText');

comment on type public.anamnesis_input_type is
  'Como a pergunta é respondida — espelha AnamnesisQuestion.type de '
  'questions.ts. O rótulo ''longText'' fica em camelCase de propósito: é um '
  'literal do contrato do front, que o envia cru. Convenção snake_case vale '
  'para NOME de coluna, não para VALOR de dado.';


create type public.anamnesis_status as enum ('active', 'archived');

comment on type public.anamnesis_status is
  'Situação da FICHA de anamnese. Enum próprio em vez de public.active_status '
  'porque o significado é outro: ''inactive'' é registro tirado de circulação, '
  'que volta se alguém reativar; ''archived'' é prontuário FECHADO — a ficha que '
  'valia até a data do arquivamento, que continua sendo lida e impressa e que '
  'ninguém mais edita. Reaproveitar o enum genérico convidaria a tratar as duas '
  'coisas com a mesma regra.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · PATIENT — domain.ts Patient
-- ─────────────────────────────────────────────────────────────────────────────

create table public.patient (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinic(id) on delete cascade,
  code          text not null,
  name          text not null,
  -- Coluna gerada: o nome em minúsculas e sem acento, para a busca da listagem.
  search_name   text generated always as (private.search_key(name)) stored,
  cpf           public.cpf_digits,
  birth_date    date,
  sex           public.gender,
  email         public.email_address,
  phone         public.phone_digits not null,
  whatsapp      public.phone_digits,
  -- Convênio: fatia Comercial. NULL = "Particular" (ver comment).
  insurance_id  uuid,
  last_visit    date,
  status        public.active_status not null default 'active',
  -- Endereço (domain.ts Address).
  cep           public.cep_digits,
  state         public.uf,
  city          text,
  neighborhood  text,
  street        text,
  number        text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint patient_name_not_blank_ck check (btrim(name) <> ''),
  -- Piso absurdo. O teto ("não pode ser no futuro") NÃO cabe aqui: o Postgres
  -- exige função IMMUTABLE em CHECK e current_date é STABLE — a regra vive na
  -- trigger tr_validate.
  constraint patient_birth_date_ck
    check (birth_date is null or birth_date >= date '1900-01-01'),
  constraint patient_code_uk unique (clinic_id, code),
  -- Alvo das FKs compostas das tabelas filhas (documento, anamnese, e também
  -- quote/payment nas outras fatias): é o que impede pendurar a ficha de um
  -- paciente da clínica A numa linha da clínica B.
  constraint patient_id_clinic_uk unique (id, clinic_id)
  -- A FK de insurance_id NÃO está aqui: ela atravessa fatia e fecha um ciclo.
  -- Está isolada em um ALTER TABLE no fim do arquivo — ver seção 11.
);

comment on table public.patient is
  'Paciente da clínica. NUNCA é apagado pelo app: não há policy nem GRANT de '
  'DELETE para `authenticated` — sai de circulação com status=''inactive'', '
  'porque consulta, tratamento, orçamento e pagamento apontam para ele e um '
  'histórico financeiro com FK órfã é pior que uma lista suja. Exclusão de '
  'verdade (pedido de LGPD) é ato do servidor, com service_role — e aí as '
  'tabelas filhas caem em cascata de propósito.';
comment on column public.patient.code is
  'Referência humana sequencial por clínica (PAC-000042), preenchida pela trigger '
  'tr_code. Único por clínica — a numeração de um tenant não vaza para o outro.';
comment on column public.patient.name is
  'Nome completo, como no domínio. O formulário coleta nome e sobrenome e junta '
  'antes de enviar (patientsService.addPatient) — o banco guarda o resultado, que '
  'é o que a lista exibe e a busca procura.';
comment on column public.patient.search_name is
  'Coluna GERADA (nunca escrita pelo cliente): nome em minúsculas e sem acento. '
  'Existe porque "sousa" tem de encontrar "Maria de Souza" e ILIKE ''%x%'' sem '
  'índice varre a tabela inteira a cada tecla digitada na busca.';
comment on column public.patient.cpf is
  'Somente dígitos (a máscara é do front). Único por CLÍNICA, não por plataforma: '
  'o mesmo CPF pode ser paciente de duas clínicas — são dois prontuários, não um.';
comment on column public.patient.phone is
  'Obrigatório: é o canal de confirmação de consulta e de cobrança. Sem ele o '
  'cadastro não serve para nada além de estatística.';
comment on column public.patient.insurance_id is
  'Convênio (public.insurance, fatia Comercial). NULL significa PARTICULAR — não '
  'existe (nem deve existir) uma linha "Particular" naquela tabela: convênio tem '
  'ANS, prazo de repasse e glosa; particular é a ausência disso. Convênio com '
  'paciente vinculado não se apaga (a FK barra) — inativa-se.';
comment on column public.patient.last_visit is
  'CACHE da última consulta concluída — NÃO é fonte da verdade (a fonte é a '
  'fatia de Agenda). Está aqui porque a lista de pacientes ordena e filtra por '
  'ele e o join com o histórico em toda listagem sairia caro. Fora do GRANT de '
  'UPDATE do cliente de propósito: quem escreve é a trigger da Agenda, senão o '
  'front poderia mentir sobre a data do atendimento.';
comment on column public.patient.street is
  'Logradouro. domain.ts Patient não tem este campo (só Address tem) — está aqui '
  'porque endereço sem rua não entrega documento nem atende home care; o '
  'formulário passa a coletá-lo quando quiser.';

create index patient_list_idx on public.patient (clinic_id, status, name);
comment on index public.patient_list_idx is
  'Caminho quente: a listagem sempre filtra o tenant + status e ordena por nome. '
  'Composto porque o filtro é sempre conjunto.';

create unique index patient_cpf_uk on public.patient (clinic_id, cpf) where cpf is not null;

create index patient_search_name_trgm_idx on public.patient
  using gin (search_name extensions.gin_trgm_ops);
comment on index public.patient_search_name_trgm_idx is
  'Busca por pedaço do nome, sem acento. O índice é sobre a COLUNA GERADA e não '
  'sobre uma expressão de propósito: o PostgREST só sabe filtrar coluna '
  '(`search_name=ilike.*sousa*`), e um índice sobre private.search_key(name) '
  'jamais seria usado por ele. O front normaliza o termo digitado com o mesmo '
  'critério (utils de busca já existentes) antes de enviar.';
create index patient_phone_idx on public.patient (clinic_id, phone);
create index patient_insurance_idx on public.patient (insurance_id) where insurance_id is not null;
create index patient_last_visit_idx on public.patient (clinic_id, last_visit desc nulls last);
create index patient_birth_date_idx on public.patient (clinic_id, (extract(month from birth_date)), (extract(day from birth_date)))
  where birth_date is not null;
comment on index public.patient_birth_date_idx is
  'Automação de aniversário do WhatsApp (AutomationTrigger ''birthday'') varre '
  '"quem faz aniversário hoje" todo dia — sem mês/dia indexados isso é seq scan '
  'na base inteira de pacientes, diariamente.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · PATIENT_DOCUMENT — domain.ts PatientDocument
-- ─────────────────────────────────────────────────────────────────────────────

create table public.patient_document (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinic(id) on delete cascade,
  patient_id   uuid not null,
  name         text not null,
  description  text,
  file_name    text not null,
  mime_type    text,
  size_bytes   bigint,
  storage_path text not null,
  -- Sem `uploaded_at`: seria sempre igual a created_at (mesmo default, e o
  -- cliente não tem GRANT para informar outro valor). Quem ordena a lista de
  -- documentos é created_at. Se um dia houver importação de base antiga que
  -- precise preservar a data original do arquivo, a coluna volta com um
  -- caminho de escrita por service_role — hoje seria só ruído duplicado.
  uploaded_by  uuid references public.profile(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint patient_document_name_not_blank_ck check (btrim(name) <> ''),
  constraint patient_document_file_name_not_blank_ck check (btrim(file_name) <> ''),
  constraint patient_document_size_ck check (size_bytes is null or size_bytes > 0),
  -- O mesmo objeto do Storage não se registra duas vezes: um duplo clique no
  -- upload viraria dois cartões apontando para o mesmo arquivo, e apagar um
  -- deles apagaria o arquivo do outro.
  constraint patient_document_storage_uk unique (clinic_id, storage_path),
  -- ON DELETE CASCADE: o documento não existe sem o paciente. Como o app nunca
  -- apaga paciente, na prática isto só dispara no expurgo de LGPD feito pelo
  -- servidor — que é exatamente quando queremos que os anexos sumam junto.
  constraint patient_document_patient_fk
    foreign key (patient_id, clinic_id)
    references public.patient(id, clinic_id)
    on delete cascade
);

comment on table public.patient_document is
  'Anexos do prontuário (exames, raio-X, termos, atestados). A tabela guarda os '
  'METADADOS; o arquivo vive no Supabase Storage, endereçado por storage_path.';
comment on column public.patient_document.storage_path is
  'Caminho do objeto no bucket — a FONTE DA VERDADE do arquivo. domain.ts tem '
  '`url`, que NÃO é persistida: URL de documento clínico tem de ser assinada e '
  'expirar, então é gerada na leitura. URL gravada em tabela é link permanente '
  'para exame de sangue de paciente.';
comment on column public.patient_document.size_bytes is
  'Tamanho em BYTES. domain.ts tem `size: "1,2 MB"` porque é mock: string '
  'formatada não ordena ("980 KB" > "1,2 MB" em texto) e não soma para cota. '
  'Quem formata é o front.';
comment on column public.patient_document.mime_type is
  'Tipo real do arquivo. domain.ts tem `type: "PDF"` (a extensão em maiúsculas), '
  'que o front deriva de file_name para escolher o ícone — extensão é palpite, '
  'MIME é o que o navegador precisa para abrir.';
comment on column public.patient_document.uploaded_by is
  'Quem anexou. Fora do GRANT de INSERT do cliente: vem do DEFAULT auth.uid(), '
  'para ninguém registrar um upload em nome de outra pessoa. ON DELETE SET NULL '
  'porque o documento sobrevive à saída do funcionário.';

alter table public.patient_document
  alter column uploaded_by set default auth.uid();

create index patient_document_patient_idx
  on public.patient_document (clinic_id, patient_id, created_at desc);
create index patient_document_uploaded_by_idx
  on public.patient_document (uploaded_by) where uploaded_by is not null;


-- ═════════════════════════════════════════════════════════════════════════════
-- 4 · O QUESTIONÁRIO (template) — a parte configurável da anamnese
--
-- Estas quatro tabelas são o catálogo DA CLÍNICA (clinic_id not null), não da
-- plataforma. A clínica nasce com o modelo do seu ramo, copiado por
-- private.seed_anamnesis_template() no onboarding, e pode ajustá-lo depois sem
-- afetar ninguém. Foi por isso que não viraram catálogo global como
-- feature/plan: o texto de uma pergunta clínica é do consultório que a assina.
-- ═════════════════════════════════════════════════════════════════════════════

create table public.anamnesis_template (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinic(id) on delete cascade,
  specialty   public.clinic_specialty not null,
  name        text not null,
  description text,
  version     integer not null default 1,
  is_default  boolean not null default false,
  status      public.active_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint anamnesis_template_name_not_blank_ck check (btrim(name) <> ''),
  constraint anamnesis_template_version_ck check (version > 0),
  constraint anamnesis_template_id_clinic_uk unique (id, clinic_id)
);

comment on table public.anamnesis_template is
  'O questionário. Uma clínica tem normalmente um (o do seu ramo); a estrutura '
  'aceita mais de um porque o dia em que existir "anamnese infantil" ou uma '
  'versão revisada não pode custar migration.';
comment on column public.anamnesis_template.specialty is
  'Ramo a que o questionário atende. Não é chave: a clínica de odontologia pode '
  'ter um questionário próprio além do modelo do CRO.';
comment on column public.anamnesis_template.version is
  'Contador informativo, exibido na ficha impressa. A imutabilidade do que já foi '
  'respondido NÃO depende dele: quem garante isso é o congelamento de '
  'question_text/answer_label na resposta.';

create unique index anamnesis_template_default_uk
  on public.anamnesis_template (clinic_id, specialty)
  where is_default and status = 'active';
comment on index public.anamnesis_template_default_uk is
  'Um único questionário padrão ativo por ramo e por clínica — sem isto, '
  'save_anamnesis() teria de escolher entre dois em silêncio.';

create index anamnesis_template_clinic_idx on public.anamnesis_template (clinic_id, status);


create table public.anamnesis_section (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinic(id) on delete cascade,
  template_id uuid not null,
  title       text not null,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint anamnesis_section_title_not_blank_ck check (btrim(title) <> ''),
  constraint anamnesis_section_id_template_uk unique (id, template_id),
  constraint anamnesis_section_template_fk
    foreign key (template_id, clinic_id)
    references public.anamnesis_template(id, clinic_id)
    on delete cascade
);

comment on table public.anamnesis_section is
  'Bloco de perguntas ("Saúde geral", "Saúde bucal") — espelha AnamnesisSection '
  'de questions.ts, com título e o texto de apoio que aparece sob ele. '
  'ON DELETE CASCADE: seção não existe fora do questionário.';

create index anamnesis_section_template_idx on public.anamnesis_section (template_id, sort_order);
create index anamnesis_section_clinic_idx on public.anamnesis_section (clinic_id);


create table public.anamnesis_question (
  id                uuid primary key default gen_random_uuid(),
  clinic_id         uuid not null references public.clinic(id) on delete cascade,
  template_id       uuid not null,
  section_id        uuid not null,
  code              text not null,
  question_text     text not null,
  input_type        public.anamnesis_input_type not null,
  sort_order        integer not null default 0,
  detail_label      text,
  detail_shown_for  text[],
  status            public.active_status not null default 'active',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint anamnesis_question_text_not_blank_ck check (btrim(question_text) <> ''),
  -- camelCase permitido: o code É o nome do campo no domain.ts ('bloodPressure',
  -- 'chiefComplaint'). Ver o comment da coluna.
  constraint anamnesis_question_code_format_ck check (code ~ '^[a-z][a-zA-Z0-9_]*$'),
  -- Rótulo e condição do detalhe andam juntos: um sem o outro é um campo que
  -- nunca aparece, ou que aparece sem nome.
  constraint anamnesis_question_detail_ck
    check ((detail_label is null) = (detail_shown_for is null)),
  -- Detalhe condicional só faz sentido em resposta fechada — não há "quando a
  -- resposta for X" se a resposta é texto livre.
  constraint anamnesis_question_detail_options_ck
    check (detail_label is null or input_type = 'options'),
  constraint anamnesis_question_code_uk unique (template_id, code),
  -- Alvos das FKs compostas de anamnesis_answer e anamnesis_question_option.
  constraint anamnesis_question_id_template_uk unique (id, template_id),
  constraint anamnesis_question_id_clinic_uk unique (id, clinic_id),
  constraint anamnesis_question_section_fk
    foreign key (section_id, template_id)
    references public.anamnesis_section(id, template_id)
    on delete cascade,
  constraint anamnesis_question_template_fk
    foreign key (template_id, clinic_id)
    references public.anamnesis_template(id, clinic_id)
    on delete cascade
);

comment on table public.anamnesis_question is
  'A pergunta. Nunca se APAGA uma pergunta já respondida (a FK da resposta é '
  'NO ACTION, que barra a exclusão no fim do statement); tira-se de circulação '
  'com status=''inactive'' — a ficha antiga continua legível e imprimível.';
comment on column public.anamnesis_question.code is
  'Identificador estável da pergunta DENTRO do questionário. Guardado exatamente '
  'como o campo do domain.ts (''medications'', ''bloodPressure'', ''chiefComplaint''), '
  'em camelCase: é a chave do jsonb que o front manda e recebe nas RPCs, e '
  'traduzi-la para snake_case só criaria um conversor a mais para errar. '
  'snake_case é regra de NOME DE COLUNA; isto é conteúdo.';
comment on column public.anamnesis_question.detail_label is
  'Rótulo do campo aberto que complementa a resposta ("Qual", "Semanas", '
  '"Quais (posologia e dose)"). No domain.ts isso é um SEGUNDO campo por '
  'pergunta (allergy + allergyDetails); aqui é uma coluna da mesma pergunta, '
  'porque é a mesma pergunta — e assim 30 campos viram 23 perguntas.';
comment on column public.anamnesis_question.detail_shown_for is
  'Valores de resposta que fazem o detalhe aparecer (AnamnesisQuestion.detail.when). '
  'Array e não FK para a opção de propósito: é regra de EXIBIÇÃO, e amarrá-la a '
  'ids tornaria a edição do questionário mais frágil do que o benefício.';

create index anamnesis_question_template_idx on public.anamnesis_question (template_id, sort_order);
create index anamnesis_question_section_idx on public.anamnesis_question (section_id, sort_order);
create index anamnesis_question_clinic_idx on public.anamnesis_question (clinic_id, status);


create table public.anamnesis_question_option (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinic(id) on delete cascade,
  question_id uuid not null,
  value       text not null,
  label       text not null,
  sort_order  integer not null default 0,
  is_alert    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint anamnesis_question_option_value_not_blank_ck check (btrim(value) <> ''),
  constraint anamnesis_question_option_label_not_blank_ck check (btrim(label) <> ''),
  constraint anamnesis_question_option_uk unique (question_id, value),
  -- Alvo da FK composta da resposta: é ESTA linha que impede gravar a opção
  -- "excessive" (da pergunta de sangramento) como resposta de "Fuma?".
  constraint anamnesis_question_option_id_question_uk unique (id, question_id),
  constraint anamnesis_question_option_question_fk
    foreign key (question_id, clinic_id)
    references public.anamnesis_question(id, clinic_id)
    on delete cascade
);

comment on table public.anamnesis_question_option is
  'As alternativas de uma resposta fechada. É AQUI que moram os literais que no '
  'domain.ts são unions de tipo (YesNo, YesNoUnknown, BloodPressure, '
  'BleedingLevel, HealingLevel, GumBleeding, FlossUse) — sete `create type` que '
  'deixaram de existir, com os MESMOS valores: yes, no, unknown, normal, high, '
  'low, controlled, excessive, complicated, during_brushing, sometimes, daily.';
comment on column public.anamnesis_question_option.value is
  'O valor ARMAZENADO, em inglês (''during_brushing''). Estável: é o que o front '
  'compara em detail_shown_for.';
comment on column public.anamnesis_question_option.label is
  'O que o paciente lê ("Durante a higiene"). Português, porque é tela.';
comment on column public.anamnesis_question_option.is_alert is
  'Resposta que muda a conduta clínica: alergia, cardiopatia, gestação, pressão '
  'alterada, sangramento excessivo. Vem da função isAlert() de questions.ts, que '
  'hoje é um mapa fixo no front e só conhece odontologia. Como DADO, a tarja '
  'vermelha passa a valer para qualquer questionário novo sem uma linha de código '
  'a mais — e "quais pacientes têm alerta" vira consulta.';

create index anamnesis_question_option_question_idx
  on public.anamnesis_question_option (question_id, sort_order);
create index anamnesis_question_option_clinic_idx on public.anamnesis_question_option (clinic_id);
create index anamnesis_question_option_alert_idx
  on public.anamnesis_question_option (clinic_id, question_id) where is_alert;


-- ═════════════════════════════════════════════════════════════════════════════
-- 5 · A FICHA RESPONDIDA — domain.ts Anamnesis
-- ═════════════════════════════════════════════════════════════════════════════

create table public.anamnesis (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinic(id) on delete cascade,
  patient_id  uuid not null,
  template_id uuid not null,
  filled_by   uuid references public.profile(id) on delete set null,
  status      public.anamnesis_status not null default 'active',
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Data de arquivamento e status andam juntos: ficha fechada sem data não diz
  -- até quando valia, e data em ficha aberta é contradição.
  constraint anamnesis_archived_ck
    check ((status = 'archived') = (archived_at is not null)),
  -- A unicidade "uma ficha por paciente" NÃO está aqui: virou o índice único
  -- PARCIAL anamnesis_active_patient_uk (logo abaixo do create table), porque
  -- constraint inline não aceita WHERE. O paciente tem UMA ficha ativa e o
  -- histórico que o prontuário exigir.
  --
  -- Alvos das FKs compostas da resposta (uma amarra o questionário, a outra o
  -- tenant — as duas apontam para esta mesma ficha). NÃO dependem da unicidade
  -- por paciente: são sobre (id, …), que continua sendo a chave primária mais
  -- uma coluna, e seguem válidas com N fichas do mesmo paciente.
  constraint anamnesis_id_template_uk unique (id, template_id),
  constraint anamnesis_id_clinic_uk unique (id, clinic_id),
  constraint anamnesis_patient_fk
    foreign key (patient_id, clinic_id)
    references public.patient(id, clinic_id)
    on delete cascade,
  -- NO ACTION: questionário com ficha respondida não se apaga — desativa-se
  -- (status), porque a ficha antiga precisa continuar sendo lida.
  --
  -- NO ACTION e NÃO RESTRICT, pelo mesmo motivo da seção 11 (e da fundação em
  -- clinic_user.access_profile_id): os dois barram a exclusão de um questionário
  -- em uso, mas RESTRICT é checado NA HORA e não é adiável. Ao apagar uma
  -- `clinic`, o CASCADE de clinic_id remove `anamnesis_template` e `anamnesis` na
  -- MESMA instrução, em ordem INDEFINIDA: se o template cair primeiro, o RESTRICT
  -- estoura e o expurgo de LGPD falha conforme o plano de execução do dia. Com NO
  -- ACTION a verificação roda no FIM do statement, quando as fichas já sumiram.
  constraint anamnesis_template_fk
    foreign key (template_id, clinic_id)
    references public.anamnesis_template(id, clinic_id)
    on delete no action
);

comment on table public.anamnesis is
  'O CABEÇALHO da ficha: de quem é, por qual questionário, quem preencheu e '
  'quando foi revisada. As respostas estão em anamnesis_answer. O paciente tem '
  'UMA ficha ativa (índice anamnesis_active_patient_uk) e quantas arquivadas o '
  'prontuário exigir — a ficha antiga NÃO é sobrescrita pela revisão do retorno.';
comment on column public.anamnesis.status is
  'active = a ficha que vale hoje, a única editável e a que patient_anamnesis() '
  'devolve. archived = prontuário fechado, imutável, mantido para guarda legal e '
  'devolvido por patient_anamnesis_history(). A transição é de mão ÚNICA e passa '
  'por public.archive_anamnesis(): não há GRANT de UPDATE nesta coluna, então '
  'ninguém desarquiva pelo PostgREST para "corrigir" uma ficha fechada.';
comment on column public.anamnesis.archived_at is
  'Quando a ficha foi fechada — é a data que a tela do histórico exibe. Não é '
  'igual a updated_at: o arquivamento também sobe o updated_at (trigger tr_touch), '
  'mas updated_at responde "quando mexeram nisto pela última vez" e archived_at '
  'responde "até quando esta ficha valia", que é a pergunta clínica.';
comment on column public.anamnesis.template_id is
  'Questionário usado. Fica CONGELADO na ficha: se a clínica trocar o padrão '
  'amanhã, esta ficha continua sendo lida com as perguntas que o paciente '
  'realmente respondeu.';
comment on column public.anamnesis.updated_at is
  'domain.ts Anamnesis.updatedAt — "a ficha é revisada a cada retorno". Sobe '
  'também quando só uma RESPOSTA muda (trigger tr_touch_parent em '
  'anamnesis_answer), senão a data exibida mentiria.';
comment on column public.anamnesis.filled_by is
  'Quem registrou/revisou por último. NUNCA é informado pelo cliente — não está '
  'em nenhum GRANT de coluna: no INSERT vem do DEFAULT auth.uid(), e a cada '
  'revisão é recarimbado pela trigger tr_touch_parent (SECURITY DEFINER) de '
  'anamnesis_answer. Mesma proteção de patient_document.uploaded_by: autoria de '
  'prontuário que o próprio usuário escolhe não é autoria — sem isso a '
  'recepcionista assina a ficha como se fosse o dentista. ON DELETE SET NULL: a '
  'ficha é do paciente, não do funcionário — o histórico de quem respondeu o quê '
  'fica no audit_log.';

alter table public.anamnesis
  alter column filled_by set default auth.uid();

-- A regra "uma ficha por paciente" que era `unique (patient_id)`, agora restrita
-- às fichas ABERTAS. Índice e não constraint porque só índice aceita WHERE.
create unique index anamnesis_active_patient_uk
  on public.anamnesis (patient_id) where status = 'active';
comment on index public.anamnesis_active_patient_uk is
  'UMA ficha ativa por paciente. É esta unicidade que deixa patient_anamnesis() e '
  'save_anamnesis() fazerem `select ... where patient_id = $1 and status = ''active''` '
  'sem escolher entre duas em silêncio, e é ela que a corrida de dois usuários '
  'salvando a primeira ficha ao mesmo tempo esbarra (o segundo leva erro de chave '
  'duplicada, e não uma ficha duplicada).';

create index anamnesis_patient_history_idx
  on public.anamnesis (patient_id, created_at desc);
comment on index public.anamnesis_patient_history_idx is
  'O histórico de fichas do paciente, da mais recente para a mais antiga. '
  'Liderado por patient_id e não por clinic_id (que é a convenção das listagens) '
  'porque a consulta do histórico e o CASCADE de anamnesis_patient_fk filtram '
  'pelo PACIENTE — o caminho por tenant já é servido por anamnesis_clinic_idx. '
  'É necessário porque o índice único acima é PARCIAL (where status = ''active'') '
  'e o planner não pode usá-lo para alcançar as arquivadas.';

create index anamnesis_clinic_idx on public.anamnesis (clinic_id, updated_at desc);
create index anamnesis_template_idx on public.anamnesis (template_id);
create index anamnesis_filled_by_idx on public.anamnesis (filled_by) where filled_by is not null;


create table public.anamnesis_answer (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinic(id) on delete cascade,
  anamnesis_id  uuid not null,
  template_id   uuid not null,
  question_id   uuid not null,
  option_id     uuid,
  text_value    text,
  detail_text   text,
  -- Congelados por trigger no momento da gravação (ver tg_anamnesis_answer_freeze).
  question_text text not null,
  answer_label  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Uma resposta por pergunta. Sem isto, salvar duas vezes duplicaria a ficha.
  constraint anamnesis_answer_uk unique (anamnesis_id, question_id),
  -- Resposta fechada OU texto — nunca as duas. (As duas nulas é permitido: é a
  -- pergunta que o paciente pulou.)
  constraint anamnesis_answer_single_value_ck
    check (num_nonnulls(option_id, text_value) <= 1),
  -- ── As três FKs compostas que sustentam o modelo ───────────────────────────
  -- 1) a resposta pertence a uma ficha DAQUELE questionário;
  constraint anamnesis_answer_anamnesis_fk
    foreign key (anamnesis_id, template_id)
    references public.anamnesis(id, template_id)
    on delete cascade,
  -- 2) a pergunta pertence AO MESMO questionário — impede responder a pergunta
  --    da anamnese infantil dentro da ficha adulta;
  --
  --    NO ACTION (e não RESTRICT) nas duas FKs abaixo pelo mesmo motivo da FK de
  --    template acima: as duas barram apagar pergunta/opção já respondida, mas
  --    RESTRICT é verificado IMEDIATAMENTE e não é adiável — no CASCADE de
  --    `delete from clinic` (que remove anamnesis_question, anamnesis_question_option
  --    e anamnesis_answer na mesma instrução, em ordem indefinida) ele estouraria
  --    quando a pergunta caísse antes da resposta. NO ACTION checa no fim do
  --    statement e dá a MESMA garantia no uso normal do app.
  constraint anamnesis_answer_question_fk
    foreign key (question_id, template_id)
    references public.anamnesis_question(id, template_id)
    on delete no action,
  -- 3) a opção escolhida pertence ÀQUELA pergunta. Esta é a garantia que uma
  --    coluna `text` com CHECK não daria, porque a lista de opções é dado.
  constraint anamnesis_answer_option_fk
    foreign key (option_id, question_id)
    references public.anamnesis_question_option(id, question_id)
    on delete no action,
  constraint anamnesis_answer_clinic_fk
    foreign key (anamnesis_id, clinic_id)
    references public.anamnesis(id, clinic_id)
    on delete cascade
);

comment on table public.anamnesis_answer is
  'A resposta do paciente a uma pergunta. É o registro clínico propriamente dito: '
  'auditado, com a pergunta e a resposta congeladas em texto, e com FK para a '
  'opção — não é EAV solto de text.';
comment on column public.anamnesis_answer.template_id is
  'Redundante por join, e proposital: sem ele as FKs compostas (2) e (3) acima '
  'não existiriam e nada impediria misturar perguntas de questionários '
  'diferentes na mesma ficha. Mesmo raciocínio do clinic_id redundante da fundação.';
comment on column public.anamnesis_answer.option_id is
  'Resposta fechada. NULL quando a pergunta é aberta (input_type text/longText) '
  'ou quando foi pulada.';
comment on column public.anamnesis_answer.detail_text is
  'O complemento pedido pela pergunta ("Qual?", "Semanas"). No domain.ts isso é '
  'um campo irmão (allergyDetails); aqui é a mesma linha da resposta que o '
  'motivou — apagar a resposta apaga o detalhe, que é o comportamento certo.';
comment on column public.anamnesis_answer.question_text is
  'Texto da pergunta CONGELADO na gravação. Prontuário é documento assinado: se '
  'a clínica reescrever a pergunta em 2027, a ficha de 2026 não pode mudar de '
  'sentido retroativamente. Mesmo princípio de audit_log.actor_name.';
comment on column public.anamnesis_answer.answer_label is
  'Rótulo da resposta congelado ("Durante a higiene", ou o próprio texto digitado). '
  'Deixa a impressão e a auditoria legíveis sem depender das opções atuais.';

create index anamnesis_answer_anamnesis_idx on public.anamnesis_answer (anamnesis_id);
create index anamnesis_answer_question_idx on public.anamnesis_answer (question_id);
create index anamnesis_answer_clinic_idx on public.anamnesis_answer (clinic_id);
comment on index public.anamnesis_answer_clinic_idx is
  'Índice da FK clinic_id. Parece redundante com anamnesis_answer_alert_idx, que '
  'também começa por clinic_id, mas aquele é PARCIAL (where option_id is not null) '
  'e o planner não pode usá-lo para `clinic_id = $1` — a condição não implica a do '
  'índice. Sem este, o CASCADE de `delete from clinic` faz seq scan na tabela mais '
  'volumosa da fatia (≈23 linhas por ficha).';
create index anamnesis_answer_option_idx on public.anamnesis_answer (option_id) where option_id is not null;
create index anamnesis_answer_alert_idx
  on public.anamnesis_answer (clinic_id, question_id, option_id) where option_id is not null;
comment on index public.anamnesis_answer_alert_idx is
  'O que devolve a capacidade de consulta que colunas dedicadas dariam: '
  '"quais pacientes responderam X em Y" (alérgicos, gestantes, cardiopatas) sai '
  'por este índice em vez de varrer as respostas. '
  'ATENÇÃO desde que a ficha ganhou HISTÓRICO: a resposta da ficha ARQUIVADA '
  'continua nesta tabela e neste índice. A consulta de HOJE ("quem é alérgico") '
  'tem de juntar com public.anamnesis e filtrar status = ''active'', senão devolve '
  'o que o paciente declarou em 2026 como se fosse a declaração de agora — e erra '
  'nos dois sentidos (o alérgico que deixou de ser, e o mesmo paciente contado uma '
  'vez por ficha). O filtro sai pela PK de anamnesis; este índice continua '
  'servindo o lado da resposta.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 6 · TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

-- Regras do paciente que CHECK não consegue expressar -------------------------
create or replace function private.tg_patient_validate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Data de nascimento no futuro é erro de digitação, e um erro caro: a idade
  -- calculada fica negativa em toda tela que a exibe e nas faixas etárias do
  -- relatório. Está em trigger e não em CHECK porque CHECK só aceita função
  -- IMMUTABLE, e current_date é STABLE.
  if new.birth_date is not null and new.birth_date > current_date then
    raise exception 'Data de nascimento no futuro (%).', new.birth_date
      using errcode = '23514';
  end if;
  return new;
end;
$$;

comment on function private.tg_patient_validate() is
  'BEFORE INSERT OR UPDATE em patient: as regras que dependem de "hoje" e por '
  'isso não cabem em CHECK.';

revoke execute on function private.tg_patient_validate() from public;

create trigger tr_validate
  before insert or update of birth_date on public.patient
  for each row execute function private.tg_patient_validate();


-- Congela o texto da pergunta e o rótulo da resposta, e valida o tipo ---------
create or replace function private.tg_anamnesis_answer_freeze()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_q record;
  v_o record;
begin
  select q.question_text, q.input_type
    into v_q
    from public.anamnesis_question q
   where q.id = new.question_id;

  if not found then
    raise exception 'Pergunta % não existe.', new.question_id using errcode = '23503';
  end if;

  -- Coerência entre o TIPO da pergunta e o formato da resposta. As FKs compostas
  -- já garantem a quem a opção pertence; o que elas não sabem dizer é que uma
  -- pergunta de texto livre não pode vir com option_id, nem o contrário.
  if v_q.input_type = 'options' then
    if new.text_value is not null then
      raise exception 'A pergunta "%" é de resposta fechada: use option_id, não text_value.', v_q.question_text
        using errcode = '23514';
    end if;
  else
    if new.option_id is not null then
      raise exception 'A pergunta "%" é de resposta aberta: use text_value, não option_id.', v_q.question_text
        using errcode = '23514';
    end if;
  end if;

  new.question_text := v_q.question_text;

  if new.option_id is not null then
    select o.label into v_o from public.anamnesis_question_option o where o.id = new.option_id;
    new.answer_label := v_o.label;
  else
    new.answer_label := nullif(btrim(coalesce(new.text_value, '')), '');
  end if;

  return new;
end;
$$;

comment on function private.tg_anamnesis_answer_freeze() is
  'BEFORE INSERT OR UPDATE em anamnesis_answer: valida o formato da resposta '
  'contra o tipo da pergunta e CONGELA pergunta e rótulo. SECURITY DEFINER '
  'porque precisa ler o questionário mesmo quando a policy de leitura do usuário '
  'for mais restrita que a de escrita.';

revoke execute on function private.tg_anamnesis_answer_freeze() from public;

create trigger tr_freeze
  before insert or update on public.anamnesis_answer
  for each row execute function private.tg_anamnesis_answer_freeze();


-- Ficha arquivada não recebe mais escrita -------------------------------------
create or replace function private.anamnesis_is_archived(p_anamnesis uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  -- coalesce(..., false): ficha inexistente não é "arquivada". Quem barra id
  -- inválido é a FK, e devolver NULL aqui deixaria a policy do DELETE com
  -- resultado NULL — que é FALSE na prática, mas por acidente e não por decisão.
  select coalesce(
    (select a.status = 'archived' from public.anamnesis a where a.id = p_anamnesis),
    false
  );
$$;

comment on function private.anamnesis_is_archived(uuid) is
  'A ficha está fechada? SECURITY DEFINER porque é consultada de dentro da policy '
  'de DELETE de anamnesis_answer e de uma trigger: a resposta tem de ser a mesma '
  'para qualquer papel, e não depender de o usuário enxergar (ou não) o cabeçalho '
  'da ficha pela RLS.';

grant execute on function private.anamnesis_is_archived(uuid) to authenticated;

create or replace function private.tg_anamnesis_answer_archived_lock()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if private.anamnesis_is_archived(new.anamnesis_id) then
    raise exception
      'Ficha de anamnese arquivada: prontuário fechado não se edita. Salve na ficha ativa do paciente.'
      using errcode = '42501';
  end if;

  -- Mover uma resposta PARA FORA da ficha arquivada esvaziaria o prontuário
  -- fechado sem nunca escrever nele. `anamnesis_id` não está no GRANT de UPDATE,
  -- então isto só alcança service_role — e é justamente aí que a trava importa.
  -- A comparação vem antes da consulta para não pagar o lookup no caminho normal.
  if tg_op = 'UPDATE'
     and old.anamnesis_id is distinct from new.anamnesis_id
     and private.anamnesis_is_archived(old.anamnesis_id) then
    raise exception 'Ficha de anamnese arquivada: a resposta não pode sair do prontuário fechado.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

comment on function private.tg_anamnesis_answer_archived_lock() is
  'BEFORE INSERT OR UPDATE em anamnesis_answer: recusa escrita em ficha '
  'arquivada. É TRIGGER e não policy de propósito — vale para service_role e '
  'para qualquer função SECURITY DEFINER, que é onde a RLS não alcança. '
  'O DELETE fica de fora: um `delete from clinic` (expurgo de LGPD) cascateia '
  'até aqui, e uma trava de DELETE em trigger tornaria o expurgo impossível — '
  'por isso ele é barrado na POLICY, que o service_role legitimamente ignora. '
  'A função em si NÃO é SECURITY DEFINER: quem precisa ver a ficha é '
  'private.anamnesis_is_archived(), e ela já é.';

revoke execute on function private.tg_anamnesis_answer_archived_lock() from public;

-- Nome com "a" na frente também por ordem de disparo: o Postgres executa as
-- triggers BEFORE por ordem alfabética, e tr_archived_lock < tr_freeze —
-- recusar a escrita antes de congelar pergunta e rótulo é a ordem certa.
create trigger tr_archived_lock
  before insert or update on public.anamnesis_answer
  for each row execute function private.tg_anamnesis_answer_archived_lock();


-- Mexeu na resposta, a ficha foi revisada (e por quem) ------------------------
create or replace function private.tg_anamnesis_touch_parent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Ramos separados de propósito: em trigger de DELETE o registro NEW não é
  -- atribuído, e `coalesce(new.x, old.x)` estouraria com "record new is not
  -- assigned yet" — não devolveria NULL.
  --
  -- `filled_by` é carimbado AQUI, e não por uma trigger BEFORE em `anamnesis`:
  --   · aqui é o único ponto em que a ficha realmente muda (uma resposta mudou),
  --     que é a definição de "revisada";
  --   · esta função é SECURITY DEFINER, então escreve a coluna sem que o papel
  --     `authenticated` precise de GRANT de UPDATE nela — e sem GRANT ninguém
  --     forja autoria de prontuário pelo PostgREST;
  --   · uma trigger BEFORE UPDATE em `anamnesis` seria PIOR: o ON DELETE SET NULL
  --     de filled_by → profile executa um UPDATE nesta tabela, e a trigger
  --     reescreveria filled_by com o uid de quem está apagando a conta, anulando
  --     o SET NULL e atribuindo a ficha a outra pessoa.
  -- O coalesce preserva o autor anterior quando quem escreve não é uma sessão de
  -- usuário (job do servidor com service_role, onde auth.uid() é NULL).
  if tg_op = 'DELETE' then
    update public.anamnesis
       set updated_at = now(),
           filled_by  = coalesce(auth.uid(), filled_by)
     where id = old.anamnesis_id;
    return old;
  end if;

  update public.anamnesis
     set updated_at = now(),
         filled_by  = coalesce(auth.uid(), filled_by)
   where id = new.anamnesis_id;
  return new;
end;
$$;

comment on function private.tg_anamnesis_touch_parent() is
  'AFTER em anamnesis_answer: sobe o updated_at da ficha e carimba quem revisou. '
  'É esse carimbo que a tela mostra como "Atualizada em" — sem isto ele só '
  'mudaria quando alguém tocasse no cabeçalho, que é justamente o que ninguém faz.';

revoke execute on function private.tg_anamnesis_touch_parent() from public;

create trigger tr_touch_parent
  after insert or update or delete on public.anamnesis_answer
  for each row execute function private.tg_anamnesis_touch_parent();


-- updated_at -----------------------------------------------------------------
create trigger tr_touch before update on public.patient
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.patient_document
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.anamnesis_template
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.anamnesis_section
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.anamnesis_question
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.anamnesis_question_option
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.anamnesis
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.anamnesis_answer
  for each row execute function private.tg_touch_updated_at();

-- Código humano ---------------------------------------------------------------
create trigger tr_code
  before insert on public.patient
  for each row when (new.code is null)
  execute function private.tg_set_code('patient', 'PAC');

-- Auditoria -------------------------------------------------------------------
-- Tudo desta fatia é dado pessoal sensível (LGPD art. 11) ou prontuário. A
-- pergunta "quem alterou a alergia deste paciente?" tem de ter resposta.
create trigger tr_audit after insert or update or delete on public.patient
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.patient_document
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.anamnesis
  for each row execute function private.tg_audit();
-- Sim, isto gera ~23 linhas de log no primeiro preenchimento de uma ficha. É o
-- custo aceito: a resposta É o registro clínico, e "o paciente disse que não era
-- alérgico" é exatamente o fato que precisa de trilha quando algo dá errado.
-- Revisões seguintes geram só o que mudou (tg_audit ignora update sem alteração).
create trigger tr_audit after insert or update or delete on public.anamnesis_answer
  for each row execute function private.tg_audit();


-- ─────────────────────────────────────────────────────────────────────────────
-- 7 · PRIVILÉGIOS DE COLUNA
--
-- RLS diz QUAIS LINHAS; GRANT diz QUAIS COLUNAS. Aqui o GRANT é o que impede o
-- cliente de escolher o próprio código humano, de mentir sobre a última visita e
-- de forjar o congelamento da resposta.
-- ─────────────────────────────────────────────────────────────────────────────

revoke insert, update, delete on public.patient from anon, authenticated;
grant insert (
  clinic_id, name, cpf, birth_date, sex, email, phone, whatsapp,
  insurance_id, status, cep, state, city, neighborhood, street, number
) on public.patient to authenticated;
grant update (
  name, cpf, birth_date, sex, email, phone, whatsapp,
  insurance_id, status, cep, state, city, neighborhood, street, number
) on public.patient to authenticated;
-- Fora da lista: `code` (a sequência é do banco — deixar o cliente informá-lo
-- permitiria colidir de propósito ou pular números), `clinic_id` no UPDATE
-- (mudar o tenant de um paciente é mover prontuário entre clínicas) e
-- `last_visit` (é a Agenda que carimba). Sem DELETE: paciente não se apaga.

revoke insert, update, delete on public.patient_document from anon, authenticated;
grant insert (
  clinic_id, patient_id, name, description, file_name, mime_type, size_bytes, storage_path
) on public.patient_document to authenticated;
-- `uploaded_by` fica fora: vem do DEFAULT auth.uid().
grant update (name, description) on public.patient_document to authenticated;
-- Só nome e descrição: trocar storage_path/file_name transformaria o cartão do
-- exame no cartão de outro arquivo, mantendo o histórico. Para isso, apaga e
-- envia de novo.
grant delete on public.patient_document to authenticated;

revoke insert, update, delete on public.anamnesis_template        from anon, authenticated;
revoke insert, update, delete on public.anamnesis_section         from anon, authenticated;
revoke insert, update, delete on public.anamnesis_question        from anon, authenticated;
revoke insert, update, delete on public.anamnesis_question_option from anon, authenticated;

grant insert (clinic_id, specialty, name, description, is_default, status)
  on public.anamnesis_template to authenticated;
grant update (name, description, is_default, status, version)
  on public.anamnesis_template to authenticated;
grant delete on public.anamnesis_template to authenticated;

grant insert (clinic_id, template_id, title, description, sort_order)
  on public.anamnesis_section to authenticated;
grant update (title, description, sort_order) on public.anamnesis_section to authenticated;
grant delete on public.anamnesis_section to authenticated;

grant insert (clinic_id, template_id, section_id, code, question_text, input_type,
              sort_order, detail_label, detail_shown_for, status)
  on public.anamnesis_question to authenticated;
grant update (section_id, question_text, input_type, sort_order,
              detail_label, detail_shown_for, status)
  on public.anamnesis_question to authenticated;
-- `code` não é editável: é a chave que o front usa no jsonb da ficha. Renomear
-- em produção quebraria o formulário sem quebrar nada no banco — o pior tipo.
grant delete on public.anamnesis_question to authenticated;

grant insert (clinic_id, question_id, value, label, sort_order, is_alert)
  on public.anamnesis_question_option to authenticated;
grant update (label, sort_order, is_alert) on public.anamnesis_question_option to authenticated;
-- `value` idem `code`: é o literal armazenado nas respostas já gravadas.
grant delete on public.anamnesis_question_option to authenticated;

revoke insert, update, delete on public.anamnesis from anon, authenticated;
grant insert (clinic_id, patient_id, template_id) on public.anamnesis to authenticated;
-- NENHUM grant de UPDATE: hoje não há uma só coluna do cabeçalho que o cliente
-- deva escrever depois de criado. `filled_by` fica de fora das duas listas (é o
-- DEFAULT auth.uid() no INSERT e a trigger tr_touch_parent na revisão — ver o
-- comment da coluna); `updated_at` é da trigger; `patient_id`/`template_id` não
-- mudam, porque a ficha não troca de dono nem de questionário. A policy de
-- UPDATE abaixo continua declarada de propósito: é ela que autoriza o dia em que
-- alguma coluna do cabeçalho virar editável, e sem GRANT ela não abre nada.
-- Sem DELETE: a ficha some junto com o paciente, no expurgo de LGPD.
--
-- `status` e `archived_at` são o caso mais importante dessa lista: NÃO estão nem
-- no INSERT (ficha nova nasce 'active', ninguém cria prontuário já fechado) nem
-- no UPDATE. Arquivar passa por public.archive_anamnesis(), que é SECURITY
-- DEFINER. Com um `grant update (status)`, um PATCH direto no PostgREST
-- DESARQUIVARIA uma ficha fechada e a devolveria para edição — e a imutabilidade
-- do prontuário duraria até o primeiro usuário que abrisse o DevTools.

revoke insert, update, delete on public.anamnesis_answer from anon, authenticated;
grant insert (clinic_id, anamnesis_id, template_id, question_id, option_id, text_value, detail_text)
  on public.anamnesis_answer to authenticated;
grant update (option_id, text_value, detail_text) on public.anamnesis_answer to authenticated;
grant delete on public.anamnesis_answer to authenticated;
-- `question_text` e `answer_label` fora das duas listas: são o congelamento. Se o
-- cliente pudesse escrevê-los, a ficha impressa diria o que ele quisesse.


-- ─────────────────────────────────────────────────────────────────────────────
-- 8 · RLS
--
-- Todas as tabelas da fatia respondem à feature 'patients' — a mesma chave que o
-- plano libera e que o cargo permite. Exceção: ESCREVER no questionário é ato de
-- configuração, e por isso pede 'admin'. Recepcionista preenche a ficha do
-- paciente; ninguém reescreve o questionário da clínica sem ser administrador.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.patient                   enable row level security;
alter table public.patient_document          enable row level security;
alter table public.anamnesis_template        enable row level security;
alter table public.anamnesis_section         enable row level security;
alter table public.anamnesis_question        enable row level security;
alter table public.anamnesis_question_option enable row level security;
alter table public.anamnesis                 enable row level security;
alter table public.anamnesis_answer          enable row level security;

-- ── patient ──────────────────────────────────────────────────────────────────
create policy patient_select on public.patient
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy patient_insert on public.patient
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy patient_update on public.patient
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));
-- Sem policy de DELETE: ver o comment da tabela.

-- ── patient_document ─────────────────────────────────────────────────────────
create policy patient_document_select on public.patient_document
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy patient_document_insert on public.patient_document
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy patient_document_update on public.patient_document
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy patient_document_delete on public.patient_document
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

-- ── questionário (template/section/question/option) ──────────────────────────
-- Ler: quem abre a ficha (patients). Escrever: quem configura a clínica (admin).
create policy anamnesis_template_select on public.anamnesis_template
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients', 'admin')
  );
create policy anamnesis_template_insert on public.anamnesis_template
  for insert to authenticated
  with check (clinic_id = any(private.auth_clinic_ids()) and private.can_edit_feature(clinic_id, 'admin'));
create policy anamnesis_template_update on public.anamnesis_template
  for update to authenticated
  using (clinic_id = any(private.auth_clinic_ids()) and private.can_edit_feature(clinic_id, 'admin'))
  with check (clinic_id = any(private.auth_clinic_ids()));
create policy anamnesis_template_delete on public.anamnesis_template
  for delete to authenticated
  using (clinic_id = any(private.auth_clinic_ids()) and private.can_edit_feature(clinic_id, 'admin'));

create policy anamnesis_section_select on public.anamnesis_section
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients', 'admin')
  );
create policy anamnesis_section_insert on public.anamnesis_section
  for insert to authenticated
  with check (clinic_id = any(private.auth_clinic_ids()) and private.can_edit_feature(clinic_id, 'admin'));
create policy anamnesis_section_update on public.anamnesis_section
  for update to authenticated
  using (clinic_id = any(private.auth_clinic_ids()) and private.can_edit_feature(clinic_id, 'admin'))
  with check (clinic_id = any(private.auth_clinic_ids()));
create policy anamnesis_section_delete on public.anamnesis_section
  for delete to authenticated
  using (clinic_id = any(private.auth_clinic_ids()) and private.can_edit_feature(clinic_id, 'admin'));

create policy anamnesis_question_select on public.anamnesis_question
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients', 'admin')
  );
create policy anamnesis_question_insert on public.anamnesis_question
  for insert to authenticated
  with check (clinic_id = any(private.auth_clinic_ids()) and private.can_edit_feature(clinic_id, 'admin'));
create policy anamnesis_question_update on public.anamnesis_question
  for update to authenticated
  using (clinic_id = any(private.auth_clinic_ids()) and private.can_edit_feature(clinic_id, 'admin'))
  with check (clinic_id = any(private.auth_clinic_ids()));
create policy anamnesis_question_delete on public.anamnesis_question
  for delete to authenticated
  using (clinic_id = any(private.auth_clinic_ids()) and private.can_edit_feature(clinic_id, 'admin'));

create policy anamnesis_question_option_select on public.anamnesis_question_option
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients', 'admin')
  );
create policy anamnesis_question_option_insert on public.anamnesis_question_option
  for insert to authenticated
  with check (clinic_id = any(private.auth_clinic_ids()) and private.can_edit_feature(clinic_id, 'admin'));
create policy anamnesis_question_option_update on public.anamnesis_question_option
  for update to authenticated
  using (clinic_id = any(private.auth_clinic_ids()) and private.can_edit_feature(clinic_id, 'admin'))
  with check (clinic_id = any(private.auth_clinic_ids()));
create policy anamnesis_question_option_delete on public.anamnesis_question_option
  for delete to authenticated
  using (clinic_id = any(private.auth_clinic_ids()) and private.can_edit_feature(clinic_id, 'admin'));

-- ── anamnesis + anamnesis_answer ─────────────────────────────────────────────
create policy anamnesis_select on public.anamnesis
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

create policy anamnesis_insert on public.anamnesis
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

-- Não há GRANT de coluna que a acompanhe (ver seção 7), então hoje ela não abre
-- nada — está declarada para o dia em que alguma coluna do cabeçalho virar
-- editável. O `status = 'active'` já deixa esse dia seguro: qualquer coluna que
-- ganhe GRANT no futuro nasce editável só na ficha aberta.
create policy anamnesis_update on public.anamnesis
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
    and status = 'active'
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy anamnesis_answer_select on public.anamnesis_answer
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'patients')
  );

-- Estas duas NÃO repetem a checagem de ficha arquivada, e não é esquecimento:
-- quem barra escrita em prontuário fechado no INSERT e no UPDATE é a trigger
-- tr_archived_lock, que vale para TODO papel (inclusive service_role e funções
-- SECURITY DEFINER, onde policy nenhuma alcança). Repetir aqui pagaria uma
-- consulta a mais em cada uma das ~23 linhas de cada gravação de ficha, para
-- garantir de novo o que já está garantido em um lugar mais forte.
create policy anamnesis_answer_insert on public.anamnesis_answer
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  );

create policy anamnesis_answer_update on public.anamnesis_answer
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

-- A trava do prontuário fechado no DELETE mora AQUI e não em trigger, ao
-- contrário do INSERT/UPDATE (ver private.tg_anamnesis_answer_archived_lock):
-- o `on delete cascade` de anamnesis → anamnesis_answer é o caminho do expurgo
-- de LGPD, e uma trigger que recusasse DELETE em ficha arquivada tornaria o
-- expurgo impossível. Na policy, o app é barrado e o service_role — que é quem
-- executa o expurgo, com autorização de outra natureza — passa.
create policy anamnesis_answer_delete on public.anamnesis_answer
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'patients')
    and not private.anamnesis_is_archived(anamnesis_id)
  );


-- ═════════════════════════════════════════════════════════════════════════════
-- 9 · RPCs DA FICHA
--
-- SECURITY INVOKER de propósito (o padrão): as policies acima já filtram por
-- tenant e por feature. Uma RPC DEFINER aqui seria um buraco na própria política
-- que acabamos de escrever, e teria de reimplementar à mão tudo que a RLS faz.
--
-- A ÚNICA exceção é `archive_anamnesis`, e ela paga o preço: é DEFINER porque
-- precisa escrever uma coluna que o cliente não pode ter no GRANT, e por isso
-- refaz À MÃO as duas verificações que a RLS faria (tenant + feature). Está
-- explicado no comment dela.
-- ═════════════════════════════════════════════════════════════════════════════

-- O corpo de UMA ficha em jsonb — usado pela leitura da ficha ativa e pelo
-- histórico, que precisam exatamente do mesmo formato. Sem este helper, a mesma
-- consulta de 40 linhas existiria duas vezes e as duas divergiriam na primeira
-- manutenção.
create or replace function private.anamnesis_record_json(p_anamnesis uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id',          a.id,
    'template_id', a.template_id,
    'status',      a.status,
    'created_at',  a.created_at,
    'updated_at',  a.updated_at,
    'archived_at', a.archived_at,
    'filled_by',   a.filled_by,
    -- Mapa código → resposta: o formato achatado que o front espera, sem ele ter
    -- de pivotar N linhas.
    'answers', coalesce((
      select jsonb_object_agg(
               q.code,
               jsonb_build_object(
                 -- `question` é o texto CONGELADO na resposta, e não q.question_text:
                 -- na ficha arquivada é ele que diz o que foi perguntado à época.
                 'question', ans.question_text,
                 'value',    coalesce(o.value, ans.text_value),
                 'label',    ans.answer_label,
                 'detail',   ans.detail_text,
                 'is_alert', coalesce(o.is_alert, false)
               )
             )
        from public.anamnesis_answer ans
        join public.anamnesis_question q on q.id = ans.question_id
        left join public.anamnesis_question_option o on o.id = ans.option_id
       where ans.anamnesis_id = a.id
    ), '{}'::jsonb),
    -- Pré-calculado porque é o que vira tarja vermelha no topo da ficha e do
    -- atendimento: deixar o front derivar significaria repetir a regra em cada
    -- tela que exibe o alerta.
    --
    -- O QUE "FICHA ARQUIVADA É IMUTÁVEL" NÃO COBRE, e é preciso saber ao ler o
    -- histórico: `question` e `label` acima são o texto CONGELADO na resposta,
    -- mas `is_alert` é lido da opção de HOJE — é justamente a coluna do
    -- questionário que continua no GRANT de UPDATE (seção 7). Isso é deliberado:
    -- "esta resposta é alerta clínico" é juízo da clínica sobre a resposta, não a
    -- resposta; a clínica que descobre amanhã que uma declaração é grave quer a
    -- tarja também nas fichas fechadas. O que o arquivamento garante é o que o
    -- paciente RESPONDEU, não como a clínica classifica aquilo. Se um dia a
    -- classificação também tiver de ser congelada, ela vira coluna de
    -- anamnesis_answer preenchida pela tr_freeze — e não um filtro aqui.
    'alerts', coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'code', q.code,
                 'question', ans.question_text,
                 'answer', ans.answer_label,
                 'detail', ans.detail_text
               ) order by q.sort_order, q.code
             )
        from public.anamnesis_answer ans
        join public.anamnesis_question q on q.id = ans.question_id
        join public.anamnesis_question_option o on o.id = ans.option_id
       where ans.anamnesis_id = a.id and o.is_alert
    ), '[]'::jsonb)
  )
  from public.anamnesis a
  where a.id = p_anamnesis;
$$;

comment on function private.anamnesis_record_json(uuid) is
  'Uma ficha respondida em jsonb (cabeçalho + respostas achatadas por código + '
  'alertas). SECURITY INVOKER de propósito: a RLS de anamnesis/anamnesis_answer '
  'continua valendo dentro dela, então quem chamar com o id de outra clínica '
  'recebe NULL em vez de prontuário alheio. Devolve NULL quando a ficha não '
  'existe — é o `null` que o serviço do front já espera.';

grant execute on function private.anamnesis_record_json(uuid) to authenticated;


create or replace function public.patient_anamnesis(p_patient uuid)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_clinic   uuid;
  v_template uuid;
  v_anamnese uuid;
  v_out      jsonb;
begin
  -- A RLS decide se este paciente é visível; not found aqui já é "sem acesso".
  select p.clinic_id into v_clinic from public.patient p where p.id = p_patient;
  if v_clinic is null then
    raise exception 'Paciente não encontrado ou sem acesso.' using errcode = '42501';
  end if;

  -- A ficha ATIVA. Fichas arquivadas ficam de fora: elas são o histórico, saem
  -- por patient_anamnesis_history() e não voltam para o formulário.
  select a.id, a.template_id into v_anamnese, v_template
    from public.anamnesis a
   where a.patient_id = p_patient and a.status = 'active';

  -- Sem ficha ABERTA (nunca teve, ou a última foi arquivada no retorno): devolve
  -- mesmo assim o questionário padrão VIGENTE, senão o front precisaria de uma
  -- segunda ida ao servidor só para desenhar o formulário vazio.
  if v_template is null then
    select t.id into v_template
      from public.anamnesis_template t
      join public.clinic c on c.id = t.clinic_id
     where t.clinic_id = v_clinic
       and t.specialty = c.specialty
       and t.is_default
       and t.status = 'active';
  end if;

  -- Tudo abaixo é subconsulta ESCALAR correlacionada (nada de subconsulta no
  -- FROM): o aninhamento seção → pergunta → opção sai em um único jsonb, na
  -- ordem de exibição, sem pivot no front.
  select jsonb_build_object(
    'patient_id', p_patient,
    'template', (
      select jsonb_build_object(
        'id', t.id,
        'name', t.name,
        'description', t.description,
        'specialty', t.specialty,
        'version', t.version,
        'sections', coalesce((
          select jsonb_agg(
                   jsonb_build_object(
                     'id', s.id,
                     'title', s.title,
                     'description', s.description,
                     'questions', coalesce((
                       select jsonb_agg(
                                jsonb_build_object(
                                  'id', q.id,
                                  'code', q.code,
                                  'question', q.question_text,
                                  'type', q.input_type,
                                  'detail_label', q.detail_label,
                                  'detail_shown_for', q.detail_shown_for,
                                  'options', coalesce((
                                    select jsonb_agg(
                                             jsonb_build_object(
                                               'id', o.id,
                                               'value', o.value,
                                               'label', o.label,
                                               'is_alert', o.is_alert
                                             ) order by o.sort_order, o.label
                                           )
                                      from public.anamnesis_question_option o
                                     where o.question_id = q.id
                                  ), '[]'::jsonb)
                                ) order by q.sort_order, q.code
                              )
                         from public.anamnesis_question q
                        where q.section_id = s.id
                          and q.status = 'active'
                     ), '[]'::jsonb)
                   ) order by s.sort_order, s.title
                 )
            from public.anamnesis_section s
           where s.template_id = v_template
        ), '[]'::jsonb)
      )
      from public.anamnesis_template t where t.id = v_template
    ),
    -- NULL quando o paciente não tem ficha ABERTA (nunca respondeu, ou a última
    -- foi arquivada) — é o `null` que anamnesisService.getPatientAnamnesis() já
    -- devolve hoje, e o front continua desenhando o formulário vazio.
    'record', private.anamnesis_record_json(v_anamnese),
    -- Quantas fichas fechadas existem. É o que diz à tela se há aba de histórico
    -- para oferecer, sem uma segunda chamada só para descobrir que não há
    -- nenhuma — que é o caso da esmagadora maioria dos pacientes.
    'archived_count', (
      select count(*)
        from public.anamnesis a
       where a.patient_id = p_patient and a.status = 'archived'
    )
  ) into v_out;

  return v_out;
end;
$$;

comment on function public.patient_anamnesis(uuid) is
  'Ficha ATIVA do paciente em UMA ida ao servidor: o questionário (seções → '
  'perguntas → opções) e, quando existir ficha aberta, as respostas já achatadas '
  'por código + os alertas clínicos + quantas fichas arquivadas o paciente tem. '
  'Substitui getPatientAnamnesis() do anamnesisService sem mudar a assinatura '
  'vista pela tela. O histórico sai por patient_anamnesis_history().';

revoke execute on function public.patient_anamnesis(uuid) from public;
grant execute on function public.patient_anamnesis(uuid) to authenticated;


create or replace function public.patient_anamnesis_history(p_patient uuid)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_clinic uuid;
  v_out    jsonb;
begin
  -- A RLS decide se este paciente é visível; not found aqui já é "sem acesso".
  select p.clinic_id into v_clinic from public.patient p where p.id = p_patient;
  if v_clinic is null then
    raise exception 'Paciente não encontrado ou sem acesso.' using errcode = '42501';
  end if;

  select coalesce(
           jsonb_agg(
             private.anamnesis_record_json(a.id)
             -- A ativa primeiro (false ordena antes de true), depois as fechadas
             -- da mais recente para a mais antiga. Ordenar só por data daria o
             -- mesmo resultado hoje — porque só se abre ficha nova depois de
             -- arquivar a anterior — mas por coincidência, não por regra.
             order by (a.status = 'archived'), a.created_at desc
           ),
           '[]'::jsonb
         )
    into v_out
    from public.anamnesis a
   where a.patient_id = p_patient;

  return jsonb_build_object('patient_id', p_patient, 'records', v_out);
end;
$$;

comment on function public.patient_anamnesis_history(uuid) is
  'TODAS as fichas do paciente — a ativa e as arquivadas —, cada uma com as '
  'respostas CONGELADAS da época (question_text/answer_label da própria linha, '
  'não o texto atual da pergunta). É o que sustenta a guarda legal do prontuário: '
  'a ficha de 2026 continua legível e imprimível depois de a clínica reescrever o '
  'questionário em 2029. Não devolve o template: ficha arquivada se lê pelo que '
  'foi congelado nela, e não pelo formulário de hoje.';

revoke execute on function public.patient_anamnesis_history(uuid) from public;
grant execute on function public.patient_anamnesis_history(uuid) to authenticated;


create or replace function public.save_anamnesis(p_patient uuid, p_answers jsonb)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_clinic   uuid;
  v_template uuid;
  v_anamnese uuid;
  v_code     text;
  v_entry    jsonb;
  v_value    text;
  v_detail   text;
  v_q        record;
  v_option   uuid;
  v_codes    text[] := '{}';
begin
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'p_answers deve ser um objeto jsonb {codigo: resposta}.' using errcode = '22023';
  end if;

  -- Payload VAZIO é recusado de propósito. Como esta função grava a ficha
  -- inteira, a varredura final (ver fim da função) apagaria TODAS as respostas
  -- silenciosamente — um estado que só um bug de front produz, e que zera um
  -- prontuário sem deixar erro. Quem quer mesmo esvaziar apaga a ficha; quem
  -- quer limpar uma resposta manda o campo com string vazia.
  if p_answers = '{}'::jsonb then
    raise exception 'Ficha vazia: envie ao menos uma resposta. Para limpar uma resposta, mande o campo em branco.'
      using errcode = '22023';
  end if;

  select p.clinic_id into v_clinic from public.patient p where p.id = p_patient;
  if v_clinic is null then
    raise exception 'Paciente não encontrado ou sem acesso.' using errcode = '42501';
  end if;

  -- ── A SEMÂNTICA DE "SALVAR", declarada aqui de propósito ───────────────────
  -- Salvar ATUALIZA a ficha ATIVA. Não cria versão nova: o formulário manda a
  -- ficha inteira a cada clique em Salvar, e versionar por chamada encheria o
  -- prontuário de cópias quase idênticas — histórico ilegível não é histórico.
  -- Ficha nova nasce quando NÃO HÁ ficha ativa, e isso acontece em dois casos:
  -- o paciente nunca respondeu, ou alguém arquivou a anterior com
  -- public.archive_anamnesis() — que é o ato explícito de "abrir a anamnese do
  -- retorno". A ficha arquivada nunca é alcançada por esta função.
  --
  -- Ficha já existente mantém o questionário com que nasceu (ver comment de
  -- anamnesis.template_id); ficha nova usa o padrão ativo do ramo da clínica —
  -- por isso a anamnese do retorno já vem com as perguntas de HOJE, sem tocar no
  -- que foi respondido antes.
  select a.id, a.template_id into v_anamnese, v_template
    from public.anamnesis a
   where a.patient_id = p_patient and a.status = 'active';

  if v_anamnese is null then
    select t.id into v_template
      from public.anamnesis_template t
      join public.clinic c on c.id = t.clinic_id
     where t.clinic_id = v_clinic
       and t.specialty = c.specialty
       and t.is_default
       and t.status = 'active';

    if v_template is null then
      raise exception 'A clínica não tem questionário de anamnese padrão configurado.'
        using errcode = '23503';
    end if;

    -- `filled_by` fica FORA da lista: esta função é SECURITY INVOKER e o papel
    -- `authenticated` não tem GRANT de coluna nele — quem preenche é o
    -- DEFAULT auth.uid().
    insert into public.anamnesis (clinic_id, patient_id, template_id)
    values (v_clinic, p_patient, v_template)
    returning id into v_anamnese;
  end if;
  -- Ficha já existente NÃO recebe UPDATE aqui: `updated_at` e `filled_by` são
  -- carimbados pela trigger tr_touch_parent quando uma resposta muda de fato —
  -- que é o que "revisada" significa. Abrir um UPDATE aqui exigiria dar ao
  -- cliente GRANT em filled_by (esta função é INVOKER), e é exatamente esse
  -- GRANT que permitiria assinar a ficha em nome de outro profissional.

  for v_code, v_entry in select e.key, e.value from jsonb_each(p_answers) as e loop
    -- Duas formas aceitas: {"medications": "yes"} e
    -- {"medications": {"value": "yes", "detail": "Losartana 50 mg"}}.
    if jsonb_typeof(v_entry) = 'object' then
      v_value  := v_entry ->> 'value';
      v_detail := nullif(btrim(coalesce(v_entry ->> 'detail', '')), '');
    else
      v_value  := nullif(v_entry #>> '{}', '');
      v_detail := null;
    end if;

    select q.id, q.input_type, q.question_text
      into v_q
      from public.anamnesis_question q
     where q.template_id = v_template and q.code = v_code;

    if not found then
      -- Erro alto e não silencioso: um código digitado errado no front viraria
      -- uma resposta perdida, e ninguém descobre resposta que sumiu.
      raise exception 'A pergunta "%" não existe no questionário desta clínica.', v_code
        using errcode = '23503';
    end if;

    v_codes := v_codes || v_code;

    -- Resposta em branco apaga a linha: é o paciente que pulou a pergunta, e
    -- deixar a anterior seria manter no prontuário algo que ninguém confirmou.
    if v_value is null or btrim(v_value) = '' then
      delete from public.anamnesis_answer
       where anamnesis_id = v_anamnese and question_id = v_q.id;
      continue;
    end if;

    v_option := null;
    if v_q.input_type = 'options' then
      select o.id into v_option
        from public.anamnesis_question_option o
       where o.question_id = v_q.id and o.value = v_value;

      if v_option is null then
        raise exception 'A resposta "%" não é uma opção válida da pergunta "%".', v_value, v_q.question_text
          using errcode = '23514';
      end if;
    end if;

    -- `question_text` fica FORA da lista de propósito: é coluna congelada, o
    -- cliente não tem GRANT nela, e a trigger tr_freeze (BEFORE) a preenche —
    -- o NOT NULL só é conferido depois das triggers BEFORE, então não estoura.
    insert into public.anamnesis_answer (
      clinic_id, anamnesis_id, template_id, question_id, option_id, text_value, detail_text
    ) values (
      v_clinic, v_anamnese, v_template, v_q.id, v_option,
      case when v_option is null then v_value else null end,
      v_detail
    )
    on conflict (anamnesis_id, question_id) do update
       set option_id   = excluded.option_id,
           text_value  = excluded.text_value,
           detail_text = excluded.detail_text;
  end loop;

  -- O formulário envia a ficha INTEIRA (saveAnamnesis substitui o registro).
  -- Pergunta que não veio no payload foi removida do questionário ou zerada —
  -- em qualquer dos casos não deve continuar respondida.
  delete from public.anamnesis_answer ans
   using public.anamnesis_question q
   where ans.anamnesis_id = v_anamnese
     and q.id = ans.question_id
     and not (q.code = any(v_codes));

  return v_anamnese;
end;
$$;

comment on function public.save_anamnesis(uuid, jsonb) is
  'Grava a ficha ATIVA INTEIRA numa transação — cria o cabeçalho quando não há '
  'ficha aberta, resolve cada código de pergunta, valida a opção escolhida e '
  'remove o que saiu do payload. NÃO versiona: salvar é REVISAR a ficha aberta, e '
  'abrir uma ficha nova é ato explícito de archive_anamnesis(). Fichas arquivadas '
  'são invisíveis para ela. Substitui saveAnamnesis() do anamnesisService: o '
  'front continua mandando um objeto achatado, sem saber que virou N linhas. '
  'Erra ALTO em código de pergunta ou valor de opção inválidos, em vez de gravar '
  'meia ficha.';

revoke execute on function public.save_anamnesis(uuid, jsonb) from public;
grant execute on function public.save_anamnesis(uuid, jsonb) to authenticated;


create or replace function public.archive_anamnesis(p_patient uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_clinic   uuid;
  v_anamnese uuid;
begin
  -- SECURITY DEFINER significa que a RLS de `patient` e de `anamnesis` NÃO roda
  -- aqui: as duas verificações que a policy faria estão refeitas à mão logo
  -- abaixo, e é por isso que a leitura do paciente vem primeiro (precisamos do
  -- clinic_id para conferir o tenant, e não podemos confiar nele antes disso).
  select p.clinic_id into v_clinic from public.patient p where p.id = p_patient;

  -- Mesma mensagem para "não existe" e "não é seu": responder coisas diferentes
  -- transformaria esta função em um verificador de existência de paciente de
  -- outra clínica.
  if v_clinic is null
     or not (v_clinic = any(private.auth_clinic_ids()))
     or not private.can_edit_feature(v_clinic, 'patients') then
    raise exception 'Paciente não encontrado ou sem acesso.' using errcode = '42501';
  end if;

  update public.anamnesis
     set status      = 'archived',
         archived_at = now()
   where patient_id = p_patient
     and clinic_id  = v_clinic
     and status     = 'active'
  returning id into v_anamnese;

  if v_anamnese is null then
    raise exception 'Este paciente não tem ficha de anamnese aberta para arquivar.'
      using errcode = 'P0002';
  end if;

  -- O UPDATE acima passa pela trigger tr_audit da tabela: quem fechou o
  -- prontuário e quando fica registrado no audit_log, que é o que a pergunta
  -- "por que a ficha de 2026 parou nesta data?" vai procurar.
  return v_anamnese;
end;
$$;

comment on function public.archive_anamnesis(uuid) is
  'FECHA a ficha ativa do paciente: marca status=''archived'', carimba '
  'archived_at e libera o slot do índice único parcial — a próxima chamada de '
  'save_anamnesis() abre uma ficha NOVA, com o questionário padrão vigente. É a '
  '"anamnese do retorno", e é ATO EXPLÍCITO de propósito: se salvar já '
  'arquivasse, cada clique em Salvar viraria uma versão e o histórico ficaria '
  'ilegível. Não tem volta pela API — desarquivar exigiria escrever em status, e '
  'esse GRANT não existe (ver seção 7). '
  'SECURITY DEFINER, a única RPC pública desta fatia que é: escrever `status` exigiria GRANT de '
  'UPDATE nessa coluna, e é justamente esse GRANT que permitiria a um PATCH no '
  'PostgREST reabrir um prontuário fechado. O preço é refazer à mão o que a RLS '
  'faria — tenant + feature ''patients'' com edição —, e está pago no corpo. '
  'Roda a partir de uma sessão de USUÁRIO: chamada com service_role, '
  'auth_clinic_ids() devolve ''{}'' e ela recusa (um job do servidor escreve na '
  'tabela direto, com responsabilidade própria).';

revoke execute on function public.archive_anamnesis(uuid) from public;
grant execute on function public.archive_anamnesis(uuid) to authenticated;


-- ═════════════════════════════════════════════════════════════════════════════
-- 10 · SEED DO QUESTIONÁRIO PADRÃO
--
-- Chamada pelo ONBOARDING (fatia de bootstrap), logo depois de criar a clínica.
-- O conteúdo é exatamente o de src/pages/Patients/Profile/Anamnesis/questions.ts
-- — modelo de prontuário sugerido pelos Conselhos Regionais de Odontologia —
-- com os mesmos códigos, os mesmos valores e os mesmos alertas de isAlert().
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function private.seed_anamnesis_template(
  p_clinic    uuid,
  p_specialty public.clinic_specialty
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_template uuid;
begin
  insert into public.anamnesis_template (clinic_id, specialty, name, description, is_default)
  values (
    p_clinic,
    p_specialty,
    case p_specialty
      when 'dentistry' then 'Anamnese odontológica'
      else 'Anamnese'
    end,
    case p_specialty
      when 'dentistry' then 'Questionário de saúde no modelo sugerido pelos Conselhos Regionais de Odontologia.'
      else 'Questionário de saúde. Ajuste as perguntas em Administrativo → Anamnese.'
    end,
    true
  )
  returning id into v_template;

  -- Só odontologia tem questionário pronto. Fisioterapia, nutrição, psicologia e
  -- personal trainer nascem com o questionário VAZIO de propósito: inventar
  -- perguntas clínicas de uma área que ninguém revisou é pior que não ter — a
  -- fatia de cada especialidade traz o seu conteúdo.
  if p_specialty <> 'dentistry' then
    return v_template;
  end if;

  insert into public.anamnesis_section (clinic_id, template_id, title, description, sort_order)
  values
    (p_clinic, v_template, 'Saúde geral',
     'Condições que interferem no atendimento, na anestesia e na cicatrização.', 10),
    (p_clinic, v_template, 'Saúde bucal',
     'Queixa, histórico odontológico e hábitos de higiene.', 20);

  insert into public.anamnesis_question (
    clinic_id, template_id, section_id, code, question_text, input_type,
    sort_order, detail_label, detail_shown_for
  )
  select p_clinic, v_template, s.id, q.code, q.question_text, q.input_type,
         q.sort_order, q.detail_label, q.detail_shown_for
    from (values
      ('Saúde geral', 'medications',       'Está tomando algum medicamento?',                  'options'::public.anamnesis_input_type,  10, 'Quais (posologia e dose)', array['yes']),
      ('Saúde geral', 'allergy',           'Tem algum tipo de alergia?',                       'options'::public.anamnesis_input_type,  20, 'Qual',                     array['yes']),
      ('Saúde geral', 'bloodPressure',     'Sua pressão é:',                                   'options'::public.anamnesis_input_type,  30, null::text,                 null::text[]),
      ('Saúde geral', 'heartCondition',    'Tem ou teve algum problema de coração?',           'options'::public.anamnesis_input_type,  40, 'Qual',                     array['yes']),
      ('Saúde geral', 'shortnessOfBreath', 'Sente falta de ar com frequência?',                'options'::public.anamnesis_input_type,  50, null::text,                 null::text[]),
      ('Saúde geral', 'diabetes',          'Tem diabetes?',                                    'options'::public.anamnesis_input_type,  60, null::text,                 null::text[]),
      ('Saúde geral', 'bleeding',          'Quando se corta, o sangramento é:',                'options'::public.anamnesis_input_type,  70, null::text,                 null::text[]),
      ('Saúde geral', 'healing',           'Sua cicatrização é:',                              'options'::public.anamnesis_input_type,  80, null::text,                 null::text[]),
      ('Saúde geral', 'surgery',           'Já fez alguma cirurgia?',                          'options'::public.anamnesis_input_type,  90, null::text,                 null::text[]),
      ('Saúde geral', 'pregnant',          'Gestante?',                                        'options'::public.anamnesis_input_type, 100, 'Semanas',                  array['yes']),
      ('Saúde geral', 'healthIssues',      'Problemas de saúde que já teve',                   'longText'::public.anamnesis_input_type, 110, null::text,                null::text[]),

      ('Saúde bucal', 'chiefComplaint',     'Queixa principal',                                       'longText'::public.anamnesis_input_type,  10, null::text, null::text[]),
      ('Saúde bucal', 'anesthesiaReaction', 'Já teve alguma reação com anestesia dental?',            'options'::public.anamnesis_input_type,   20, 'Qual',     array['yes']),
      ('Saúde bucal', 'lastTreatment',      'Quando foi seu último tratamento dentário?',             'text'::public.anamnesis_input_type,      30, null::text, null::text[]),
      ('Saúde bucal', 'toothGumPain',       'Tem sentido dor nos dentes ou na gengiva?',              'options'::public.anamnesis_input_type,   40, null::text, null::text[]),
      ('Saúde bucal', 'gumBleeding',        'Sua gengiva sangra?',                                    'options'::public.anamnesis_input_type,   50, null::text, null::text[]),
      ('Saúde bucal', 'badTasteDryMouth',   'Tem sentido gosto ruim na boca ou boca seca?',           'options'::public.anamnesis_input_type,   60, null::text, null::text[]),
      ('Saúde bucal', 'brushingsPerDay',    'Quantas vezes escova os dentes por dia?',                'text'::public.anamnesis_input_type,      70, null::text, null::text[]),
      ('Saúde bucal', 'flossing',           'Usa fio dental?',                                        'options'::public.anamnesis_input_type,   80, null::text, null::text[]),
      ('Saúde bucal', 'jawPainClicking',    'Sente dores ou estalos no maxilar ou no ouvido?',        'options'::public.anamnesis_input_type,   90, null::text, null::text[]),
      ('Saúde bucal', 'grindsTeeth',        'Range os dentes de dia ou de noite?',                    'options'::public.anamnesis_input_type,  100, null::text, null::text[]),
      ('Saúde bucal', 'faceSores',          'Já teve alguma ferida ou bolha na face ou nos lábios?',  'options'::public.anamnesis_input_type,  110, null::text, null::text[]),
      ('Saúde bucal', 'smokes',             'Fuma?',                                                  'options'::public.anamnesis_input_type,  120, 'Quantidade por dia', array['yes'])
    ) as q(section_title, code, question_text, input_type, sort_order, detail_label, detail_shown_for)
    join public.anamnesis_section s
      on s.template_id = v_template and s.title = q.section_title;

  -- Opções Sim/Não (YesNo do domain.ts) ---------------------------------------
  insert into public.anamnesis_question_option (clinic_id, question_id, value, label, sort_order)
  select p_clinic, q.id, o.value, o.label, o.sort_order
    from public.anamnesis_question q
    cross join (values ('yes', 'Sim', 10), ('no', 'Não', 20)) as o(value, label, sort_order)
   where q.template_id = v_template
     and q.code in (
       'medications', 'heartCondition', 'shortnessOfBreath', 'surgery',
       'anesthesiaReaction', 'toothGumPain', 'badTasteDryMouth',
       'jawPainClicking', 'grindsTeeth', 'faceSores', 'smokes'
     );

  -- Opções Sim/Não/Não sei (YesNoUnknown) -------------------------------------
  insert into public.anamnesis_question_option (clinic_id, question_id, value, label, sort_order)
  select p_clinic, q.id, o.value, o.label, o.sort_order
    from public.anamnesis_question q
    cross join (values ('yes', 'Sim', 10), ('no', 'Não', 20), ('unknown', 'Não sei', 30)) as o(value, label, sort_order)
   where q.template_id = v_template
     and q.code in ('allergy', 'diabetes', 'pregnant');

  -- Opções próprias de cada pergunta ------------------------------------------
  insert into public.anamnesis_question_option (clinic_id, question_id, value, label, sort_order)
  select p_clinic, q.id, o.value, o.label, o.sort_order
    from (values
      -- BloodPressure
      ('bloodPressure', 'normal',           'Normal',                      10),
      ('bloodPressure', 'high',             'Alta',                        20),
      ('bloodPressure', 'low',              'Baixa',                       30),
      ('bloodPressure', 'controlled',       'Controlada com medicamento',  40),
      -- BleedingLevel
      ('bleeding',      'normal',           'Normal',                      10),
      ('bleeding',      'excessive',        'Excessivo',                   20),
      -- HealingLevel
      ('healing',       'normal',           'Normal',                      10),
      ('healing',       'complicated',      'Complicada',                  20),
      -- GumBleeding
      ('gumBleeding',   'no',               'Não',                         10),
      ('gumBleeding',   'yes',              'Sim',                         20),
      ('gumBleeding',   'during_brushing',  'Durante a higiene',           30),
      ('gumBleeding',   'sometimes',        'Às vezes',                    40),
      -- FlossUse
      ('flossing',      'daily',            'Diariamente',                 10),
      ('flossing',      'sometimes',        'Às vezes',                    20),
      ('flossing',      'no',               'Não usa',                     30)
    ) as o(code, value, label, sort_order)
    join public.anamnesis_question q
      on q.template_id = v_template and q.code = o.code;

  -- Alertas clínicos — os mesmos pares da função isAlert() de questions.ts.
  update public.anamnesis_question_option o
     set is_alert = true
    from public.anamnesis_question q
   where q.id = o.question_id
     and q.template_id = v_template
     and (q.code, o.value) in (
       ('medications',        'yes'),
       ('allergy',            'yes'),
       ('heartCondition',     'yes'),
       ('diabetes',           'yes'),
       ('pregnant',           'yes'),
       ('bloodPressure',      'high'),
       ('bloodPressure',      'low'),
       ('bleeding',           'excessive'),
       ('healing',            'complicated'),
       ('anesthesiaReaction', 'yes')
     );

  return v_template;
end;
$$;

comment on function private.seed_anamnesis_template(uuid, public.clinic_specialty) is
  'Cria o questionário padrão da clínica. Chamar UMA vez no onboarding, na mesma '
  'transação que cria a clinic — sem ele, save_anamnesis() recusa a primeira '
  'ficha por falta de questionário padrão. SECURITY DEFINER porque o onboarding '
  'roda antes de existir clinic_user, então auth_clinic_ids() ainda devolve ''{}''.';

revoke execute on function private.seed_anamnesis_template(uuid, public.clinic_specialty) from public;


-- ═════════════════════════════════════════════════════════════════════════════
-- 11 · A ÚNICA FK QUE ATRAVESSA FATIA — aplicar DEPOIS de 07-comercial.sql
--
-- Há um CICLO entre esta fatia e a Comercial: `patient` precisa de
-- `insurance` (convênio do paciente) e `quote` precisa de `patient`. Um ciclo
-- não se resolve ordenando arquivos — resolve-se tirando UMA aresta do CREATE
-- TABLE e aplicando-a depois. É esta.
--
-- Por isso a coluna `patient.insurance_id` nasce sem FK: a tabela desta fatia
-- aplica sozinha, em qualquer ordem, e este ALTER único é o que quem montar a
-- sequência de migrations move para o fim. Se ele não rodar, o banco funciona —
-- só fica sem a garantia de integridade do convênio, o que é um problema
-- visível e corrigível, e não um deadlock de migration.
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.patient
  -- FK COMPOSTA e não simples: o convênio escolhido tem de ser da MESMA clínica
  -- do paciente. Uma FK só em insurance(id) aceitaria o convênio de outro tenant
  -- e vazaria o nome dele na ficha.
  --
  -- NO ACTION e não RESTRICT, pelo mesmo motivo da fundação em
  -- clinic_user.access_profile_id: os dois barram apagar um convênio em uso, mas
  -- RESTRICT confere NA HORA. Ao apagar uma clínica, o CASCADE remove
  -- `insurance` e `patient` na MESMA instrução, em ordem indefinida — com
  -- RESTRICT isso estouraria conforme a sorte do plano de execução.
  add constraint patient_insurance_fk
  foreign key (insurance_id, clinic_id)
  references public.insurance(id, clinic_id)
  on delete no action;


-- ═════════════════════════════════════════════════════════════════════════════
-- FIM DA FATIA DE PACIENTES
--
-- PENDURADO EM OUTRAS FATIAS (não declarado aqui de propósito — a dependência
-- anda em um sentido só):
--
--  · `public.insurance` (fatia COMERCIAL, 07-comercial.sql): a FK composta da
--    seção 11 só funciona porque aquela fatia declara `unique (id, clinic_id)`.
--    Mover aquele ALTER para depois de 60 na ordenação (o resto do arquivo é
--    independente e aplica em qualquer posição depois da fundação).
--
--  · `patient.last_visit` é escrita pela fatia de AGENDA, por trigger
--    SECURITY DEFINER quando um appointment vira status='completed'. Enquanto
--    essa trigger não existir, a coluna fica NULL para sempre (o cliente não tem
--    GRANT de UPDATE nela, e isso é intencional).
--
--  · `private.seed_anamnesis_template(clinic_id, specialty)` precisa entrar na
--    RPC de ONBOARDING, ao lado da criação dos access_profile padrão.
--
--  · O HISTÓRICO DE FICHAS pede duas coisas do front (`anamnesisService.ts` +
--    `AnamnesisTab.tsx`), que hoje só conhecem uma ficha por paciente:
--      1. uma ação "Arquivar e abrir nova anamnese" chamando
--         `archive_anamnesis(paciente)` — sem ela, o banco aceita histórico e
--         ninguém nunca cria o segundo registro;
--      2. a leitura do histórico por `patient_anamnesis_history(paciente)`,
--         oferecida quando `patient_anamnesis().archived_count > 0`.
--    Enquanto isso não existir, o comportamento visível é EXATAMENTE o de antes
--    (uma ficha ativa, salva e revisada no lugar) — a mudança é compatível.
-- ═════════════════════════════════════════════════════════════════════════════
