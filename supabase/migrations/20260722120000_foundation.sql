-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — 01 · FUNDAÇÃO (multi-tenant, acesso, entitlement, código humano,
--                            auditoria)
--
-- Banco alvo: Supabase / PostgreSQL 17 · projeto "neosaude" (VAZIO).
-- Este arquivo é a PRIMEIRA migration. Não é idempotente de propósito: se rodar
-- duas vezes, ele quebra alto — é o comportamento desejado numa migration 01.
--
-- ── O CONTRATO QUE AS OUTRAS FATIAS SEGUEM ──────────────────────────────────
--
-- 1. TENANT: `clinic` É o tenant. Não existe empresa/filial. TODA tabela do
--    domínio carrega `clinic_id uuid not null references public.clinic(id)`,
--    mesmo quando daria para chegar nela por join — a policy fica direta e
--    barata, e um join a menos é um vazamento a menos.
--
-- 2. PK: `id uuid primary key default gen_random_uuid()` em todas as tabelas.
--
-- 3. NOMES: tabela em inglês, SINGULAR, snake_case. Coluna em snake_case.
--    O domínio TypeScript é camelCase — a conversão é do service no front.
--
-- 4. RLS: obrigatório em toda tabela. A forma da policy é SEMPRE
--        using (clinic_id = any(private.auth_clinic_ids()))
--    Nunca compare `clinic_id` com um escalar: a função é a costura que permite
--    evoluir (usuário em 2 clínicas, suporte, impersonation) sem reescrever 60
--    policies.
--
-- 5. TEMPO: `created_at`/`updated_at timestamptz not null default now()`, com
--    trigger `private.tg_touch_updated_at()` no updated_at. Data de verdade é
--    `date`; hora de verdade é `time`; momento é `timestamptz`. O 'dd/mm/aaaa'
--    do domain.ts é formatação de tela, não tipo de banco.
--
-- 6. DINHEIRO: `numeric(12,2)` (domínio `public.money_brl`). Nunca float.
--
-- 7. TEXTO COM MÁSCARA (cpf, cnpj, cep, telefone): o banco guarda SÓ DÍGITOS,
--    via os domínios `cpf_digits`, `cnpj_digits`, `cep_digits`, `phone_digits`.
--    Máscara é apresentação — quem mascara é o front. Isso torna busca,
--    unicidade e integração (WhatsApp, boleto, NF) possíveis.
--
-- 8. CÓDIGO HUMANO ("PAC-000042"): nunca calcule max()+1 na aplicação (corrida
--    garantida em recepção com 3 atendentes). Use:
--        create trigger tr_code before insert on public.patient
--          for each row when (new.code is null)
--          execute function private.tg_set_code('patient', 'PAC');
--    Chaves/prefixos reservados (mantenha esta tabela como fonte única):
--        patient      → PAC     professional → PRO     quote     → ORC
--        payment      → PAG     prescription → REC     payable   → CTP
--        receivable   → CTR     invoice      → FAT     user      → NS
--
-- 9. AUDITORIA: tabela sensível ganha
--        create trigger tr_audit after insert or update or delete on <tabela>
--          for each row execute function private.tg_audit();
--    (opcionalmente com colunas a redigir: `private.tg_audit('senha','token')`).
--
-- 10. PERMISSÃO E PLANO COMPARTILHAM A MESMA CHAVE (`feature_key`). Ver uma tela
--     exige as DUAS coisas: o plano da clínica liberar a feature (plan_feature)
--     E o cargo do usuário permitir (access_profile_permission). Uma chave só,
--     dois portões — é por isso que `private.can_access_feature()` faz o join
--     dos dois lados e o front não precisa saber a diferença.
-- ═════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 0 · EXTENSÕES E SCHEMA PRIVADO
-- ─────────────────────────────────────────────────────────────────────────────

-- gen_random_uuid() já é nativo no PG 13+; a extensão fica só como garantia
-- para quem restaurar este dump em um servidor mais antigo.
create extension if not exists pgcrypto with schema extensions;

-- `private` guarda os helpers de autorização e os corpos de trigger. PostgREST
-- só expõe os schemas configurados (public/graphql_public), então nada daqui
-- vira endpoint. O `authenticated` recebe USAGE porque as EXPRESSÕES DE POLICY
-- rodam com o papel de quem consulta — sem USAGE, toda policy falharia.
create schema if not exists private;

comment on schema private is
  'Helpers de autorização e corpos de trigger. NUNCA exposto via API (PostgREST '
  'só publica public/graphql_public). Só recebe EXECUTE o que policy precisa.';

revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · DOMÍNIOS — os tipos-contrato reutilizados por TODAS as fatias
--
-- Domínio em vez de CHECK repetido: a regra fica em UM lugar, o nome do tipo
-- documenta a intenção na definição da coluna, e uma fatia nova não tem como
-- inventar um formato divergente de CPF.
-- ─────────────────────────────────────────────────────────────────────────────

create domain public.uf as char(2)
  check (value in (
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB',
    'PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
  ));
comment on domain public.uf is 'Unidade federativa (sigla oficial de 2 letras).';

create domain public.cep_digits as text
  check (value ~ '^[0-9]{8}$');
comment on domain public.cep_digits is 'CEP somente dígitos (8). A máscara 00000-000 é do front.';

create domain public.cpf_digits as text
  check (value ~ '^[0-9]{11}$');
comment on domain public.cpf_digits is 'CPF somente dígitos (11). Validação de dígito verificador fica no front/edge.';

create domain public.cnpj_digits as text
  check (value ~ '^[0-9]{14}$');
comment on domain public.cnpj_digits is 'CNPJ somente dígitos (14).';

create domain public.phone_digits as text
  check (value ~ '^[0-9]{10,13}$');
comment on domain public.phone_digits is
  'Telefone somente dígitos: 10–11 (fixo/celular BR sem DDI) ou 12–13 (com DDI 55). '
  'Faixa larga de propósito — o WhatsApp guarda com DDI, a agenda guarda sem.';

