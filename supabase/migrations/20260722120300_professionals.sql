-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — 04 · PROFISSIONAIS E CURRÍCULO
--
-- Fatia do domain.ts: Professional, EducationItem, ExperienceItem,
--                     ProfessionalCommission (+ a SUBSTITUIÇÃO de Role).
--
-- Depende de: 01-fundacao.sql (clinic, profile, clinic_user, access_profile,
--             access_profile_permission, feature, plan, counter/next_code,
--             private.auth_clinic_ids(), private.tg_touch_updated_at(),
--             private.tg_set_code(), private.tg_audit()).
-- Não depende de nenhuma outra fatia do domínio: `professional` é REFERENCIADA
-- por agenda, tratamento, orçamento, prescrição e pagamento — nunca o contrário.
--
-- ── AS CINCO DECISÕES DESTA FATIA ───────────────────────────────────────────
--
-- A) `Role` NÃO VIRA TABELA. O conceito já existe na fundação, melhor resolvido:
--
--        domain.ts                    banco (fundação)
--        ─────────────────────────    ────────────────────────────────────────
--        Role.id / name               access_profile.id / name
--        Role.pages: AppPage[]        access_profile_permission
--                                       (feature_key, can_view, can_edit)
--
--    Duas razões para não duplicar. (1) `pages: AppPage[]` só sabe dizer "vê" —
--    não separa VER de EDITAR, e "a recepcionista abre o Financeiro mas não dá
--    baixa" é requisito, não refinamento. (2) A mesma `feature_key` é o que o
--    PLANO libera (plan_feature): uma tabela `role` paralela criaria um segundo
--    vocabulário de páginas que envelheceria em silêncio em relação ao catálogo.
--    Para o front continuar com a assinatura de `rolesService.listRoles()`, esta
--    fatia entrega a VIEW `public.role` (somente leitura) montando `pages` a
--    partir das permissões — ver seção 8.1.
--
-- B) CURRÍCULO: array de OBJETO vira tabela filha; array de ESCALAR vira text[].
--
--        education    → public.professional_education   (tabela filha)
--        experiences  → public.professional_experience  (tabela filha)
--        specializations / courses / languages → text[] na própria linha
--
--    A linha divisória é "o item tem atributos próprios e ordem própria?".
--    EducationItem e ExperienceItem têm 3 campos cada, precisam de ordenação
--    explícita (cronológica inversa) e um dia vão querer validação/anexo de
--    diploma — isso é entidade. Já "Endodontia", "Inglês" e "ACLS (2023)" são
--    rótulos: ninguém referencia o id de um idioma, o formulário salva a lista
--    inteira de uma vez, e três tabelas filhas a mais custariam 3 RLS + 3
--    triggers + 3 joins para devolver exatamente o mesmo array. `specializations`
--    ainda ganha índice GIN — filtrar "quem atende Endodontia" continua indexado.
--
-- C) COMISSÃO é tabela 1:1 SEPARADA, não colunas em `professional`. É dado de
--    REMUNERAÇÃO: tem outra permissão de leitura (Administrativo/Financeiro, não
--    Profissionais), outra trilha de auditoria e um estado próprio legítimo —
--    "sem comissão configurada" é a ausência da linha, não um punhado de NULLs.
--
-- D) O VÍNCULO usuário↔profissional (domain.ts UserProfile.professionalId) mora
--    aqui, como a fundação previu: `professional.user_id`. A FK é COMPOSTA
--    contra clinic_user — o login tem de ser membro DA MESMA clínica.
--
-- E) A PII DA EQUIPE É RESTRITA; O NOME E A COR, NÃO. `professional` guarda data
--    de nascimento, e-mail, telefone pessoal e endereço completo dos colegas.
--    A leitura da LINHA INTEIRA agora exige a feature 'professionals' — ou ser o
--    próprio profissional. Quem só tem 'schedule' continua montando a agenda
--    pela VIEW public.professional_directory, que expõe SEIS colunas
--    (id, clinic_id, name, color, specialty, status) e nada mais.
--    O desenho da view — e por que ela NÃO é security_invoker — está na seção 8.
--    A terceira porta para o mesmo dado é a TRILHA: `audit_log` guarda a linha
--    inteira em jsonb e é lida com a feature 'admin'. Por isso o tr_audit desta
--    tabela redige as onze colunas pessoais (seção 9) — restringir a tabela e
--    deixar o log aberto seria trocar a fechadura e esquecer a janela.
-- ═════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · ENUMS DA FATIA
--
-- Só valem para comissão, então nascem aqui e não na fundação. Valores idênticos
-- aos literais do domain.ts — nada traduzido, nada inventado.
-- ─────────────────────────────────────────────────────────────────────────────

create type public.commission_type as enum ('percentage', 'fixed');
comment on type public.commission_type is
  'domain.ts CommissionType. percentage = % sobre a base; fixed = R$ por procedimento.';

create type public.commission_base as enum ('received', 'performed');
comment on type public.commission_base is
  'domain.ts CommissionBase. received = comissiona sobre o que o paciente PAGOU '
  '(protege o fluxo de caixa); performed = sobre a produção realizada, mesmo sem '
  'recebimento. A escolha muda o mês inteiro do repasse — por isso é dado, não '
  'convenção de código.';

create type public.commission_payout as enum ('fixed_day', 'per_visit');
comment on type public.commission_payout is
  'domain.ts CommissionPayout. fixed_day = fecha e paga no dia do mês '
  '(commission.payout_day); per_visit = paga a cada atendimento.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · HELPER IMUTÁVEL PARA AS LISTAS DE TEXTO
--
-- Usado nos CHECK de specializations/courses/languages. Uma função em vez de
-- três expressões copiadas: a regra ("sem NULL, sem vazio, com teto") fica em um
-- lugar só e o CHECK continua legível.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function private.is_clean_text_array(p_values text[], p_max integer)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_values is not null
     -- Elemento NULL dentro do array é a armadilha clássica: some da UI, mas
     -- quebra `= any()`, `array_to_string()` e a serialização do front.
     and pg_catalog.array_position(p_values, null) is null
     -- COALESCE não é função: é construção da linguagem, não se qualifica com
     -- schema (e por isso não depende do search_path travado acima).
     and coalesce(pg_catalog.array_length(p_values, 1), 0) <= p_max
     and not exists (
       select 1 from pg_catalog.unnest(p_values) as t(v) where pg_catalog.btrim(t.v) = ''
     );
$$;

comment on function private.is_clean_text_array(text[], integer) is
  'Lista de rótulos saudável: não nula, sem elemento NULL, sem string em branco e '
  'dentro de um teto de cardinalidade. IMMUTABLE porque é usada em CHECK — não lê '
  'tabela nem depende de configuração.';

