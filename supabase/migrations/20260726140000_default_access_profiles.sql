-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — CARGOS PADRÃO DE UMA CLÍNICA NOVA
--
-- Até aqui NADA semeava access_profile: as 3 clínicas de teste só têm
-- "Administrador" porque foi criado NA MÃO, junto com cada tenant, em sessões
-- anteriores — não existe (e nunca existiu) invariante automático nenhum,
-- apesar do comment de access_profile_permission em 20260726100000_today_feature
-- já FALAR desse invariante como se ele existisse ("é o mesmo invariante que o
-- onboarding garante pra clínica nova"). Esta migration é o que faz essa frase
-- passar a ser verdade.
--
-- Três cargos, com permissão de verdade (não cargo vazio de propósito — o
-- pedido foi "básico com as permissões", e um cargo sem nenhuma marcação não
-- deixa a pessoa nova entrar em lugar nenhum do sistema):
--
--   · Administrador — is_system=true. Ganha TODO módulo do CATÁLOGO
--     (`feature.category = 'module'`), não uma lista fixa — é o mesmo
--     desenho que 20260726100000 já usa para o backfill de 'today': um módulo
--     novo que nascer amanhã já aparece pra ele sem outra migration de
--     backfill. is_system é o que a UI usa pra proteger contra apagar/renomear
--     (ver comment da coluna) — sempre tem de sobrar alguém com acesso ao
--     Administrativo.
--
--   · Recepcionista — Hoje, Agenda, Pacientes, Profissionais. As três
--     primeiras são o óbvio (abrir o dia, remarcar, achar o cadastro do
--     paciente). "Profissionais" entra por um motivo menos óbvio: a policy
--     `professional_select` (20260722120300) exige a feature 'professionals'
--     pra ler a tabela INTEIRA (ela carrega telefone/endereço/nascimento) — e
--     SEM ler professional, a Agenda não tem nome nem cor pra desenhar o card
--     de ninguém. Existe uma view `professional_directory` desenhada
--     exatamente pra resolver isto sem dar a feature inteira (ver o comment
--     dela, seção 8.2 do mesmo arquivo) — mas o FRONT nunca foi atualizado pra
--     consultá-la (useProfessionals()/professionalsService.ts leem
--     `professional` direto). Até esse fio ser puxado, a saída funcional é dar
--     'professionals' à Recepcionista — mais acesso do que o ideal (ela também
--     ganha e-mail/telefone/endereço dos profissionais), mas sem isso a Agenda
--     dela sai com as colunas de horário anônimas, o bug que o comment de
--     professional_directory descreve.
--
--   · Profissional — Hoje, Agenda, Pacientes. SEM 'professionals' de
--     propósito: a mesma policy tem uma segunda cláusula —
--     `or user_id = auth.uid()` — que já deixa qualquer profissional logado
--     ler (e editar) o PRÓPRIO cadastro independente da feature. Dar
--     'professionals' aqui abriria também o cadastro de TODOS OS COLEGAS
--     (e-mail, telefone, comissão) por padrão, sem necessidade.
--
-- Nenhum dos três ganha 'finance', 'admin', 'settings' ou 'dashboard' por
-- padrão — dado financeiro, configuração da assinatura e indicador gerencial
-- não são o trabalho de quem recebe paciente ou atende. A própria
-- 20260726100000_today_feature.sql já usa "recepção sem Dashboard" como o
-- exemplo canônico de cargo operacional — este desenho segue a mesma régua. A
-- clínica liga o que quiser depois em Administrativo → Cargos; isto é só o
-- ponto de partida.
--
-- Depende de: 20260722120000_foundation.sql (clinic, feature, access_profile,
--             access_profile_permission)
-- ═════════════════════════════════════════════════════════════════════════════

-- ── Helper: cria UM cargo com UM conjunto de features, se ele ainda não
-- existir NESSA clínica (por nome, case-insensitive — o mesmo critério do
-- índice único access_profile_name_uk). Compartilhado pelos dois usos abaixo:
-- o gatilho de clínica nova E o backfill das 3 clínicas de teste, que têm
-- estados diferentes (Fisioterapia e Elisama só têm Administrador; Clínica Neo
-- Saúde já tem Especialista/Gerente/Recepcionista personalizados — nenhum dos
-- dois pode ser tocado, só o que falta é que entra).
create or replace function private.seed_access_profile_if_missing(
  p_clinic       uuid,
  p_name         text,
  p_is_system    boolean,
  p_feature_keys text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_id uuid;
begin
  if exists (
    select 1 from public.access_profile
     where clinic_id = p_clinic and lower(name) = lower(p_name)
  ) then
    return;
  end if;

  insert into public.access_profile (clinic_id, name, is_system)
    values (p_clinic, p_name, p_is_system)
    returning id into v_id;

  insert into public.access_profile_permission
    (clinic_id, access_profile_id, feature_key, can_view, can_edit)
  select p_clinic, v_id, k, true, true
    from unnest(p_feature_keys) as k;
end;
$fn$;

comment on function private.seed_access_profile_if_missing(uuid, text, boolean, text[]) is
  'Cria um cargo com o conjunto de features dado, só se a clínica ainda não '
  'tiver um cargo com esse NOME (case-insensitive). Bloco de montagem de '
  'seed_default_access_profiles — existe separado para o backfill poder '
  'completar só o que falta numa clínica já parcialmente configurada, sem '
  'reescrever cargo nenhum que a clínica já tenha personalizado.';

create or replace function private.seed_default_access_profiles(p_clinic uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  perform private.seed_access_profile_if_missing(
    p_clinic, 'Administrador', true,
    (select array_agg(f.key) from public.feature f where f.category = 'module')
  );
  perform private.seed_access_profile_if_missing(
    p_clinic, 'Recepcionista', false,
    array['today', 'schedule', 'patients', 'professionals']
  );
  perform private.seed_access_profile_if_missing(
    p_clinic, 'Profissional', false,
    array['today', 'schedule', 'patients']
  );
end;
$fn$;

comment on function private.seed_default_access_profiles(uuid) is
  'Semeia os 3 cargos básicos de uma clínica (Administrador/Recepcionista/'
  'Profissional) com as permissões descritas no cabeçalho deste arquivo. '
  'Idempotente POR CARGO (ver seed_access_profile_if_missing) — chamar de novo '
  'numa clínica que já tem alguns deles só completa os que faltam.';

create or replace function private.tg_seed_default_access_profiles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  perform private.seed_default_access_profiles(new.id);
  return new;
end;
$fn$;

-- Sem cláusula WHEN: todo ramo de clínica precisa de recepção e de quem
-- atende, isto não é assunto de especialidade (mesmo raciocínio do plano de
-- contas em 20260726120000_finance_category).
create trigger tr_seed_default_access_profiles
  after insert on public.clinic
  for each row
  execute function private.tg_seed_default_access_profiles();

-- Função security definer nasce executável por PUBLIC — sem os revokes,
-- qualquer sessão autenticada chamaria seed_default_access_profiles(uuid) ou
-- seed_access_profile_if_missing(...) passando o id de OUTRA clínica. Mesmo
-- tratamento de 20260725170000_higiene_seguranca e de toda função nova desta
-- leva de migrations (finance_category, cost_center).
revoke execute on function private.seed_access_profile_if_missing(uuid, text, boolean, text[]) from public;
revoke execute on function private.seed_default_access_profiles(uuid) from public;
revoke execute on function private.tg_seed_default_access_profiles() from public;

-- Backfill: as 3 clínicas de teste têm estados diferentes hoje (ver cabeçalho)
-- — a função só adiciona o que falta em cada uma, nome a nome.
select private.seed_default_access_profiles(c.id) from public.clinic c;