create domain public.email_address as text
  check (value ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');
comment on domain public.email_address is 'E-mail com validação de formato mínima (não normaliza caixa).';

create domain public.money_brl as numeric(12,2);
comment on domain public.money_brl is
  'Dinheiro em reais. numeric(12,2) — nunca float: 0.1+0.2 não pode virar '
  'divergência de caixa. Sem CHECK de sinal aqui porque estorno/ajuste é negativo; '
  'cada tabela declara o próprio CHECK (ex.: amount > 0).';

create domain public.hex_color as text
  check (value ~ '^#[0-9A-Fa-f]{6}$');
comment on domain public.hex_color is 'Cor de identificação (agenda, gráficos) no formato #RRGGBB.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · ENUMS COMPARTILHADOS
--
-- Só entram aqui os enums que ATRAVESSAM fatias. Enum de uma fatia só
-- (payment_status, appointment_status…) nasce no arquivo da própria fatia.
-- Os valores são exatamente os literais do domain.ts — nada traduzido,
-- nada inventado.
-- ─────────────────────────────────────────────────────────────────────────────

create type public.clinic_specialty as enum (
  'dentistry', 'physiotherapy', 'nutrition', 'psychology', 'personal_training'
);
comment on type public.clinic_specialty is
  'Ramo da clínica (domain.ts ClinicSpecialty). Define as telas específicas do '
  'prontuário — o resto do app é igual entre os ramos.';

create type public.active_status as enum ('active', 'inactive');
comment on type public.active_status is
  'domain.ts ActiveStatus. Registro inativo some das listas mas NÃO é apagado: '
  'histórico clínico e financeiro apontam para ele.';

create type public.gender as enum ('male', 'female');
comment on type public.gender is 'domain.ts Gender. Sexo biológico dos cadastros (paciente, profissional, responsável).';

create type public.clinic_status as enum ('active', 'suspended', 'canceled');
comment on type public.clinic_status is
  'Situação da clínica NA PLATAFORMA (não confundir com a assinatura). '
  'suspended = inadimplência/bloqueio: corta o acesso sem apagar um byte. '
  'canceled = churn. Só `active` passa por private.auth_clinic_ids().';

create type public.membership_status as enum ('invited', 'active', 'suspended');
comment on type public.membership_status is
  'Situação do vínculo usuário↔clínica. `invited` = convite enviado, ainda não '
  'aceito (já ocupa a vaga do plano); `suspended` = desligado sem perder a '
  'trilha de auditoria. Só `active` autoriza.';

create type public.audit_action as enum ('insert', 'update', 'delete');
comment on type public.audit_action is 'Operação registrada no audit_log (espelha TG_OP em minúsculas).';


-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · TRIGGER GENÉRICA DE updated_at
--    (definida cedo porque toda tabela abaixo já a usa)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function private.tg_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function private.tg_touch_updated_at() is
  'BEFORE UPDATE em toda tabela: mantém updated_at honesto mesmo quando o client '
  'esquece de mandá-lo (ou mente sobre ele).';

revoke execute on function private.tg_touch_updated_at() from public;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · CATÁLOGO DA PLATAFORMA — feature, plan, plan_feature
--
-- Estas três tabelas NÃO têm clinic_id: são catálogo global da plataforma,
-- iguais para todo mundo. Todo usuário autenticado lê (é a tabela de preços e
-- o mapa de módulos); só a plataforma escreve (via service_role).
-- ─────────────────────────────────────────────────────────────────────────────

create table public.feature (
  key         text primary key,
  label       text not null,
  category    text not null,
  is_addon    boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint feature_key_format_ck check (key ~ '^[a-z][a-z0-9_]*$'),
  constraint feature_label_not_blank_ck check (btrim(label) <> '')
);

comment on table public.feature is
  'Catálogo de funcionalidades. É a CHAVE ÚNICA que liga os dois portões: o '
  'plano libera (plan_feature) e o cargo permite (access_profile_permission). '
  'Uma chave nova é criada aqui ANTES de aparecer em qualquer um dos dois.';
comment on column public.feature.key is
  'Chave estável usada no código do front (mesmos valores de AppPage em '
  'domain.ts: dashboard, schedule, patients, professionals, finance, admin, '
  'settings) + chaves de especialidade (specialty_*) e de add-on.';
comment on column public.feature.category is
  'Agrupamento de exibição: module | specialty | integration. Texto e não enum '
  'de propósito — categoria é rótulo de vitrine, muda com o marketing, e não '
  'quero uma migration para lançar uma categoria nova.';
comment on column public.feature.is_addon is
  'true = vendido à parte, não vem no plano base (ex.: WhatsApp).';

create index feature_category_idx on public.feature (category, sort_order);


create table public.plan (
  key                    text primary key,
  label                  text not null,
  monthly_price          public.money_brl not null,
  yearly_price           public.money_brl,
  included_professionals integer,
  sort_order             integer not null default 0,
  status                 public.active_status not null default 'active',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint plan_key_format_ck check (key ~ '^[a-z][a-z0-9_]*$'),
  constraint plan_monthly_price_ck check (monthly_price >= 0),
  constraint plan_yearly_price_ck check (yearly_price is null or yearly_price >= 0),
  constraint plan_included_professionals_ck
    check (included_professionals is null or included_professionals > 0)
);

comment on table public.plan is
  'Planos comercializados. Catálogo da plataforma — a clínica aponta para um '
  '(clinic.plan_key) e é DAÍ que sai o direito de uso.';
comment on column public.plan.included_professionals is
  'Vagas de profissional incluídas no preço. NULL = ilimitado. É este número que '
  'a tela de Assinatura compara com professionalsInUse.';
comment on column public.plan.status is
  'inactive = plano descontinuado: some da vitrine, mas quem já está nele continua '
  'funcionando (por isso NÃO se apaga plano).';


create table public.plan_feature (
  id          uuid primary key default gen_random_uuid(),
  plan_key    text not null references public.plan(key) on update cascade on delete cascade,
  feature_key text not null references public.feature(key) on update cascade on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint plan_feature_uk unique (plan_key, feature_key)
);

comment on table public.plan_feature is
  'O que cada plano libera. ON DELETE CASCADE no plano (apagou o plano, some a '
  'grade dele); ON DELETE RESTRICT na feature (não deixo apagar uma feature que '
  'algum plano vende — isso derrubaria clínicas em produção sem aviso).';

create index plan_feature_feature_idx on public.plan_feature (feature_key);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5 · CLINIC — O TENANT. A raiz de tudo.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.clinic (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  cnpj          public.cnpj_digits,
  email         public.email_address,
  phone         public.phone_digits,
  logo_url      text,
  specialty     public.clinic_specialty not null,
  plan_key      text not null references public.plan(key) on update cascade on delete restrict,
  status        public.clinic_status not null default 'active',
  -- Endereço (domain.ts: ClinicData extends Address). Nulável porque a clínica
  -- existe (e já pode operar) antes de alguém abrir o Administrativo e
  -- completar o cadastro.
  cep           public.cep_digits,
  state         public.uf,
  city          text,
  neighborhood  text,
  street        text,
  number        text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint clinic_name_not_blank_ck check (btrim(name) <> '')
);

comment on table public.clinic is
  'O TENANT. Um nível só: não existe empresa/filial/rede. Todo dado do domínio '
  'aponta para cá por clinic_id, e é esse id que a RLS confere.';
comment on column public.clinic.specialty is
  'Ramo de atuação. A clínica NÃO escolhe o próprio ramo: o valor tem de estar '
  'liberado pelo plano (feature specialty_<valor>) — garantido pela trigger '
  'tr_clinic_specialty_entitled e pelo GRANT de coluna (a clínica não tem '
  'UPDATE nesta coluna).';
comment on column public.clinic.plan_key is
  'Plano contratado — FONTE DA VERDADE do direito de uso. ON DELETE RESTRICT: '
  'nenhum plano some com clínica dentro. A fatia de Assinatura guarda o '
  'faturamento (ciclo, próxima cobrança, faturas); o ENTITLEMENT é só isto aqui.';
comment on column public.clinic.cnpj is 'Somente dígitos. Único na plataforma — o mesmo CNPJ não abre duas clínicas.';
comment on column public.clinic.logo_url is 'domain.ts ClinicData.photo — URL pública do Storage.';

create unique index clinic_cnpj_uk on public.clinic (cnpj) where cnpj is not null;
create index clinic_plan_idx on public.clinic (plan_key);
create index clinic_status_idx on public.clinic (status) where status <> 'active';


-- ─────────────────────────────────────────────────────────────────────────────
-- 6 · PROFILE — espelho de auth.users
--
-- auth.users é do GoTrue: não se referencia com FK de negócio nem se lê em
-- join no dia a dia. `profile` é a cópia consultável (nome e avatar aparecem em
-- toda tela) e o ponto onde a plataforma marca seus próprios administradores.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.profile (
  id             uuid primary key references auth.users(id) on delete cascade,
  full_name      text,
  email          text,
  avatar_url     text,
  phone          text,
  platform_admin boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.profile is
  'Espelho consultável de auth.users. ON DELETE CASCADE: apagou a conta no '
  'GoTrue, o espelho vai junto (o vínculo com a clínica também cai, mas o '
  'audit_log guarda o nome congelado).';
comment on column public.profile.email is
  'Cópia de auth.users.email, sem domínio de validação de propósito: se o GoTrue '
  'aceitou, o espelho aceita — nenhum signup pode falhar por causa de um CHECK aqui.';
comment on column public.profile.phone is
  'Idem: texto cru, porque vem do provedor de auth. Telefone de cadastro do '
  'domínio (com formato garantido) mora em patient/professional.';
comment on column public.profile.platform_admin is
  'Equipe do Neo Saúde (suporte/backoffice), não da clínica. NUNCA é editável '
  'pelo próprio usuário: o GRANT de coluna abaixo tira UPDATE desta coluna do '
  'papel `authenticated`; só service_role promove alguém.';

create index profile_email_idx on public.profile (lower(email)) where email is not null;
create index profile_platform_admin_idx on public.profile (id) where platform_admin;

-- Criação automática do espelho no signup ------------------------------------
create or replace function private.tg_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profile (id, email, full_name, avatar_url, phone)
  values (
    new.id,
    new.email,
    nullif(btrim(coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    )), ''),
    nullif(btrim(coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture',
      ''
    )), ''),
    nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'phone', new.phone, ''), '\D', '', 'g'), '')
  )
  on conflict (id) do nothing;   -- reprocessamento do GoTrue não pode quebrar o signup
  return new;