revoke execute on function private.is_clean_text_array(text[], integer) from public;
grant execute on function private.is_clean_text_array(text[], integer) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · PROFESSIONAL — o cadastro (domain.ts Professional)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.professional (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinic(id) on delete cascade,
  code            text not null,
  -- Login correspondente. Nulável: a maioria dos profissionais é cadastrada pela
  -- recepção muito antes (ou sem nunca) receber acesso ao sistema.
  user_id         uuid,

  name            text not null,
  specialty       text not null,
  description     text,
  rating          numeric(2,1),
  license         text not null,
  color           public.hex_color,
  status          public.active_status not null default 'active',

  -- Dados pessoais (mesmo bloco do cadastro de paciente).
  sex             public.gender,
  birth_date      date,
  email           public.email_address,
  phone           public.phone_digits,
  whatsapp        public.phone_digits,

  -- Endereço.
  cep             public.cep_digits,
  state           public.uf,
  city            text,
  neighborhood    text,
  street          text,
  number          text,

  -- Currículo escalar (ver decisão B no cabeçalho).
  specializations text[] not null default '{}',
  courses         text[] not null default '{}',
  languages       text[] not null default '{}',

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint professional_code_uk unique (clinic_id, code),
  -- Alvo das FKs compostas das tabelas filhas: é o que impede um item de
  -- currículo da clínica A ser pendurado num profissional da clínica B.
  constraint professional_id_clinic_uk unique (id, clinic_id),

  -- O login tem de TER VÍNCULO com ESTA clínica. Sem a FK composta, bastaria um
  -- uuid qualquer de profile para ligar o perfil de um profissional a alguém de
  -- fora do tenant.
  --
  -- CORRIGIDO (comentário estava errado): a FK aponta para a LINHA de
  -- clinic_user, não para o status dela — um vínculo `invited` ou `suspended`
  -- também satisfaz. E está certo assim: quem filtra por status é
  -- private.auth_clinic_ids() (exige 'active'), então um suspenso continua com o
  -- cadastro ligado ao seu login e volta a enxergar tudo no dia em que o vínculo
  -- for reativado — sem alguém ter de refazer o link.
  --
  -- `on delete set null (user_id)` (lista de colunas, PG 15+): quando o vínculo
  -- com a clínica é removido, some o acesso — o CADASTRO do profissional fica,
  -- porque agenda e prontuário histórico apontam para ele. Sem a lista de
  -- colunas, o SET NULL tentaria zerar `clinic_id` também e estouraria o NOT NULL.
  constraint professional_user_fk
    foreign key (clinic_id, user_id)
    references public.clinic_user (clinic_id, user_id)
    on delete set null (user_id),

  constraint professional_name_not_blank_ck      check (btrim(name) <> ''),
  constraint professional_specialty_not_blank_ck check (btrim(specialty) <> ''),
  constraint professional_license_not_blank_ck   check (btrim(license) <> ''),
  constraint professional_rating_ck              check (rating is null or rating between 0 and 5),
  -- Limites fixos (e não `current_date`): CHECK exige expressão IMMUTABLE.
  -- "Não pode ser futura" é validação de formulário, não de integridade.
  constraint professional_birth_date_ck
    check (birth_date is null or birth_date between date '1900-01-01' and date '2100-12-31'),
  constraint professional_specializations_ck check (private.is_clean_text_array(specializations, 40)),
  constraint professional_courses_ck         check (private.is_clean_text_array(courses, 60)),
  constraint professional_languages_ck       check (private.is_clean_text_array(languages, 15))
);

comment on table public.professional is
  'Profissional que atende na clínica (domain.ts Professional). Referenciado por '
  'agenda, tratamento, orçamento, prescrição e pagamento — NUNCA é apagado: sai '
  'de circulação com status=''inactive'' (não há policy de DELETE, ver seção 9). '
  'CONTÉM PII DA EQUIPE (nascimento, e-mail, telefone, endereço): a leitura exige '
  'a feature ''professionals'' ou ser o próprio profissional. Quem só precisa de '
  'nome/cor/especialidade lê public.professional_directory.';
comment on column public.professional.code is
  'Referência humana sequencial por clínica (PRO-000001), preenchida pela trigger '
  'tr_code. O client não tem GRANT de INSERT nesta coluna: código é do banco.';
comment on column public.professional.user_id is
  'domain.ts UserProfile.professionalId, visto do outro lado. É o que faz o '
  'usuário logado abrir "meu perfil", ver a PRÓPRIA agenda e a PRÓPRIA comissão. '
  'Fora do GRANT de UPDATE de propósito: ligar/desligar login é ato de '
  'Administrativo e passa pela RPC public.link_professional_user().';
comment on column public.professional.specialty is
  'Especialidade EXIBIDA ("Clínica Geral", "Endodontia") — texto livre, como no '
  'domain.ts. NÃO confundir com clinic.specialty, que é o ramo do produto '
  '(enum clinic_specialty) e define quais telas de prontuário existem.';
comment on column public.professional.license is
  'Conselho + número (CRM/SE 12345, CRO/SE 4567, CREFITO-16 78901). É a chave '
  'natural da pessoa: o índice único abaixo compara ignorando pontuação e caixa.';
comment on column public.professional.rating is
  'Nota média de atendimento (0–5). Hoje é valor ARMAZENADO porque ainda não '
  'existe tabela de avaliação; fica fora do GRANT de UPDATE para não virar campo '
  'editável à mão — quando houver avaliações, passa a ser recalculado.';
comment on column public.professional.color is
  'Cor de identificação na agenda e nos gráficos (#RRGGBB). É o que distingue '
  'dois profissionais na mesma coluna de horário.';
comment on column public.professional.status is
  'inactive = não aparece em listas nem em seleção de agenda, e LIBERA a vaga do '
  'plano (ver private.tg_professional_seat_limit).';
comment on column public.professional.street is
  'Logradouro. O formulário atual (PersonalDataForm) ainda não coleta — como o '
  'restante do endereço já está aqui, a coluna nasce junto para não obrigar uma '
  'migration quando a tela ganhar o campo.';
comment on column public.professional.specializations is
  'Áreas de atuação (chips do currículo). text[] e não tabela filha: são rótulos '
  'sem atributos próprios, sempre salvos em bloco pelo formulário de currículo. '
  'Filtro "quem atende X" continua indexado — ver o índice GIN abaixo.';
comment on column public.professional.courses is 'Cursos e certificações (rótulos livres, exibição apenas).';
comment on column public.professional.languages is 'Idiomas atendidos (rótulos livres).';

