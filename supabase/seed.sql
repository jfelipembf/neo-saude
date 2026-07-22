-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — 99 · SEED DE DEMONSTRAÇÃO
--
-- Roda POR ÚLTIMO, depois de 01…10. Cria o mínimo para o app abrir:
--
--   · o catálogo da plataforma (feature, plan, plan_feature) — reafirmado aqui
--     de forma IDEMPOTENTE, porque 01-fundacao.sql já o insere e este arquivo
--     precisa poder rodar de novo sem quebrar;
--   · UMA clínica de demonstração ("Clínica Neo Saúde", odontologia, Aracaju/SE),
--     espelhando src/mocks/clinic.ts;
--   · os quatro cargos padrão (Administrador, Gerente, Especialista,
--     Recepcionista), espelhando src/mocks/roles.ts, com as permissões
--     preenchidas por feature_key;
--   · o questionário de anamnese do ramo, via private.seed_anamnesis_template().
--
-- NÃO CRIA NENHUM DADO DE PACIENTE. Nem paciente, nem ficha, nem consulta, nem
-- orçamento, nem lançamento financeiro. Semear prontuário é criar dado pessoal
-- sensível (LGPD art. 11) num banco que amanhã pode virar produção — e é
-- exatamente o tipo de linha que ninguém lembra de apagar.
--
-- ⚠️ RODE COM service_role (ou como `postgres`). Este arquivo escreve em
--    `clinic`, que não tem policy de INSERT para `authenticated` de propósito:
--    criar clínica é ato da plataforma.
--
-- ⚠️ NÃO CRIA USUÁRIO. Contas nascem no GoTrue (auth.users), pelo fluxo de
--    signup — inserir linha lá na mão produz usuário sem senha, sem e-mail
--    confirmado e sem identidade. A seção 5 tem o comando de UMA LINHA para
--    ligar um usuário já cadastrado à clínica de demonstração como Administrador.
--
-- IDEMPOTÊNCIA: tudo aqui usa ON CONFLICT DO NOTHING sobre chave natural, e a
-- clínica tem id FIXO. Rodar duas vezes não duplica nada.
-- ═════════════════════════════════════════════════════════════════════════════

-- Um id fixo e reconhecível para a clínica de demonstração: quem olhar o banco
-- sabe na hora que aquela linha é semente, não cliente.
--   d3110000-0000-4000-8000-000000000001   ("demo")


-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · CATÁLOGO DA PLATAFORMA (reafirmação idempotente)
--
-- 01-fundacao.sql já insere estas linhas. Repetimos aqui com ON CONFLICT porque
-- (a) o seed tem de poder rodar sozinho contra um banco já migrado, e (b) é
-- neste arquivo que se acrescenta uma feature nova sem editar a migration 01,
-- que já rodou em produção.
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
  -- Ramo da clínica: é o PLANO que libera (trigger tr_clinic_specialty_entitled).
  ('specialty_dentistry',        'Odontologia',                      'specialty',   false, 110),
  ('specialty_physiotherapy',    'Fisioterapia',                     'specialty',   false, 120),
  ('specialty_nutrition',        'Nutrição',                         'specialty',   false, 130),
  ('specialty_psychology',       'Psicologia',                       'specialty',   false, 140),
  ('specialty_personal_training','Personal trainer',                 'specialty',   false, 150),
  -- Add-on cobrado à parte.
  ('whatsapp',                   'WhatsApp e mensagens automáticas', 'integration', true,  210)
on conflict (key) do nothing;

insert into public.plan (key, label, monthly_price, yearly_price, included_professionals, sort_order) values
  ('starter',      'Essencial',    149.90, 1499.00,    3, 10),
  ('professional', 'Profissional', 249.90, 2499.00,   10, 20),
  ('enterprise',   'Avançado',     399.90, 3999.00, null, 30)
on conflict (key) do nothing;

-- Essencial: opera a clínica (agenda, pacientes, equipe), SEM Financeiro.
insert into public.plan_feature (plan_key, feature_key)
select 'starter', f.key from public.feature f
 where f.key in ('dashboard','schedule','patients','professionals','admin','settings')
    or f.category = 'specialty'
on conflict (plan_key, feature_key) do nothing;

-- Profissional: o Essencial + Financeiro + WhatsApp.
insert into public.plan_feature (plan_key, feature_key)
select 'professional', f.key from public.feature f
 where f.key in ('dashboard','schedule','patients','professionals','admin',
                 'settings','finance','whatsapp')
    or f.category = 'specialty'
on conflict (plan_key, feature_key) do nothing;