end;
$$;

comment on function private.tg_handle_new_user() is
  'AFTER INSERT em auth.users: cria o profile. SECURITY DEFINER porque o GoTrue '
  'insere com um papel que não enxerga public.profile.';

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.tg_handle_new_user();

-- Sincronização de e-mail (troca de e-mail confirmada no GoTrue) --------------
create or replace function private.tg_sync_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profile
     set email = new.email, updated_at = now()
   where id = new.id
     and email is distinct from new.email;
  return new;
end;
$$;

comment on function private.tg_sync_user_email() is
  'Mantém profile.email igual ao do GoTrue — senão a lista de usuários da clínica '
  'mostra o e-mail antigo para sempre.';

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function private.tg_sync_user_email();

revoke execute on function private.tg_handle_new_user() from public;
revoke execute on function private.tg_sync_user_email() from public;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7 · ACCESS_PROFILE — o "cargo" (domain.ts Role)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.access_profile (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinic(id) on delete cascade,
  name        text not null,
  description text,
  is_system   boolean not null default false,
  status      public.active_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint access_profile_name_not_blank_ck check (btrim(name) <> ''),
  -- Alvo da FK composta de access_profile_permission e clinic_user: é o que
  -- impede um cargo de uma clínica ser usado por outra.
  constraint access_profile_id_clinic_uk unique (id, clinic_id)
);

comment on table public.access_profile is
  'Cargo da clínica (Recepcionista, Especialista, Gerente…) — domain.ts Role. '
  'ON DELETE CASCADE na clínica: cargo não existe fora do tenant.';
comment on column public.access_profile.is_system is
  'Cargo criado no onboarding (ex.: Administrador). A UI não deixa apagar nem '
  'renomear — é o que garante que sempre exista alguém com acesso ao Administrativo.';

create unique index access_profile_name_uk on public.access_profile (clinic_id, lower(name));
create index access_profile_clinic_idx on public.access_profile (clinic_id, status);


-- ─────────────────────────────────────────────────────────────────────────────
-- 8 · CLINIC_USER — profile ↔ clinic ↔ access_profile
-- ─────────────────────────────────────────────────────────────────────────────

create table public.clinic_user (
  id                uuid primary key default gen_random_uuid(),
  clinic_id         uuid not null references public.clinic(id) on delete cascade,
  user_id           uuid not null references public.profile(id) on delete cascade,
  access_profile_id uuid not null,
  status            public.membership_status not null default 'invited',
  invited_by        uuid references public.profile(id) on delete set null,
  joined_at         timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint clinic_user_uk unique (clinic_id, user_id),
  -- FK COMPOSTA: o cargo tem de ser da MESMA clínica do vínculo. Sem isto, um
  -- admin poderia apontar um membro para o cargo "Gerente" de outra clínica e
  -- herdar as permissões de lá.
  --
  -- NO ACTION e não RESTRICT, de propósito: os dois barram apagar um cargo com
  -- gente dentro, mas RESTRICT confere NA HORA e NO ACTION confere no fim do
  -- statement. Ao apagar uma clínica (service_role), o CASCADE remove
  -- access_profile e clinic_user na mesma instrução, em ordem indefinida — com
  -- RESTRICT isso estouraria conforme a sorte do plano.
  constraint clinic_user_access_profile_fk
    foreign key (access_profile_id, clinic_id)
    references public.access_profile(id, clinic_id)
    on delete no action
);