-- Caminho quente da lista: sempre por clínica, quase sempre filtrando status e
-- ordenando por nome.
create index professional_clinic_status_name_idx on public.professional (clinic_id, status, name);
-- Busca por nome digitado (prefixo/ordenação case-insensitive).
create index professional_clinic_name_idx on public.professional (clinic_id, lower(name));
-- Filtro por especialidade na página de Profissionais e no seletor da agenda.
create index professional_clinic_specialty_idx on public.professional (clinic_id, lower(specialty));
-- "Quais profissionais atendem Endodontia?" — `specializations @> array['Endodontia']`.
create index professional_specializations_idx on public.professional using gin (specializations);
-- Índice da FK user_id + regra: um login é, no máximo, UM profissional na clínica.
create unique index professional_user_uk
  on public.professional (clinic_id, user_id) where user_id is not null;
create index professional_email_idx
  on public.professional (clinic_id, lower(email)) where email is not null;

-- Chave natural: a mesma pessoa não se cadastra duas vezes na mesma clínica.
-- Normalizado porque "CRM/SE 12345", "CRM-SE 12345" e "crm se 12345" são o mesmo
-- registro no conselho e seriam três linhas distintas num unique ingênuo.
create unique index professional_license_uk
  on public.professional (clinic_id, upper(regexp_replace(license, '[^a-zA-Z0-9]', '', 'g')));

comment on index public.professional_license_uk is
  'Duplicidade de profissional é erro caro: a agenda fica dividida entre dois '
  'cadastros e a comissão sai pela metade em cada um.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · CURRÍCULO — tabelas filhas (arrays de OBJETO)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.professional_education (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinic(id) on delete cascade,
  professional_id uuid not null,
  course          text not null,
  institution     text not null,
  year            smallint,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- CASCADE: currículo não existe sem o profissional. Como o profissional nunca
  -- é apagado (vira inactive), na prática isto só dispara quando a clínica
  -- inteira é removida pela plataforma.
  constraint professional_education_professional_fk
    foreign key (professional_id, clinic_id)
    references public.professional (id, clinic_id)
    on delete cascade,

  constraint professional_education_course_not_blank_ck      check (btrim(course) <> ''),
  constraint professional_education_institution_not_blank_ck check (btrim(institution) <> ''),
  constraint professional_education_year_ck check (year is null or year between 1900 and 2200)
);

comment on table public.professional_education is
  'Formação acadêmica (domain.ts EducationItem). Tabela filha e não jsonb: cada '
  'item tem campos estáveis, ordem própria e é o candidato natural a ganhar '
  'validação de diploma/anexo — o que jsonb tornaria arqueologia.';
comment on column public.professional_education.year is
  'Ano de conclusão como NÚMERO (o domain.ts usa string "2019" por ser mock). '
  'Assim "ordem cronológica inversa" é ORDER BY de verdade e não ordenação '
  'alfabética disfarçada. NULL = em curso — aparece primeiro (nulls first).';
comment on column public.professional_education.sort_order is
  'Ordem escolhida no formulário. Existe porque o currículo é vitrine: o dono '
  'decide o que fica no topo, mesmo com anos empatados.';

create index professional_education_professional_idx
  on public.professional_education (clinic_id, professional_id, sort_order, year desc);


create table public.professional_experience (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinic(id) on delete cascade,
  professional_id uuid not null,
  position        text not null,
  workplace       text not null,
  period          text not null,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint professional_experience_professional_fk
    foreign key (professional_id, clinic_id)
    references public.professional (id, clinic_id)
    on delete cascade,

  constraint professional_experience_position_not_blank_ck  check (btrim(position) <> ''),
  constraint professional_experience_workplace_not_blank_ck check (btrim(workplace) <> ''),
  constraint professional_experience_period_not_blank_ck    check (btrim(period) <> '')
);

comment on table public.professional_experience is
  'Passagens profissionais (domain.ts ExperienceItem).';
comment on column public.professional_experience.period is
  'Período como TEXTO LIVRE ("2019 – atual"), espelhando o domain.ts. Foi uma '
  'escolha, não descuido: é rótulo de vitrine e ninguém filtra por ele. No dia em '
  'que a tela quiser "12 anos de experiência", entram start_year/end_year e este '
  'campo vira derivado.';
comment on column public.professional_experience.sort_order is
  'Ordem de exibição definida no formulário — `period` é texto e não ordena sozinho.';

create index professional_experience_professional_idx
  on public.professional_experience (clinic_id, professional_id, sort_order);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5 · PROFESSIONAL_COMMISSION — a regra de repasse (1:1 opcional)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.professional_commission (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinic(id) on delete cascade,
  professional_id uuid not null,
  type            public.commission_type not null,
  amount          numeric(12,2) not null,
  base            public.commission_base not null default 'received',
  payout          public.commission_payout not null,
  payout_day      smallint,
  status          public.active_status not null default 'active',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Uma regra por profissional: `commissionsService.saveCommission()` é upsert
  -- pela chave professional_id, e duas regras simultâneas seria a mesma
  -- ambiguidade que faz repasse sair errado.
  constraint professional_commission_uk unique (professional_id),

  constraint professional_commission_professional_fk
    foreign key (professional_id, clinic_id)
    references public.professional (id, clinic_id)
    on delete cascade,

  constraint professional_commission_amount_ck check (amount > 0),
  -- Percentual não passa de 100: comissão maior que a receita é erro de digitação
  -- que só aparece no fechamento do mês.
  constraint professional_commission_percentage_ck
    check (type <> 'percentage' or amount <= 100),
  -- payout_day existe SE E SOMENTE SE o repasse é em dia fixo. Sem a bicondicional,
  -- sobra "dia 5" pendurado numa regra por atendimento — e alguém vai lê-lo.
  constraint professional_commission_payout_day_ck
    check ((payout = 'fixed_day') = (payout_day is not null)),
  -- 1–28: dia 29/30/31 não existe em todo mês e viraria repasse fantasma em fevereiro.
  constraint professional_commission_payout_day_range_ck
    check (payout_day is null or payout_day between 1 and 28)
);

comment on table public.professional_commission is
  'Regra de comissão do profissional (domain.ts ProfessionalCommission), aba '
  'Comissões do Administrativo. Tabela separada de `professional` porque é dado '
  'de REMUNERAÇÃO: leitura restrita (admin/financeiro ou o próprio), auditada, e '
  'com um estado legítimo de ausência — "sem comissão configurada" é não existir '
  'a linha, não um bloco de NULLs no cadastro.';