-- Avançado: tudo que existir no catálogo.
insert into public.plan_feature (plan_key, feature_key)
select 'enterprise', f.key from public.feature f
on conflict (plan_key, feature_key) do nothing;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · A CLÍNICA DE DEMONSTRAÇÃO
--
-- Espelha src/mocks/clinic.ts. Valores com máscara no mock entram aqui SÓ COM
-- DÍGITOS (regra 7 da fundação — os domínios cnpj_digits/phone_digits/cep_digits
-- recusariam o formato de tela).
--
-- Plano `enterprise` de propósito: é o único que libera TODAS as features, e um
-- ambiente de demonstração com metade das telas escondidas por entitlement gera
-- mais chamado de suporte do que aprendizado. Para exercitar o portão de plano,
-- troque para 'professional' (sem `finance` não aparece o módulo Financeiro) ou
-- 'starter' (sem `finance` nem `whatsapp`).
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.clinic (
  id, name, cnpj, email, phone, logo_url, specialty, plan_key, status,
  cep, state, city, neighborhood, street, number
) values (
  'd3110000-0000-4000-8000-000000000001',
  'Clínica Neo Saúde',
  '12345678000190',            -- 12.345.678/0001-90
  'contato@neosaude.com.br',
  '7932110000',                -- (79) 3211-0000
  '/pwa-192x192.png',
  'dentistry',
  'enterprise',
  'active',
  '49000000',                  -- 49000-000
  'SE',
  'Aracaju',
  'Centro',
  'Av. Beira Mar',
  '1234'
)
on conflict (id) do nothing;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · CARGOS PADRÃO + PERMISSÕES
--
-- Espelha src/mocks/roles.ts, com UMA adição: `Administrador`, que o mock não
-- tem porque o mock não tem controle de acesso de verdade. Ele é `is_system`:
-- a UI não deixa apagar nem renomear — é o que garante que a clínica nunca
-- acorde sem ninguém com acesso ao Administrativo.
--
-- O mock só sabe dizer "vê a página" (`pages: AppPage[]`). Aqui a permissão tem
-- DUAS dimensões, e a diferença é onde mora a regra de negócio real:
--   · Recepcionista VÊ e EDITA agenda e pacientes — é o trabalho dela;
--   · Especialista VÊ Profissionais mas NÃO edita (a ficha da equipe é do
--     Administrativo);
--   · Gerente edita tudo, menos o que nem o Administrador edita (nada aqui);
--   · Administrador VÊ e EDITA todas as features do catálogo, inclusive as que
--     forem criadas depois — por isso a inserção dele é um SELECT sobre
--     public.feature, e não uma lista fixa que envelhece no primeiro add-on novo.
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.access_profile (clinic_id, name, description, is_system, status) values
  ('d3110000-0000-4000-8000-000000000001', 'Administrador',
   'Acesso total, incluindo Administrativo e Configurações. Cargo de sistema: não se apaga.',
   true,  'active'),
  ('d3110000-0000-4000-8000-000000000001', 'Gerente',
   'Enxerga e edita tudo, inclusive Financeiro e Administrativo.',
   false, 'active'),
  ('d3110000-0000-4000-8000-000000000001', 'Especialista',
   'Atende: agenda, prontuário e a ficha dos colegas em leitura.',
   false, 'active'),
  ('d3110000-0000-4000-8000-000000000001', 'Recepcionista',
   'Recepção: agenda e cadastro de pacientes.',
   false, 'active')
on conflict do nothing;

-- Administrador: TODAS as features do catálogo, ver + editar.
insert into public.access_profile_permission
  (clinic_id, access_profile_id, feature_key, can_view, can_edit)
select ap.clinic_id, ap.id, f.key, true, true
  from public.access_profile ap
 cross join public.feature f
 where ap.clinic_id = 'd3110000-0000-4000-8000-000000000001'
   and ap.name = 'Administrador'
on conflict (access_profile_id, feature_key) do nothing;

-- Gerente: os sete módulos, ver + editar. Fica de fora `specialty_*` (não é
-- permissão de tela, é entitlement de ramo) e `whatsapp` entra porque a
-- integração é operada pelo gerente.
insert into public.access_profile_permission
  (clinic_id, access_profile_id, feature_key, can_view, can_edit)
select ap.clinic_id, ap.id, k.key, true, true
  from public.access_profile ap
 cross join (values ('dashboard'),('schedule'),('patients'),('professionals'),
                    ('finance'),('admin'),('settings'),('whatsapp')) as k(key)
 where ap.clinic_id = 'd3110000-0000-4000-8000-000000000001'
   and ap.name = 'Gerente'
on conflict (access_profile_id, feature_key) do nothing;

-- Especialista: dashboard/agenda/pacientes com edição; Profissionais só leitura.
insert into public.access_profile_permission
  (clinic_id, access_profile_id, feature_key, can_view, can_edit)
select ap.clinic_id, ap.id, k.key, true, k.edit
  from public.access_profile ap
 cross join (values ('dashboard', true),
                    ('schedule',  true),
                    ('patients',  true),
                    ('professionals', false)) as k(key, edit)
 where ap.clinic_id = 'd3110000-0000-4000-8000-000000000001'
   and ap.name = 'Especialista'