comment on table public.clinic_user is
  'Vínculo do usuário com a clínica — a tabela que private.auth_clinic_ids() lê '
  'para responder "de quais tenants este auth.uid() faz parte". Todo o modelo de '
  'segurança passa por aqui.';
comment on column public.clinic_user.access_profile_id is
  'Cargo. A FK composta impede apagar um cargo com gente dentro — o banco teria '
  'de escolher em silêncio outro cargo para as pessoas, e silêncio em permissão '
  'é como vazamento começa.';
comment on column public.clinic_user.invited_by is
  'Quem convidou. ON DELETE SET NULL: o convite sobrevive à saída de quem convidou.';
comment on column public.clinic_user.joined_at is 'Momento em que o convite virou vínculo ativo (aceite).';

-- Índice do caminho quente: auth_clinic_ids() filtra por (user_id, status) em
-- TODA consulta autenticada do sistema.
create index clinic_user_user_idx on public.clinic_user (user_id, status);
create index clinic_user_clinic_idx on public.clinic_user (clinic_id, status);
create index clinic_user_access_profile_idx on public.clinic_user (access_profile_id);
create index clinic_user_invited_by_idx on public.clinic_user (invited_by) where invited_by is not null;


-- ─────────────────────────────────────────────────────────────────────────────
-- 9 · ACCESS_PROFILE_PERMISSION — cargo × feature
-- ─────────────────────────────────────────────────────────────────────────────

create table public.access_profile_permission (
  id                uuid primary key default gen_random_uuid(),
  clinic_id         uuid not null references public.clinic(id) on delete cascade,
  access_profile_id uuid not null,
  feature_key       text not null references public.feature(key) on update cascade on delete restrict,
  can_view          boolean not null default false,
  can_edit          boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint access_profile_permission_uk unique (access_profile_id, feature_key),
  -- Editar sem poder ver é um estado impossível na UI e uma brecha na API.
  constraint access_profile_permission_edit_implies_view_ck check (not can_edit or can_view),
  constraint access_profile_permission_profile_fk
    foreign key (access_profile_id, clinic_id)
    references public.access_profile(id, clinic_id)
    on delete cascade
);

comment on table public.access_profile_permission is
  'O que cada cargo pode ver/editar, por feature_key. Metade do portão — a outra '
  'metade é plan_feature. clinic_id é redundante por join, e está aqui de '
  'propósito: policy direta, sem subselect.';
comment on column public.access_profile_permission.can_edit is
  'Escrita. A ausência de linha equivale a can_view=false — o padrão é NEGAR.';

create index access_profile_permission_clinic_idx on public.access_profile_permission (clinic_id);
create index access_profile_permission_feature_idx on public.access_profile_permission (feature_key);


-- ─────────────────────────────────────────────────────────────────────────────
-- 10 · COUNTER + next_code — o código humano sequencial por clínica
-- ─────────────────────────────────────────────────────────────────────────────

create table public.counter (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references public.clinic(id) on delete cascade,
  key        text not null,
  value      bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint counter_uk unique (clinic_id, key),
  constraint counter_key_format_ck check (key ~ '^[a-z][a-z0-9_]*$'),
  constraint counter_value_ck check (value >= 0)
);

comment on table public.counter is
  'Sequência por clínica e por entidade, para os códigos humanos (PAC-000042). '
  'Não é sequence do Postgres porque sequence é global e não volta atrás; aqui '
  'cada tenant tem a própria contagem, começando em 1, sem vazar volume de um '
  'cliente para o outro. Tabela INTERNA: nenhuma policy dá acesso a authenticated — '
  'só as funções SECURITY DEFINER a tocam.';
comment on column public.counter.key is
  'Entidade contada: patient, professional, quote, payment, prescription, '
  'payable, receivable, invoice. Ver a tabela de prefixos no cabeçalho do arquivo.';

create index counter_clinic_idx on public.counter (clinic_id);