comment on column public.professional_commission.amount is
  'Percentual (0–100) quando type=''percentage''; R$ por procedimento quando '
  '''fixed''. numeric(12,2) cru em vez do domínio money_brl de propósito: metade '
  'das linhas NÃO é dinheiro, e nomear o tipo errado engana quem lê depois.';
comment on column public.professional_commission.base is
  'Sobre o que incide. received = só o que entrou no caixa; performed = tudo que '
  'foi realizado. É a diferença entre pagar comissão de uma parcela que o '
  'paciente ainda não pagou ou não.';
comment on column public.professional_commission.status is
  'inactive = regra suspensa sem perder o histórico (o acerto do mês passado '
  'continua explicável).';

create index professional_commission_clinic_idx
  on public.professional_commission (clinic_id, status);
-- professional_commission_uk (unique em professional_id) já serve de índice da FK.


-- ─────────────────────────────────────────────────────────────────────────────
-- 6 · REGRA DE PLANO — vagas de profissional
--
-- `plan.included_professionals` é vendido ("seu plano inclui 3 profissionais") e
-- a tela de Assinatura já mostra professionalsInUse. Se a regra viver só na UI,
-- ela vale até o primeiro POST direto na API.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function private.count_active_professionals(p_clinic uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
    from public.professional p
   where p.clinic_id = p_clinic
     and p.status = 'active';
$$;

comment on function private.count_active_professionals(uuid) is
  'Vagas de profissional em uso na clínica — o professionalsInUse da tela de '
  'Assinatura. SECURITY DEFINER para contar a clínica inteira mesmo quando o '
  'usuário não tem a feature ''professionals'' (o número é dado de assinatura, '
  'não de cadastro). NÃO é usada pela trigger de limite: lá a contagem precisa '
  'de snapshot novo — ver o comentário em private.tg_professional_seat_limit().';

-- CORRIGIDO (vazamento entre clínicas): sem este REVOKE a função ficava com o
-- EXECUTE padrão de PUBLIC e, como a fundação dá `usage on schema private to
-- authenticated`, QUALQUER usuário logado podia chamar
-- `private.count_active_professionals('<uuid de outra clínica>')` — SECURITY
-- DEFINER, sem nenhuma checagem de tenant — e medir o tamanho da equipe de um
-- concorrente. Não há GRANT de volta: só o dono a executa (a trigger e a RPC
-- pública, ambas SECURITY DEFINER, rodam como dono).
revoke execute on function private.count_active_professionals(uuid) from public;


create or replace function private.tg_professional_seat_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer;
  v_used  integer;
  v_plan  text;
begin
  -- Só INSERT ativo ou transição inactive→active consomem vaga. Editar o
  -- telefone de quem já está ativo não pode esbarrar em limite.
  if new.status <> 'active' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'active' then
    return new;
  end if;

  select pl.included_professionals, pl.key
    into v_limit, v_plan
    from public.clinic c
    join public.plan pl on pl.key = c.plan_key
   where c.id = new.clinic_id;

  if v_limit is null then          -- plano ilimitado
    return new;
  end if;

  -- Serializa a contagem POR CLÍNICA: sem isto, duas ativações simultâneas leem
  -- "2 de 3" ao mesmo tempo e a clínica termina com 4 vagas ocupadas pagando 3.
  -- O lock é por transação e cadastrar profissional é operação rara — o custo
  -- de contenção é praticamente zero.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('professional_seat:' || new.clinic_id::text, 0)
  );

  -- A contagem é INLINE, e não private.count_active_professionals(): aquela é
  -- STABLE e herdaria o snapshot do statement — o snapshot de ANTES do lock,
  -- que é exatamente o instante em que o concorrente ainda não tinha commitado.
  -- Esta função é VOLATILE, então este SELECT abre snapshot novo (read
  -- committed) e enxerga quem acabou de entrar. Lock sem snapshot novo é
  -- cerimônia.
  select count(*)::integer
    into v_used
    from public.professional p
   where p.clinic_id = new.clinic_id
     and p.status = 'active';

  if v_used >= v_limit then
    raise exception
      'O plano "%" inclui % profissional(is) ativo(s) e a clínica já tem %. '
      'Inative um profissional ou faça upgrade do plano.',
      v_plan, v_limit, v_used
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function private.tg_professional_seat_limit() is
  'BEFORE INSERT OR UPDATE em professional: impede ultrapassar '
  'plan.included_professionals. Mesma filosofia de tg_clinic_specialty_entitled '
  'na fundação — direito de plano é regra de banco, não de tela.';

revoke execute on function private.tg_professional_seat_limit() from public;


create or replace function public.professionals_in_use(p_clinic uuid default null)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_clinic uuid := coalesce(p_clinic, private.auth_clinic_id());
begin
  if v_clinic is null or not (v_clinic = any(private.auth_clinic_ids())) then
    raise exception 'Sem acesso a esta clínica.' using errcode = '42501';
  end if;
  return private.count_active_professionals(v_clinic);
end;
$$;

comment on function public.professionals_in_use(uuid) is
  'RPC para domain.ts Subscription.professionalsInUse — o número que a tela de '
  'Assinatura compara com includedProfessionals.';

revoke execute on function public.professionals_in_use(uuid) from public;
grant execute on function public.professionals_in_use(uuid) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7 · RPC — ligar/desligar o login do profissional
--
-- `user_id` fica FORA do GRANT de UPDATE porque ligar um login a um profissional
-- é ato de permissão, não de cadastro: quem tiver essa linha passa a ler a
-- comissão daquele profissional (policy "o próprio vê a própria"). Quem edita
-- Profissionais não deveria conseguir se auto-apontar; quem administra, sim.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.link_professional_user(p_professional uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_clinic uuid;
begin
  select p.clinic_id into v_clinic
    from public.professional p
   where p.id = p_professional;

  if v_clinic is null or not (v_clinic = any(private.auth_clinic_ids())) then
    raise exception 'Profissional não encontrado nesta clínica.' using errcode = '42501';
  end if;

  if not private.can_edit_feature(v_clinic, 'admin') then
    raise exception 'Sem permissão para vincular usuários a profissionais.' using errcode = '42501';
  end if;

  -- p_user null desfaz o vínculo. A FK composta professional_user_fk é quem
  -- garante que o usuário informado é membro DESTA clínica.
  --
  -- CORRIGIDO: as duas checagens abaixo existiam só como constraint, e o erro
  -- que chegava na tela era "23503 violates foreign key constraint
  -- professional_user_fk" / "23505 duplicate key value violates unique
  -- constraint professional_user_uk". Continuam sendo a garantia real (a
  -- constraint é quem vence a corrida entre dois admins); aqui é só o erro
  -- legível para o caminho normal.
  if p_user is not null then
    if not exists (
      select 1 from public.clinic_user cu
       where cu.clinic_id = v_clinic and cu.user_id = p_user
    ) then
      raise exception 'Este usuário não tem vínculo com a clínica — convide-o antes de ligá-lo a um profissional.'
        using errcode = '23503';
    end if;

    if exists (
      select 1 from public.professional p
       where p.clinic_id = v_clinic
         and p.user_id = p_user
         and p.id <> p_professional
    ) then
      raise exception 'Este login já está ligado a outro profissional desta clínica.'
        using errcode = '23505';
    end if;
  end if;

  update public.professional
     set user_id = p_user
   where id = p_professional;
end;
$$;

comment on function public.link_professional_user(uuid, uuid) is
  'Liga (ou desliga, com p_user null) o login ao cadastro do profissional — '
  'domain.ts UserProfile.professionalId. Exige can_edit_feature(''admin'').';

revoke execute on function public.link_professional_user(uuid, uuid) from public;
grant execute on function public.link_professional_user(uuid, uuid) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 8 · AS DUAS VIEWS DESTA FATIA
--
-- 8.1 public.role                 — compatibilidade com domain.ts Role
-- 8.2 public.professional_directory — nome/cor para quem NÃO tem 'professionals'
--
-- As duas são SOMENTE LEITURA, e as duas resolvem problemas opostos: `role`
-- REMONTA um formato antigo; `professional_directory` REDUZ um formato novo.
-- Repare que elas usam modos de segurança DIFERENTES, e isso é deliberado —
-- o porquê está escrito em 8.2.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 8.1 · public.role ────────────────────────────────────────────────────────
--
-- NÃO é tabela: é a leitura de access_profile + access_profile_permission no
-- formato que `rolesService.listRoles()` já espera ({id, clinic_id, name,
-- pages}). Existe para o front migrar sem reescrever a aba Cargos de uma vez;
-- a ESCRITA continua sendo nas tabelas da fundação, onde can_view e can_edit são
-- coisas diferentes.
--
-- security_invoker = true: a view NÃO empresta privilégio: a RLS de
-- access_profile é avaliada com o papel de quem consulta.
-- ─────────────────────────────────────────────────────────────────────────────

create view public.role
with (security_invoker = true) as
select
  ap.id,
  ap.clinic_id,
  ap.name,
  coalesce(
    array_agg(perm.feature_key order by f.sort_order)
      filter (where perm.can_view and f.category = 'module'),
    '{}'::text[]
  ) as pages
from public.access_profile ap
left join public.access_profile_permission perm on perm.access_profile_id = ap.id
left join public.feature f on f.key = perm.feature_key
where ap.status = 'active'
group by ap.id, ap.clinic_id, ap.name;

comment on view public.role is
  'SOMENTE LEITURA. Traduz access_profile + access_profile_permission para o '
  'formato domain.ts Role (pages: AppPage[]). Filtra category=''module'' porque '
  'AppPage é exatamente o conjunto de features de módulo — specialty_* e add-ons '
  'não são páginas. Perde a distinção ver/editar de propósito: quem precisa dela '
  'lê access_profile_permission direto.';

-- CORRIGIDO: o REVOKE só citava `anon`. O Supabase aplica
-- `alter default privileges in schema public grant all on tables to anon,
-- authenticated, service_role`, então a view nascia com INSERT/UPDATE/DELETE
-- concedidos a `authenticated` também. Hoje isso não explode só porque a view
-- tem GROUP BY (não é auto-updatable) — no dia em que alguém simplificar a
-- consulta, a escrita passaria a valer e o cargo viraria editável por fora das
-- tabelas da fundação, onde can_view/can_edit são coisas diferentes.
revoke all on public.role from anon, authenticated;
grant select on public.role to authenticated;


-- ── 8.2 · public.professional_directory ──────────────────────────────────────
--
-- O PROBLEMA. A partir desta versão, `professional_select` exige a feature
-- 'professionals' (ou ser o próprio) — porque a linha carrega data de
-- nascimento, e-mail, telefone e endereço residencial. Só que a AGENDA precisa
-- do nome e da cor de TODO MUNDO, e quem opera a agenda tem 'schedule', não
-- 'professionals'. Sem uma saída, a recepcionista volta a ver colunas de
-- horário anônimas.
--
-- POR QUE `security_invoker` NÃO RESOLVE, POR MAIS QUE PAREÇA O CERTO.
-- Com `security_invoker = on` a view herda a RLS da base: a recepcionista
-- consultaria a view e receberia ZERO linhas, exatamente como se consultasse a
-- tabela. Para consertar isso seria preciso uma policy de SELECT na BASE que
-- liberasse a linha para qualquer membro da clínica — e policy é filtro de
-- LINHA, não de COLUNA. Policies permissivas se somam com OR: a nova liberaria
-- a linha INTEIRA de novo, na tabela, para todo mundo. Voltaríamos ao vazamento
-- que esta mudança existe para fechar. Não há ordem de policies que salve isso;
-- o mecanismo simplesmente não enxerga colunas.
--
-- A ALTERNATIVA DE COLUNA TAMBÉM NÃO SERVE SOZINHA (comparação pedida):
-- `grant select (id, clinic_id, name, color, specialty, status) on professional
-- to authenticated` é privilégio de COLUNA — e privilégio é por PAPEL, não por
-- permissão. Todo mundo é o mesmo papel `authenticated`. Recortar a tabela
-- assim cegaria TAMBÉM quem TEM a feature: a página Profissionais e a aba Dados
-- Pessoais parariam de ler e-mail, telefone e endereço, para sempre e para
-- todos. "Feature-holder vê tudo, o resto vê seis colunas" é uma distinção
-- DINÂMICA, e GRANT de coluna é ESTÁTICO. Por isso o GRANT de SELECT da tabela
-- continua completo (seção 10) e quem recorta por permissão é a RLS (seção 11)
-- somada a esta view.
--
-- A ESCOLHA: view **SECURITY DEFINER** (o padrão do Postgres — `security_invoker`
-- fica de fora de propósito) com o filtro de tenant ESCRITO NA PRÓPRIA VIEW.
-- Rodando como a dona (postgres, que não tem `force row level security` — ver a
-- nota da seção 15 da fundação), a view passa por cima da RLS de `professional`.
-- Isso é seguro AQUI, e só aqui, porque:
--
--   1. A LISTA DE COLUNAS é fechada e não tem nada sensível. Não existe `select
--      *`: birth_date, sex, email, phone, whatsapp, cep, state, city,
--      neighborhood, street, number, license, description, rating, user_id e
--      code NÃO estão na projeção. O que sai daqui é o que a agenda desenha.
--   2. O TENANT é filtrado na própria view. Ao contornar a RLS, a view assume a
--      obrigação que era dela: sem este `where`, `professional_directory` seria
--      um diretório GLOBAL de todas as clínicas do SaaS.
--   3. `security_barrier = true` impede o vazamento clássico de view: sem ele,
--      o planejador pode empurrar um predicado do usuário (uma função não
--      LEAKPROOF, um `text` que estoura com o valor na mensagem de erro) para
--      DENTRO da view e avaliá-lo ANTES do filtro de clínica — o que revelaria
--      nomes de profissionais de outros tenants. Custa um plano menos agressivo
--      e compra a única garantia que faltava.
--   4. O GRANT é só SELECT. A view é simples o bastante para ser
--      AUTO-ATUALIZÁVEL, e escrita por uma view SECURITY DEFINER chegaria na
--      tabela SEM passar pela RLS. O `revoke all` abaixo é o que fecha isso — e
--      é obrigatório, porque o `alter default privileges ... grant all on
--      tables to authenticated` do Supabase concede INSERT/UPDATE/DELETE em toda
--      view nova. (Mesma armadilha já documentada em 8.1.)
--
-- CONSEQUÊNCIA CONHECIDA: o linter do Supabase acusa `security_definer_view`
-- nesta view. É achado esperado, não descuido — a view É a fronteira de
-- segurança, e os quatro itens acima são o que a sustenta. Quem for alterar esta
-- view: NÃO acrescente coluna sem reler o item 1, e NÃO remova o `where` do
-- item 2.
--
-- Linhas INATIVAS entram de propósito: a agenda de março ainda mostra a consulta
-- de quem saiu da clínica em abril, e sem o nome/cor a grade histórica quebra.
-- Por isso `status` está na projeção — filtrar "quem posso agendar HOJE" é
-- decisão da tela, não desta view.
-- ─────────────────────────────────────────────────────────────────────────────

create view public.professional_directory
with (security_barrier = true) as
select
  p.id,
  p.clinic_id,
  p.name,
  p.color,
  p.specialty,
  p.status
from public.professional p
where p.clinic_id = any(private.auth_clinic_ids());

comment on view public.professional_directory is
  'SOMENTE LEITURA. O mínimo de `professional` que a agenda, os seletores e os '
  'gráficos precisam (nome, cor, especialidade, status), visível para QUALQUER '
  'membro da clínica — inclusive quem não tem a feature ''professionals'' e, '
  'portanto, não lê a tabela. É SECURITY DEFINER de propósito (contorna a RLS da '
  'base) e por isso filtra o tenant no próprio corpo; a proteção da PII é a '
  'LISTA DE COLUNAS, não a RLS. Ler dado pessoal de profissional é sempre na '
  'tabela public.professional.';

-- Sem estes REVOKEs a view nasceria gravável por `authenticated` (default
-- privileges do Supabase) — e escrita por view SECURITY DEFINER não passa pela
-- RLS da tabela base. Ver item 4 acima.
revoke all on public.professional_directory from anon, authenticated;
grant select on public.professional_directory to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 9 · TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

-- Código humano PRO-000001 (prefixo reservado no cabeçalho da fundação).
create trigger tr_code before insert on public.professional
  for each row when (new.code is null)
  execute function private.tg_set_code('professional', 'PRO');

create trigger tr_seat_limit before insert or update of status on public.professional
  for each row execute function private.tg_professional_seat_limit();

create trigger tr_touch before update on public.professional
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.professional_education
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.professional_experience
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.professional_commission
  for each row execute function private.tg_touch_updated_at();

-- Auditoria onde a pergunta "quem mudou isso?" aparece: o cadastro (inclusive
-- status e vínculo de login) e a regra de remuneração. Currículo fica de fora —
-- é vitrine editada em bloco, viraria ruído que esconde o que importa.
--
-- CORRIGIDO — A RESTRIÇÃO DE PII DA SEÇÃO 11 VAZAVA INTEIRA PELA TRILHA.
-- `private.tg_audit()` grava `to_jsonb(new)` / `to_jsonb(old)` da LINHA INTEIRA
-- em `public.audit_log`, e `audit_log_select` (fundação, seção 15) pede a
-- feature **'admin'** — NÃO 'professionals'. Sem redigir, um cargo com 'admin' e
-- sem 'professionals' — exatamente o caso que a seção 11 declara que deixa de
-- ler a PII — pedia `GET /audit_log?table_name=eq.professional` e recebia
-- nascimento, sexo, e-mail, telefone e endereço residencial de toda a equipe,
-- com histórico de versões de brinde. A policy nova valeria só para quem não
-- soubesse o caminho mais curto.
--
-- A redação por argumento é a ferramenta que a própria fundação previu para
-- isto e que `whatsapp_connection` já usa para o QR (09-saas.sql): as colunas
-- saem do snapshot ANTES do insert. Redigir é melhor do que apertar
-- `audit_log_select`, porque o dado pessoal nunca chega a existir no log —
-- `service_role`, backup, export e restore não passam por policy nenhuma.
--
-- CUSTO ACEITO: `tg_audit` calcula `changed_fields` DEPOIS de redigir, então um
-- UPDATE que mexe SÓ em coluna redigida não vira linha (sobra
-- changed_fields = {updated_at}, que a função descarta de propósito). "Quem
-- trocou o telefone do Dr. X" deixa de ter resposta; "quem inativou", "quem
-- ligou o login", "quem mudou o CRO" continuam tendo — que é o que esta trilha
-- existe para responder. Se um dia o telefone precisar de trilha, o conserto é
-- em `private.tg_audit()` (calcular changed_fields antes da redação, mantendo o
-- valor fora), não aqui — e aí ele vale para todas as fatias de uma vez.
create trigger tr_audit after insert or update or delete on public.professional
  for each row execute function private.tg_audit(
    'sex', 'birth_date', 'email', 'phone', 'whatsapp',
    'cep', 'state', 'city', 'neighborhood', 'street', 'number'
  );
-- Comissão NÃO é redigida: `professional_commission_select` já exige 'admin' ou
-- 'finance', e `audit_log_select` exige 'admin'. A trilha aqui é mais estreita
-- que a tabela, não mais larga — que é a invariante que a redação acima repõe.
create trigger tr_audit after insert or update or delete on public.professional_commission
  for each row execute function private.tg_audit();


-- ─────────────────────────────────────────────────────────────────────────────
-- 10 · PRIVILÉGIOS DE COLUNA
--
-- RLS escolhe LINHAS; GRANT escolhe COLUNAS. Aqui isso importa porque a linha
-- é legitimamente do usuário — o que não pode é ele mexer em certas colunas.
-- (Ordem obrigatória: REVOKE de tabela antes do GRANT de coluna.)
--
-- POR QUE O **SELECT** DE `professional` CONTINUA INTEIRO (e a PII mesmo assim
-- não vaza): GRANT é por PAPEL e todo cliente logado é o mesmo `authenticated`.
-- Recortar o SELECT em colunas cegaria igualmente quem TEM a feature
-- 'professionals' — a página Profissionais deixaria de ler e-mail, telefone e
-- endereço, que é exatamente o trabalho dela. A restrição de PII é por
-- PERMISSÃO, não por papel, então ela mora na RLS (seção 11) e a exceção da
-- agenda mora na view public.professional_directory (seção 8.2).
--
-- CORRIGIDO: TRUNCATE entrou em todos os REVOKE. O `alter default privileges
-- ... grant all on tables` do Supabase inclui TRUNCATE, e **TRUNCATE NÃO PASSA
-- PELA RLS**: uma única instrução apagaria a tabela inteira, de TODAS as
-- clínicas. Hoje o PostgREST não expõe TRUNCATE, mas privilégio que só não é
-- explorado porque o cliente atual não sabe pedir não é privilégio seguro.
-- ─────────────────────────────────────────────────────────────────────────────

revoke insert, update, delete, truncate on public.professional from anon, authenticated;
-- Defesa em profundidade, mesma lógica do REVOKE de professional_commission no
-- fim desta seção: agora que a tabela é reconhecidamente PII da equipe, `anon`
-- não depende só de "não existe policy para anon" para ficar de fora.
revoke select on public.professional from anon;

grant insert (
  id, clinic_id, name, specialty, description, license, color, status,
  sex, birth_date, email, phone, whatsapp,
  cep, state, city, neighborhood, street, number,
  specializations, courses, languages
) on public.professional to authenticated;

grant update (
  name, specialty, description, license, color, status,
  sex, birth_date, email, phone, whatsapp,
  cep, state, city, neighborhood, street, number,
  specializations, courses, languages
) on public.professional to authenticated;
-- Fora das duas listas, de propósito:
--   code    → é do banco (trigger); deixar o client mandar é abrir mão da sequência.
--   user_id → escalada de privilégio; passa pela RPC link_professional_user().
--   rating  → nota de atendimento, não campo de formulário (ver comentário da coluna).
--   clinic_id no UPDATE → mudar de tenant é criar outro registro, e registro se
--                         cria com INSERT (que a auditoria enxerga como tal).
-- DELETE não é concedido a ninguém: profissional inativa, não some. O histórico
-- de agenda, tratamento e pagamento aponta para ele.

revoke insert, update, delete, truncate on public.professional_education from anon, authenticated;
grant insert (clinic_id, professional_id, course, institution, year, sort_order)
  on public.professional_education to authenticated;
grant update (course, institution, year, sort_order)
  on public.professional_education to authenticated;
grant delete on public.professional_education to authenticated;

revoke insert, update, delete, truncate on public.professional_experience from anon, authenticated;
grant insert (clinic_id, professional_id, position, workplace, period, sort_order)
  on public.professional_experience to authenticated;
grant update (position, workplace, period, sort_order)
  on public.professional_experience to authenticated;
grant delete on public.professional_experience to authenticated;
-- Currículo é editado em bloco (o formulário substitui a lista inteira), então
-- DELETE aqui é operação normal — diferente do cadastro. `professional_id` sai
-- do UPDATE: mover um item de currículo entre pessoas é sempre engano.

revoke insert, update, delete, truncate on public.professional_commission from anon, authenticated;
grant insert (clinic_id, professional_id, type, amount, base, payout, payout_day, status, notes)
  on public.professional_commission to authenticated;
grant update (type, amount, base, payout, payout_day, status, notes)
  on public.professional_commission to authenticated;
grant delete on public.professional_commission to authenticated;

-- Defesa em profundidade: `anon` nem SELECT tem em remuneração. A RLS já barraria
-- (não há policy para anon), mas dado de salário não depende de uma camada só.
revoke select on public.professional_commission from anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- 11 · RLS
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.professional            enable row level security;
alter table public.professional_education  enable row level security;
alter table public.professional_experience enable row level security;
alter table public.professional_commission enable row level security;

-- Helper de propriedade. Nasce aqui, e não na seção 2, por duas razões: só a RLS
-- o usa, e ele lê `public.professional` — que só existe a partir da seção 3
-- (com check_function_bodies ligado, criá-lo antes falharia).
--
-- SECURITY DEFINER de propósito: usado DENTRO de uma policy, um `exists` cru
-- sobre `professional` seria ele mesmo filtrado pela RLS de `professional`, e a
-- policy passaria a depender da ordem em que o planejador resolve o OR. Assim a
-- pergunta "este cadastro é o MEU?" tem sempre a mesma resposta, venha de onde
-- vier. Não vaza nada: responde apenas sobre o vínculo de QUEM PERGUNTA — para
-- qualquer id que não seja o seu, a resposta é `false`, sem revelar se o id
-- sequer existe.
create or replace function private.is_own_professional(p_professional uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.professional p
     where p.id = p_professional
       and p.user_id = (select auth.uid())
  );
$$;

comment on function private.is_own_professional(uuid) is
  'O cadastro de profissional pertence ao usuário logado? (professional.user_id '
  '= auth.uid()). É o "ou o próprio" das policies de PII e de comissão — o que '
  'deixa alguém abrir o SEU perfil e a SUA regra de repasse sem ter a feature '
  '''professionals'' nem ''admin''.';