on conflict (access_profile_id, feature_key) do nothing;

-- Recepcionista: dashboard/agenda/pacientes, ver + editar. Sem Financeiro, sem
-- Profissionais, sem Administrativo.
insert into public.access_profile_permission
  (clinic_id, access_profile_id, feature_key, can_view, can_edit)
select ap.clinic_id, ap.id, k.key, true, true
  from public.access_profile ap
 cross join (values ('dashboard'),('schedule'),('patients')) as k(key)
 where ap.clinic_id = 'd3110000-0000-4000-8000-000000000001'
   and ap.name = 'Recepcionista'
on conflict (access_profile_id, feature_key) do nothing;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · QUESTIONÁRIO DE ANAMNESE DO RAMO
--
-- Sem esta chamada, public.save_anamnesis() recusa a PRIMEIRA ficha com "A
-- clínica não tem questionário de anamnese padrão configurado" — e o erro
-- aparece no momento em que alguém tenta salvar, não no momento em que a clínica
-- é criada, que é o pior lugar possível para descobrir isso.
--
-- A função é SECURITY DEFINER e semeia seções, perguntas e opções a partir do
-- catálogo declarativo que hoje vive em
-- src/pages/Patients/Profile/Anamnesis/questions.ts.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  v_clinic uuid := 'd3110000-0000-4000-8000-000000000001';
begin
  if not exists (
    select 1 from public.anamnesis_template t
     where t.clinic_id = v_clinic and t.is_default and t.status = 'active'
  ) then
    perform private.seed_anamnesis_template(
      v_clinic,
      (select c.specialty from public.clinic c where c.id = v_clinic)
    );
  end if;
end;
$$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 5 · LIGAR UM USUÁRIO À CLÍNICA DE DEMONSTRAÇÃO  (passo MANUAL)
--
-- Este arquivo NÃO cria conta. Faça o signup normalmente pelo app (ou pelo
-- painel Auth do Supabase) — a trigger `on_auth_user_created` da fundação cria o
-- `profile` sozinha. Depois rode, com service_role, trocando o e-mail:
--
--   insert into public.clinic_user (clinic_id, user_id, access_profile_id, status, joined_at)
--   select 'd3110000-0000-4000-8000-000000000001',
--          p.id,
--          (select ap.id from public.access_profile ap
--            where ap.clinic_id = 'd3110000-0000-4000-8000-000000000001'
--              and ap.name = 'Administrador'),
--          'active',
--          now()
--     from public.profile p
--    where lower(p.email) = lower('SEU-EMAIL@EXEMPLO.COM')
--   on conflict (clinic_id, user_id) do nothing;
--
-- É a partir daí que private.auth_clinic_ids() passa a devolver a clínica e
-- TODAS as policies do sistema começam a deixar o usuário enxergar alguma coisa.
-- Antes disso, um login válido enxerga um app vazio — que é o comportamento
-- correto de um multi-tenant, e a primeira coisa que assusta quem instala.
--
-- Para dar acesso à EQUIPE DA PLATAFORMA (suporte), o comando é outro e é
-- deliberadamente separado, porque `platform_admin` está fora do GRANT de UPDATE
-- de `authenticated` — ninguém se promove:
--
--   update public.profile set platform_admin = true
--    where lower(email) = lower('SUPORTE@NEOSAUDE.COM.BR');
--
--
-- O QUE NÃO ESTÁ AQUI, E POR QUÊ
--
-- · PACIENTE, FICHA, CONSULTA, ORÇAMENTO, LANÇAMENTO. Dado clínico e financeiro
--   de demonstração vira dado clínico e financeiro de produção no dia em que
--   alguém esquecer de limpar. Se precisar de massa para demo, gere em um
--   projeto Supabase separado, com um script que também saiba apagar.
--
-- · PROFISSIONAL. Depende de um `clinic_user` (a FK composta
--   professional_user_fk exige que o login seja membro da mesma clínica), e
--   `clinic_user` depende de uma conta real no GoTrue. Cadastre pelo app, que é
--   onde a trigger de limite de vagas (tr_seat_limit) também é exercitada.
--
-- · AUTOMAÇÕES DE WHATSAPP. As cinco mensagens de MOCK_WHATSAPP_AUTOMATIONS são
--   conteúdo de onboarding e nascem `inactive`. Quando o onboarding virar RPC,
--   elas entram lá — semear aqui criaria automação parada em toda instalação.
--
-- · SALAS, CONVÊNIOS, MATERIAIS. São cadastro do Administrativo, cinco minutos de
--   digitação, e cada clínica tem os seus. Semeá-los daria a impressão de que a
--   instalação já está configurada quando não está.
-- ═════════════════════════════════════════════════════════════════════════════