create or replace function private.next_code(p_clinic uuid, p_key text, p_prefix text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_value bigint;
begin
  if p_clinic is null or p_key is null or p_prefix is null then
    raise exception 'next_code: clinic_id, key e prefix são obrigatórios'
      using errcode = '22004';
  end if;

  -- INSERT ... ON CONFLICT DO UPDATE é o incremento atômico: o primeiro a
  -- chegar cria a linha, os demais colidem na unique e caem no UPDATE, que
  -- toma o lock da linha. Duas recepcionistas salvando ao mesmo tempo NÃO
  -- geram PAC-000042 duas vezes — a segunda espera o commit da primeira.
  insert into public.counter as c (clinic_id, key, value)
  values (p_clinic, p_key, 1)
  on conflict (clinic_id, key)
  do update set value = c.value + 1, updated_at = now()
  returning c.value into v_value;

  return p_prefix || '-' || lpad(v_value::text, 6, '0');
end;
$$;

comment on function private.next_code(uuid, text, text) is
  'Devolve o próximo código humano da clínica (ex.: PAC-000042), incrementando '
  'de forma atômica. Efeito colateral aceito: um ROLLBACK devolve o número (não '
  'há buraco), ao custo de segurar o lock do contador até o commit — o certo '
  'para um código que a equipe fala em voz alta e imprime em documento.';

create or replace function public.next_code(p_clinic uuid, p_key text, p_prefix text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Wrapper exposto no PostgREST para o front pré-alocar um código (ex.: mostrar
  -- o número do orçamento antes de salvar). Confere o tenant — sem isto, um
  -- cliente poderia queimar a sequência de outra clínica.
  if p_clinic is null or not (p_clinic = any(private.auth_clinic_ids())) then
    raise exception 'Sem acesso a esta clínica.' using errcode = '42501';
  end if;
  return private.next_code(p_clinic, p_key, p_prefix);
end;
$$;

comment on function public.next_code(uuid, text, text) is
  'RPC: próximo código humano da clínica do usuário. Prefira a trigger '
  'private.tg_set_code() no INSERT — este wrapper é para pré-visualização.';


-- Trigger genérica de código: as outras fatias só a penduram ------------------
create or replace function private.tg_set_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_clinic uuid;
begin
  if tg_nargs <> 2 then
    raise exception 'tg_set_code espera 2 argumentos: (chave_do_contador, prefixo)';
  end if;

  v_clinic := (to_jsonb(new) ->> 'clinic_id')::uuid;
  if v_clinic is null then
    raise exception 'tg_set_code: %.% não tem clinic_id preenchido', tg_table_schema, tg_table_name
      using errcode = '23502';
  end if;

  new.code := private.next_code(v_clinic, tg_argv[0], tg_argv[1]);
  return new;
end;
$$;

comment on function private.tg_set_code() is
  'BEFORE INSERT ... WHEN (new.code is null): preenche `code`. Uso: '
  'execute function private.tg_set_code(''patient'', ''PAC''). Deixa passar um '
  'code já informado (importação de base antiga).';

revoke execute on function private.next_code(uuid, text, text) from public;
revoke execute on function private.tg_set_code() from public;
revoke execute on function public.next_code(uuid, text, text) from public;
grant execute on function public.next_code(uuid, text, text) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 11 · AUDIT_LOG + trigger genérica
-- ─────────────────────────────────────────────────────────────────────────────

create table public.audit_log (
  id             uuid primary key default gen_random_uuid(),
  clinic_id      uuid not null references public.clinic(id) on delete cascade,
  table_name     text not null,
  record_id      uuid,
  action         public.audit_action not null,
  actor_id       uuid references public.profile(id) on delete set null,
  actor_name     text,
  old_data       jsonb,
  new_data       jsonb,
  changed_fields text[],
  created_at     timestamptz not null default now()
);

comment on table public.audit_log is
  'Trilha genérica de alterações. APPEND-ONLY: `authenticated` não tem INSERT/'
  'UPDATE/DELETE (revogado abaixo) — só a trigger SECURITY DEFINER escreve. Um '
  'log que o usuário audita pode apagar não é log.';
comment on column public.audit_log.actor_id is
  'Quem fez. ON DELETE SET NULL para não perder o registro quando a conta sai — '
  'por isso existe actor_name.';
comment on column public.audit_log.actor_name is
  'Nome CONGELADO no momento do fato. Referência é sempre por id, mas aqui o '
  'texto é o ponto: o log precisa continuar legível depois que a pessoa some.';
comment on column public.audit_log.changed_fields is
  'Só no UPDATE: colunas que realmente mudaram. Alteração que só mexe em '
  'updated_at não vira linha (ruído puro).';
comment on column public.audit_log.record_id is
  'PK da linha afetada. Nulável porque tabela de junção sem uuid own id ainda '
  'pode ser auditada pelo conteúdo do jsonb.';

create index audit_log_clinic_time_idx on public.audit_log (clinic_id, created_at desc);
create index audit_log_record_idx on public.audit_log (clinic_id, table_name, record_id, created_at desc);
create index audit_log_actor_idx on public.audit_log (actor_id, created_at desc) where actor_id is not null;


create or replace function private.tg_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old      jsonb;
  v_new      jsonb;
  v_clinic   uuid;
  v_record   uuid;
  v_changed  text[];
  v_actor    uuid := auth.uid();
  v_name     text;
  v_redact   text;
begin
  if tg_op <> 'INSERT' then v_old := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then v_new := to_jsonb(new); end if;

  -- Colunas sensíveis passadas como argumento saem do snapshot
  -- (ex.: execute function private.tg_audit('token','password')).
  if tg_nargs > 0 then
    foreach v_redact in array tg_argv loop
      v_old := v_old - v_redact;
      v_new := v_new - v_redact;
    end loop;
  end if;

  v_clinic := coalesce(v_new ->> 'clinic_id', v_old ->> 'clinic_id')::uuid;
  v_record := coalesce(v_new ->> 'id', v_old ->> 'id')::uuid;

  -- Tabela sem tenant não entra na trilha: o log é lido por clínica e uma linha
  -- sem clinic_id seria invisível para todo mundo (e não passaria no NOT NULL).
  if v_clinic is null then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  if tg_op = 'UPDATE' then
    select array_agg(e.key order by e.key)
      into v_changed
      from jsonb_each(v_new) as e
     where v_old -> e.key is distinct from e.value;

    -- Nada mudou, ou só o carimbo do updated_at: não gera linha.
    if v_changed is null or v_changed <@ array['updated_at']::text[] then
      return new;
    end if;
  end if;

  select p.full_name into v_name from public.profile p where p.id = v_actor;

  insert into public.audit_log (
    clinic_id, table_name, record_id, action,
    actor_id, actor_name, old_data, new_data, changed_fields
  ) values (
    v_clinic, tg_table_name, v_record, lower(tg_op)::public.audit_action,
    v_actor, v_name, v_old, v_new, v_changed
  );

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

comment on function private.tg_audit() is
  'Trigger de auditoria reutilizável. Use SEMPRE como AFTER INSERT OR UPDATE OR '
  'DELETE ... FOR EACH ROW: em AFTER, o valor de retorno é ignorado e um erro '
  'aqui não corrompe a escrita de negócio. Lê clinic_id e id do próprio jsonb da '
  'linha, então serve para qualquer tabela do domínio sem uma linha de código a mais.';

revoke execute on function private.tg_audit() from public;


-- ─────────────────────────────────────────────────────────────────────────────
-- 12 · FUNÇÕES DE AUTORIZAÇÃO (private)
--
-- Resolvemos o tenant por CONSULTA sobre auth.uid(), não por claim de JWT:
-- claim envelhece (o token vive ~1h), tirar o acesso de alguém tem de valer no
-- próximo request, não na próxima renovação de token.
--
-- Todas são STABLE + SECURITY DEFINER + search_path travado. SECURITY DEFINER é
-- o que quebra a recursão: a função lê clinic_user como dona das tabelas, sem
-- reentrar nas policies de clinic_user.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function private.auth_clinic_ids()
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(cu.clinic_id order by cu.created_at), '{}'::uuid[])
    from public.clinic_user cu
    join public.clinic c on c.id = cu.clinic_id
   where cu.user_id = (select auth.uid())
     and cu.status = 'active'
     and c.status = 'active';
$$;

comment on function private.auth_clinic_ids() is
  'Clínicas ATIVAS onde o usuário atual tem vínculo ATIVO. Devolve ''{}'' (nunca '
  'NULL) para que `x = any(...)` seja FALSE e não NULL — policy com NULL é a '
  'porta que ninguém percebe aberta. Se o EXPLAIN mostrar reavaliação por linha '
  'em tabela grande, escreva `= any((select private.auth_clinic_ids()))` na '
  'policy: o subselect vira InitPlan e roda uma vez por statement.';

create or replace function private.auth_clinic_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select (private.auth_clinic_ids())[1];
$$;

comment on function private.auth_clinic_id() is
  'Clínica "corrente" — a primeira por ordem de entrada. Hoje um usuário pertence '
  'a uma clínica só; quando existir troca de clínica na UI, o seletor passa o id '
  'explícito e esta função vira só o padrão.';

create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.platform_admin from public.profile p where p.id = (select auth.uid())),
    false
  );
$$;

comment on function private.is_platform_admin() is
  'Equipe do Neo Saúde. Usado com PARCIMÔNIA: dá leitura de dados de governança '
  '(clínica, vínculos, cargos), NUNCA de prontuário/financeiro do paciente.';