revoke execute on function private.is_own_professional(uuid) from public;
grant execute on function private.is_own_professional(uuid) to authenticated;

-- ── professional ─────────────────────────────────────────────────────────────
-- LEITURA RESTRITA (mudou — antes era só de tenant).
--
-- A linha inteira carrega birth_date, sex, email, phone, whatsapp e o endereço
-- residencial completo. Enquanto a policy era só `clinic_id = any(...)`,
-- QUALQUER membro da clínica — estagiário, recepção, o colega da sala ao lado —
-- lia a data de nascimento e o telefone pessoal de todo mundo com um único
-- GET /professional. A justificativa de então ("a agenda precisa do nome e da
-- cor") era verdadeira, mas pagava com a ficha inteira por duas colunas.
--
-- Agora são dois caminhos, e só dois:
--   · quem tem a feature 'professionals' (é a página que existe para isso);
--   · o PRÓPRIO profissional, para abrir o seu perfil — comparação direta em
--     `user_id`, sem subconsulta: o valor está na linha que está sendo avaliada.
--
-- E a agenda? Continua funcionando por public.professional_directory (seção
-- 8.2), que entrega id, clinic_id, name, color, specialty e status para
-- qualquer membro da clínica. Quem só tem 'schedule' NÃO perde nada do que
-- desenhava — perde o acesso ao que nunca deveria ler.
--
-- NOTA PARA O FRONT (o único ponto que exige mudança de código): toda consulta
-- que só quer nome/cor/especialidade — seletor da agenda, legenda de gráfico,
-- embed do PostgREST em appointment/quote_item/billed_treatment — tem de
-- apontar para `professional_directory`. Apontar para `professional` volta
-- vazio para quem não tem a feature, e volta vazio em SILÊNCIO (RLS não é erro,
-- é ausência de linha).
--
-- OBSERVAÇÃO SOBRE 'admin': um cargo com 'admin' mas SEM 'professionals' passa
-- a não ler a PII pela tabela (lê nome e cor pela view, que é o que a aba
-- Comissões desenha). Se a intenção do dono for que Administrativo também veja
-- dado pessoal, a mudança é acrescentar 'admin' na chamada abaixo — a forma da
-- policy não muda.
-- E não lê pela TRILHA tampouco: `audit_log_select` pede 'admin', então o
-- tr_audit desta tabela redige as colunas pessoais (seção 9). Sem aquela
-- redação esta policy seria decorativa justamente para quem tem 'admin' — a
-- porta estreita ao lado de uma porta larga não protege nada.
create policy professional_select on public.professional
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and (
      private.can_access_feature(clinic_id, 'professionals')
      or user_id = (select auth.uid())
    )
  );

create policy professional_insert on public.professional
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'professionals')
  );

create policy professional_update on public.professional
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'professionals')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));
-- Sem policy de DELETE (e sem o GRANT correspondente): ver seção 10.

-- ── currículo ────────────────────────────────────────────────────────────────
-- MESMA LEITURA DO CADASTRO — e isso agora quer dizer restrita. As duas tabelas
-- filhas ACOMPANHAM a mudança da policy do pai, por coerência e por conteúdo:
-- currículo só é desenhado dentro do perfil do profissional (que vive sob a
-- feature 'professionals') e a agenda nunca o consulta, então apertar aqui não
-- quebra tela nenhuma. Deixá-las abertas enquanto o pai fecha seria pior do que
-- inconsistente: "formado em X em 2003" e "trabalhou em Y de 1998 a 2006" são o
-- caminho mais curto para a idade que birth_date acabou de parar de contar.
-- A escrita não muda (aba Currículo, feature 'professionals').
create policy professional_education_select on public.professional_education
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and (
      private.can_access_feature(clinic_id, 'professionals')
      or private.is_own_professional(professional_id)
    )
  );

create policy professional_education_insert on public.professional_education
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'professionals')
  );

create policy professional_education_update on public.professional_education
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'professionals')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy professional_education_delete on public.professional_education
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'professionals')
  );