create or replace function private.can_access_feature(variadic p_keys text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.clinic_user cu
      join public.clinic c
        on c.id = cu.clinic_id and c.status = 'active'
      join public.access_profile_permission perm
        on perm.access_profile_id = cu.access_profile_id
      -- O JOIN com plan_feature é o segundo portão: sem o plano liberar a mesma
      -- feature_key, permissão de cargo não vale nada.
      join public.plan_feature pf
        on pf.plan_key = c.plan_key and pf.feature_key = perm.feature_key
     where cu.user_id = (select auth.uid())
       and cu.status = 'active'
       and perm.feature_key = any(p_keys)
       and perm.can_view
  );
$$;

create or replace function private.can_access_feature(p_clinic uuid, variadic p_keys text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.clinic_user cu
      join public.clinic c
        on c.id = cu.clinic_id and c.status = 'active'
      join public.access_profile_permission perm
        on perm.access_profile_id = cu.access_profile_id
      join public.plan_feature pf
        on pf.plan_key = c.plan_key and pf.feature_key = perm.feature_key
     where cu.user_id = (select auth.uid())
       and cu.clinic_id = p_clinic
       and cu.status = 'active'
       and perm.feature_key = any(p_keys)
       and perm.can_view
  );
$$;

create or replace function private.can_edit_feature(variadic p_keys text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.clinic_user cu
      join public.clinic c
        on c.id = cu.clinic_id and c.status = 'active'
      join public.access_profile_permission perm
        on perm.access_profile_id = cu.access_profile_id
      join public.plan_feature pf
        on pf.plan_key = c.plan_key and pf.feature_key = perm.feature_key
     where cu.user_id = (select auth.uid())
       and cu.status = 'active'
       and perm.feature_key = any(p_keys)
       and perm.can_edit
  );
$$;

create or replace function private.can_edit_feature(p_clinic uuid, variadic p_keys text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.clinic_user cu
      join public.clinic c
        on c.id = cu.clinic_id and c.status = 'active'
      join public.access_profile_permission perm
        on perm.access_profile_id = cu.access_profile_id
      join public.plan_feature pf
        on pf.plan_key = c.plan_key and pf.feature_key = perm.feature_key
     where cu.user_id = (select auth.uid())
       and cu.clinic_id = p_clinic
       and cu.status = 'active'
       and perm.feature_key = any(p_keys)
       and perm.can_edit
  );
$$;

comment on function private.can_access_feature(variadic text[]) is
  'Pode VER qualquer uma das features? Exige plano E cargo. VARIADIC porque tela '
  'costuma aceitar mais de uma chave (ex.: can_access_feature(''finance'',''admin'')).';
comment on function private.can_access_feature(uuid, variadic text[]) is
  'Versão escopada à clínica — USE ESTA nas policies. A sem clinic_id responde '
  '"em alguma das minhas clínicas", o que basta hoje (1 usuário = 1 clínica) mas '
  'viraria escalada de privilégio no dia em que alguém for gerente na clínica A '
  'e recepcionista na B.';
comment on function private.can_edit_feature(variadic text[]) is 'Idem can_access_feature, para escrita.';
comment on function private.can_edit_feature(uuid, variadic text[]) is
  'Versão escopada à clínica — a usada nas policies de INSERT/UPDATE/DELETE.';

grant execute on function private.auth_clinic_ids() to authenticated;
grant execute on function private.auth_clinic_id() to authenticated;
grant execute on function private.is_platform_admin() to authenticated;
grant execute on function private.can_access_feature(variadic text[]) to authenticated;
grant execute on function private.can_access_feature(uuid, variadic text[]) to authenticated;
grant execute on function private.can_edit_feature(variadic text[]) to authenticated;
grant execute on function private.can_edit_feature(uuid, variadic text[]) to authenticated;


-- A especialidade tem de estar liberada pelo plano ----------------------------
create or replace function private.tg_clinic_specialty_entitled()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.plan_feature pf
     where pf.plan_key = new.plan_key
       and pf.feature_key = 'specialty_' || new.specialty::text
  ) then
    raise exception 'O plano "%" não libera a especialidade "%" (feature "%").',
      new.plan_key, new.specialty, 'specialty_' || new.specialty::text
      using errcode = '23514';
  end if;
  return new;
end;
$$;

comment on function private.tg_clinic_specialty_entitled() is
  'Garante no banco a decisão de produto: quem libera o ramo da clínica é o '
  'PLANO, não a clínica. Sem isto, a regra viveria só na UI — e a UI é o lugar '
  'onde regra de negócio vai para morrer.';

revoke execute on function private.tg_clinic_specialty_entitled() from public;


-- ─────────────────────────────────────────────────────────────────────────────
-- 13 · TRIGGERS (updated_at + auditoria + entitlement)
-- ─────────────────────────────────────────────────────────────────────────────

create trigger tr_touch before update on public.feature
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.plan
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.plan_feature
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.clinic
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.profile
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.access_profile
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.clinic_user
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.access_profile_permission
  for each row execute function private.tg_touch_updated_at();
create trigger tr_touch before update on public.counter
  for each row execute function private.tg_touch_updated_at();

create trigger tr_clinic_specialty_entitled
  before insert or update of specialty, plan_key on public.clinic
  for each row execute function private.tg_clinic_specialty_entitled();

-- Auditoria só nas tabelas de GOVERNANÇA: quem entrou, quem mudou de cargo,
-- quem ganhou permissão, quem mexeu no cadastro da clínica. É onde a pergunta
-- "quem autorizou isso?" aparece.
create trigger tr_audit after insert or update or delete on public.clinic
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.clinic_user
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.access_profile
  for each row execute function private.tg_audit();
create trigger tr_audit after insert or update or delete on public.access_profile_permission
  for each row execute function private.tg_audit();


-- ─────────────────────────────────────────────────────────────────────────────
-- 14 · PRIVILÉGIOS DE COLUNA
--
-- RLS decide QUAIS LINHAS. GRANT decide QUAIS COLUNAS. As duas coisas são
-- necessárias: sem o GRANT abaixo, um administrador de clínica com UPDATE
-- legítimo na própria linha faria `update clinic set plan_key='enterprise'` e
-- se auto-promoveria — a policy diria sim, porque a linha é dele mesmo.
--
-- (Ordem obrigatória: REVOKE no nível de tabela primeiro. Privilégio de coluna
-- só existe quando o de tabela não existe.)
-- ─────────────────────────────────────────────────────────────────────────────