create policy professional_experience_select on public.professional_experience
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and (
      private.can_access_feature(clinic_id, 'professionals')
      or private.is_own_professional(professional_id)
    )
  );

create policy professional_experience_insert on public.professional_experience
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'professionals')
  );

create policy professional_experience_update on public.professional_experience
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'professionals')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy professional_experience_delete on public.professional_experience
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'professionals')
  );

-- ── comissão ─────────────────────────────────────────────────────────────────
-- Leitura RESTRITA: quem administra (aba Comissões) ou o Financeiro (fecha o
-- repasse) — e o PRÓPRIO profissional, que precisa ver a regra na aba Ganhos do
-- seu perfil. Colega nenhum enxerga o percentual do outro.
--
-- CORRIGIDO junto com a restrição de PII: o "ou o próprio" era um `exists` cru
-- sobre `public.professional`. Subconsulta dentro de policy TAMBÉM passa pela
-- RLS da tabela consultada — enquanto `professional_select` era só de tenant
-- isso era invisível, mas agora a resposta dependeria da policy do pai, que por
-- sua vez chama can_access_feature. Trocado por private.is_own_professional(),
-- que é SECURITY DEFINER: a leitura da PRÓPRIA comissão não fica pendurada em
-- quem pode ler o cadastro. (Um profissional sem 'admin', sem 'finance' e sem
-- 'professionals' continua abrindo a sua aba Ganhos — que é o caso comum.)
create policy professional_commission_select on public.professional_commission
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and (
      private.can_access_feature(clinic_id, 'admin', 'finance')
      or private.is_own_professional(professional_id)
    )
  );

create policy professional_commission_insert on public.professional_commission
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

create policy professional_commission_update on public.professional_commission
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy professional_commission_delete on public.professional_commission
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );


-- ═════════════════════════════════════════════════════════════════════════════
-- FIM DA FATIA · PROFISSIONAIS
--
-- CONTRATO PARA AS OUTRAS FATIAS (quem referenciar profissional, siga isto):
--
--   professional_id uuid not null           -- ou null, quando o domínio permite
--   constraint <tabela>_professional_fk
--     foreign key (professional_id, clinic_id)
--     references public.professional (id, clinic_id)
--     on delete no action                   -- agenda/tratamento/pagamento: o
--                                           -- histórico não pode ficar órfão;
--                                           -- profissional inativa, não apaga.
--
--   CORRIGIDO — o contrato dizia `on delete restrict` e isso QUEBRA a exclusão
--   da clínica. Os dois barram apagar um profissional que ainda tem histórico,
--   mas RESTRICT confere NA HORA e NO ACTION confere no fim do statement. Ao
--   apagar uma clínica (service_role), o CASCADE de clinic remove `professional`
--   e `appointment` na MESMA instrução, em ordem indefinida: com RESTRICT o
--   DELETE estoura ou não conforme a sorte do plano de execução. É exatamente o
--   raciocínio que a fundação já registrou em clinic_user_access_profile_fk.
--   VERIFICADO NA CONSOLIDAÇÃO: 05-agenda.sql, 06-clinico.sql, 07-comercial.sql
--   e 08-financeiro.sql seguem o contrato — todas as cinco referências a
--   `professional` são COMPOSTAS (professional_id, clinic_id) contra
--   professional_id_clinic_uk, e todas com ON DELETE NO ACTION. Não sobrou
--   nenhuma FK simples. A forma simples aceitaria um profissional de outro
--   tenant, e a RLS da tabela FILHA não perceberia — ela só olha o próprio
--   clinic_id.
--
--   Onde o domínio deixa o profissional opcional (Prescription.professionalId,
--   TreatmentSession.professionalId, QuoteItem.professionalId), a coluna é
--   nulável e o ON DELETE continua no action: opcional na criação ≠ descartável
--   depois.
--
-- LEITURA (novo, junto com a restrição de PII): a FK continua apontando para a
-- TABELA — integridade não é leitura. Mas quem só quer EXIBIR o profissional
-- (nome na consulta, cor na grade, "executado por" no orçamento e no
-- billed_treatment) deve consultar a VIEW public.professional_directory. A
-- tabela `professional` só devolve linha para quem tem a feature
-- ''professionals'' ou é o próprio profissional; para os demais o join/embed
-- volta VAZIO, sem erro. Regra prática: FK → tabela; SELECT de exibição → view.
-- ═════════════════════════════════════════════════════════════════════════════