revoke insert, update, delete on public.clinic from anon, authenticated;
grant update (
  name, cnpj, email, phone, logo_url,
  cep, state, city, neighborhood, street, number
) on public.clinic to authenticated;
-- Fora da lista, de propósito: `specialty` e `plan_key` (decisão comercial, não
-- da clínica) e `status` (bloqueio por inadimplência). INSERT/DELETE de clínica
-- é ato da plataforma: onboarding roda com service_role.

revoke update on public.profile from anon, authenticated;
grant update (full_name, avatar_url, phone) on public.profile to authenticated;
-- `platform_admin` e `email` ficam de fora: um é escalada de privilégio, o outro
-- é espelho do GoTrue (troca de e-mail passa pelo fluxo de confirmação).
revoke delete on public.profile from anon, authenticated;

revoke update on public.clinic_user from anon, authenticated;
grant update (access_profile_id, status, joined_at) on public.clinic_user to authenticated;
-- `clinic_id`/`user_id` imutáveis: mudar qualquer um deles é criar outro vínculo,
-- e vínculo se cria com INSERT (que a auditoria registra como tal).

revoke update on public.access_profile from anon, authenticated;
grant update (name, description, status) on public.access_profile to authenticated;

revoke update on public.access_profile_permission from anon, authenticated;
grant update (can_view, can_edit) on public.access_profile_permission to authenticated;

-- Catálogo da plataforma: leitura para todos, escrita só service_role.
revoke insert, update, delete on public.feature       from anon, authenticated;
revoke insert, update, delete on public.plan          from anon, authenticated;
revoke insert, update, delete on public.plan_feature  from anon, authenticated;

-- Contador: escrita só pelas funções SECURITY DEFINER. A leitura sobra para a
-- policy abaixo restringir à plataforma (diagnóstico) — não se tira o GRANT de
-- SELECT aqui senão a policy vira enfeite.
revoke insert, update, delete on public.counter from anon, authenticated;

-- Trilha imutável: escrita só pela trigger.
revoke insert, update, delete on public.audit_log from anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 15 · RLS
--
-- Habilitado em TODAS as tabelas. Sem policy = negado, e é esse o padrão
-- desejado: uma tabela nova nasce fechada.
--
-- Nota: NÃO usamos `force row level security`. A dona das tabelas (postgres) é
-- quem executa as funções SECURITY DEFINER; se forçássemos RLS para a dona,
-- auth_clinic_ids() reentraria na policy de clinic_user e teríamos recursão
-- infinita. service_role continua passando por cima (bypassrls) — é o papel do
-- servidor, nunca do navegador.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.feature                   enable row level security;
alter table public.plan                      enable row level security;
alter table public.plan_feature              enable row level security;
alter table public.clinic                    enable row level security;
alter table public.profile                   enable row level security;
alter table public.access_profile            enable row level security;
alter table public.clinic_user               enable row level security;
alter table public.access_profile_permission enable row level security;
alter table public.counter                   enable row level security;
alter table public.audit_log                 enable row level security;

-- ── Catálogo global: todo autenticado lê (é vitrine de plano e mapa de módulos)
create policy feature_select on public.feature
  for select to authenticated using (true);

create policy plan_select on public.plan
  for select to authenticated using (true);

create policy plan_feature_select on public.plan_feature
  for select to authenticated using (true);

-- ── clinic ───────────────────────────────────────────────────────────────────
create policy clinic_select on public.clinic
  for select to authenticated
  using (id = any(private.auth_clinic_ids()) or private.is_platform_admin());

create policy clinic_update on public.clinic
  for update to authenticated
  using (id = any(private.auth_clinic_ids()) and private.can_edit_feature(id, 'admin'))
  with check (id = any(private.auth_clinic_ids()));
-- Sem policy de INSERT/DELETE: criar e encerrar clínica é ato da plataforma
-- (service_role). Uma clínica nunca é apagada — vira status='canceled'.

-- ── profile ──────────────────────────────────────────────────────────────────
create policy profile_select on public.profile
  for select to authenticated
  using (
    id = (select auth.uid())
    -- Colegas da mesma clínica: a tela precisa do nome e do avatar de quem
    -- criou o registro, atendeu, deu baixa. Não expõe ninguém de fora.
    or exists (
      select 1 from public.clinic_user cu
       where cu.user_id = profile.id
         and cu.clinic_id = any(private.auth_clinic_ids())
    )
    or private.is_platform_admin()
  );

create policy profile_insert_self on public.profile
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy profile_update_self on public.profile
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ── clinic_user ──────────────────────────────────────────────────────────────
create policy clinic_user_select on public.clinic_user
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids()) or private.is_platform_admin());

create policy clinic_user_insert on public.clinic_user
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

create policy clinic_user_update on public.clinic_user
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy clinic_user_delete on public.clinic_user
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
    -- Ninguém se remove: é assim que uma clínica acorda sem nenhum
    -- administrador e com o Administrativo trancado por dentro.
    and user_id <> (select auth.uid())
  );

-- ── access_profile ───────────────────────────────────────────────────────────
create policy access_profile_select on public.access_profile
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids()));

create policy access_profile_insert on public.access_profile
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

create policy access_profile_update on public.access_profile
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy access_profile_delete on public.access_profile
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
    and not is_system   -- cargo de sistema não se apaga
  );

-- ── access_profile_permission ────────────────────────────────────────────────
create policy access_profile_permission_select on public.access_profile_permission
  for select to authenticated
  using (clinic_id = any(private.auth_clinic_ids()));

create policy access_profile_permission_insert on public.access_profile_permission
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

create policy access_profile_permission_update on public.access_profile_permission
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

create policy access_profile_permission_delete on public.access_profile_permission
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

-- ── counter ──────────────────────────────────────────────────────────────────
-- Tabela interna: só a plataforma enxerga (e mesmo assim só para diagnóstico).
create policy counter_select_platform on public.counter
  for select to authenticated
  using (private.is_platform_admin());

-- ── audit_log ────────────────────────────────────────────────────────────────
create policy audit_log_select on public.audit_log
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'admin')
  );
-- Sem INSERT/UPDATE/DELETE para ninguém: append-only pela trigger.


-- ─────────────────────────────────────────────────────────────────────────────
-- 16 · RPC my_session() — a chamada de abertura do app
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.my_session(p_clinic uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user   uuid := auth.uid();
  v_clinic uuid;
  v_out    jsonb;
begin
  if v_user is null then
    raise exception 'Não autenticado.' using errcode = '42501';
  end if;

  if p_clinic is not null and not (p_clinic = any(private.auth_clinic_ids())) then
    raise exception 'Sem acesso a esta clínica.' using errcode = '42501';
  end if;

  v_clinic := coalesce(p_clinic, private.auth_clinic_id());

  select jsonb_build_object(
    -- Chaves em snake_case: o contrato do banco é snake_case e quem converte
    -- para camelCase é o service no front (mesma regra das colunas).
    'user', (
      select jsonb_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'email', p.email,
        'avatar_url', p.avatar_url,
        'phone', p.phone,
        'platform_admin', p.platform_admin
      ) from public.profile p where p.id = v_user
    ),
    'clinic', (
      select jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'specialty', c.specialty,
        'logo_url', c.logo_url,
        'status', c.status,
        'cnpj', c.cnpj
      ) from public.clinic c where c.id = v_clinic
    ),
    'membership', (
      select jsonb_build_object(
        'clinic_user_id', cu.id,
        'status', cu.status,
        'access_profile_id', ap.id,
        'access_profile_name', ap.name,
        'joined_at', cu.joined_at
      )
      from public.clinic_user cu
      join public.access_profile ap on ap.id = cu.access_profile_id
      where cu.user_id = v_user and cu.clinic_id = v_clinic
    ),
    'plan', (
      select jsonb_build_object(
        'key', pl.key,
        'label', pl.label,
        'included_professionals', pl.included_professionals
      )
      from public.clinic c
      join public.plan pl on pl.key = c.plan_key
      where c.id = v_clinic
    ),
    -- O mapa que o front usa para esconder menu, aba e botão. Só entra o que
    -- passou nos DOIS portões (plano libera + cargo permite).
    'features', coalesce((
      select jsonb_object_agg(
               x.feature_key,
               jsonb_build_object('view', x.can_view, 'edit', x.can_edit)
             )
      from (
        select perm.feature_key,
               bool_or(perm.can_view) as can_view,
               bool_or(perm.can_edit) as can_edit
          from public.clinic_user cu
          join public.clinic c
            on c.id = cu.clinic_id and c.status = 'active'
          join public.access_profile_permission perm
            on perm.access_profile_id = cu.access_profile_id
          join public.plan_feature pf
            on pf.plan_key = c.plan_key and pf.feature_key = perm.feature_key
         where cu.user_id = v_user
           and cu.clinic_id = v_clinic
           and cu.status = 'active'
           and perm.can_view
         group by perm.feature_key
      ) x
    ), '{}'::jsonb),
    -- Todas as clínicas do usuário: hoje sempre 1, mas o front já pode
    -- desenhar o seletor sem uma segunda ida ao servidor.
    'clinics', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name) order by c.name)
        from public.clinic c
       where c.id = any(private.auth_clinic_ids())
    ), '[]'::jsonb)
  ) into v_out;

  return v_out;
end;
$$;

comment on function public.my_session(uuid) is
  'Tudo que o app precisa na abertura, em UMA ida ao servidor: usuário, clínica, '
  'vínculo/cargo, plano e o mapa feature→{view,edit}. Sem isto o front faria 5 '
  'requests em cascata só para saber se pode desenhar o menu. O parâmetro é '
  'opcional e só faz sentido quando o usuário tiver mais de uma clínica.';

revoke execute on function public.my_session(uuid) from public;
grant execute on function public.my_session(uuid) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 17 · SEED DO CATÁLOGO
--
-- Sem estas linhas nada funciona: clinic.plan_key é NOT NULL e a trigger de
-- especialidade exige a feature specialty_* no plano. Preço e composição são
-- comerciais — mudar aqui não mexe em nenhuma estrutura.
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.feature (key, label, category, is_addon, sort_order) values
  -- Módulos = as páginas do app (mesmas chaves de AppPage em domain.ts).
  ('dashboard',                  'Dashboard',                        'module',      false,  10),
  ('schedule',                   'Agenda',                           'module',      false,  20),
  ('patients',                   'Pacientes',                        'module',      false,  30),
  ('professionals',              'Profissionais',                    'module',      false,  40),
  ('finance',                    'Financeiro',                       'module',      false,  50),
  ('admin',                      'Administrativo',                   'module',      false,  60),
  ('settings',                   'Configurações',                    'module',      false,  70),
  -- Ramo da clínica: é o PLANO que libera, não a clínica.
  ('specialty_dentistry',        'Odontologia',                      'specialty',   false, 110),
  ('specialty_physiotherapy',    'Fisioterapia',                     'specialty',   false, 120),
  ('specialty_nutrition',        'Nutrição',                         'specialty',   false, 130),
  ('specialty_psychology',       'Psicologia',                       'specialty',   false, 140),
  ('specialty_personal_training','Personal trainer',                 'specialty',   false, 150),
  -- Add-on.
  ('whatsapp',                   'WhatsApp e mensagens automáticas', 'integration', true,  210);

insert into public.plan (key, label, monthly_price, yearly_price, included_professionals, sort_order) values
  ('starter',      'Essencial',    149.90, 1499.00,    3, 10),
  ('professional', 'Profissional', 249.90, 2499.00,   10, 20),
  ('enterprise',   'Avançado',     399.90, 3999.00, null, 30);

-- Essencial: opera a clínica (agenda, pacientes, equipe), sem Financeiro.
insert into public.plan_feature (plan_key, feature_key)
select 'starter', f.key from public.feature f
 where f.key in ('dashboard','schedule','patients','professionals','admin','settings')
    or f.category = 'specialty';

-- Profissional: o Essencial + Financeiro + WhatsApp.
insert into public.plan_feature (plan_key, feature_key)
select 'professional', f.key from public.feature f
 where f.key in ('dashboard','schedule','patients','professionals','admin','settings','finance','whatsapp')
    or f.category = 'specialty';

-- Avançado: tudo que existir no catálogo.
insert into public.plan_feature (plan_key, feature_key)
select 'enterprise', f.key from public.feature f;


-- ═════════════════════════════════════════════════════════════════════════════
-- FIM DA FUNDAÇÃO
--
-- BOOTSTRAP (fica de fora desta migration de propósito): a primeira clínica e o
-- primeiro clinic_user precisam nascer com service_role — o ovo antes da
-- galinha, já que auth_clinic_ids() depende de um clinic_user que ainda não
-- existe. A fatia de ONBOARDING deve entregar uma RPC SECURITY DEFINER que, em
-- uma transação: cria a clinic, cria os access_profile padrão (Administrador
-- com todas as features, Recepcionista, Especialista, Gerente — espelhando
-- mocks/roles.ts), popula access_profile_permission e cria o clinic_user do
-- fundador com status='active'.
--
-- LIGAÇÃO USUÁRIO ↔ PROFISSIONAL (domain.ts UserProfile.professionalId): fica na
-- fatia de Profissionais, como `professional.user_id uuid references
-- public.profile(id) on delete set null`. NÃO foi declarada aqui para a fundação
-- não depender de uma tabela que ainda não existe — a dependência anda em um
-- sentido só.
-- ═════════════════════════════════════════════════════════════════════════════
