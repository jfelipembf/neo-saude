-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — CATÁLOGO DE MODELOS DE EVOLUÇÃO (o "um clique" do prontuário)
--
-- Com o SOAP estruturado (20260725190000), escrever uma evolução passou a ser
-- preencher quatro campos. Fisioterapeuta atende de 30 em 30 minutos: digitar
-- os mesmos cabeçalhos de "Avaliação inicial" a cada primeira consulta é
-- exatamente o atrito que faz a evolução não ser escrita. Este catálogo é a
-- resposta: modelos prontos por tipo de atendimento, um clique preenche as
-- quatro seções e o profissional edita por cima.
--
-- O modelo guarda uma nota SOAP no MESMO formato do prontuário
-- (private.is_soap_note, a mesma função de CHECK) — carregar um modelo é
-- copiar `note` pra `clinical_note`, sem conversão nenhuma no meio. Se o
-- formato do prontuário mudar um dia, o catálogo quebra junto e alguém
-- conserta os dois — melhor do que dois formatos que divergem em silêncio.
--
-- Desenho copiado de physio_test (20260724120000 + 20260724210000), inclusive
-- os dois bugs que já custaram correção lá:
--   · is_seed FORA do grant de update — proteção que mora só na policy, com a
--     coluna gravável pelo cliente, é proteção de papel: bastava um PATCH
--     is_seed=false pra apagar o catálogo de referência.
--   · escrita (insert/update/delete) exige 'admin', não 'patients' — quem
--     atende usa o modelo, quem administra a clínica é que mexe no catálogo.
--   · revoke ALL de authenticated antes dos grants por coluna: o Supabase dá
--     grant TABLE-WIDE por default privileges em toda tabela nova do schema
--     public, e sem o revoke os grants por coluna abaixo seriam decorativos
--     (foi o que aconteceu com physio_test, que ficou com INSERT table-wide).
--
-- Depende de: 20260725190000_clinical_note_soap.sql (private.is_soap_note),
--             01-fundacao (clinic, profile, auth_clinic_ids, can_access_feature,
--             can_edit_feature, tg_touch_updated_at, tg_audit).
-- ═════════════════════════════════════════════════════════════════════════════

create table public.evolution_template (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinic(id) on delete cascade,
  name        text not null,
  description text,
  -- Mesma forma de appointment.clinical_note: objeto com as chaves
  -- subjective/objective/assessment/plan, valor = HTML da seção. Um modelo
  -- pode preencher só parte das seções (uma sessão de terapia manual quase não
  -- tem "Objetivo" a padronizar) — chave ausente = seção que o modelo não toca.
  note        jsonb not null,
  is_seed     boolean not null default false,
  status      public.active_status not null default 'active',
  -- Quem cadastrou. SET NULL: o modelo é da clínica, não da pessoa — se ela
  -- sai, o catálogo continua (mesmo padrão de sale.created_by/task.created_by).
  created_by  uuid default auth.uid() references public.profile(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint evolution_template_name_not_blank_ck check (btrim(name) <> ''),
  -- Mesmo contrato do prontuário — o modelo não pode gerar uma nota que a
  -- própria appointment recusaria.
  constraint evolution_template_note_shape_ck check (private.is_soap_note(note)),
  -- Alvo de FK composta futura (um dia a evolução pode registrar de qual
  -- modelo nasceu), mesmo padrão de physio_test_id_clinic_uk.
  constraint evolution_template_id_clinic_uk unique (id, clinic_id)
);

comment on table public.evolution_template is
  'Modelos de evolução SOAP por clínica — o catálogo do botão "usar modelo" do '
  'prontuário. Cada linha guarda uma nota no formato de '
  'appointment.clinical_note; aplicar o modelo é copiar `note` por cima das '
  'seções vazias. Clínica de fisioterapia nasce com um catálogo de referência '
  '(is_seed) semeado por trigger.';

comment on column public.evolution_template.note is
  'Nota SOAP do modelo — objeto jsonb com as chaves subjective/objective/'
  'assessment/plan (valor = HTML da seção), validado pela MESMA '
  'private.is_soap_note do prontuário. Seção que o modelo não padroniza fica '
  'ausente do objeto.';

comment on column public.evolution_template.is_seed is
  'true = modelo de referência que veio pronto no sistema — pode ser editado e '
  'inativado, nunca excluído (a policy de delete exige is_seed = false e a '
  'coluna está FORA do grant de update, senão o cliente desmarcaria a '
  'proteção antes de apagar). false = modelo criado pela própria clínica.';

comment on column public.evolution_template.status is
  'inactive = some do menu de modelos sem sumir do catálogo — é como a clínica '
  '"remove" um modelo de referência que não usa, já que excluir é proibido.';

-- Dois "Avaliação inicial" na mesma clínica é typo, não modelo novo
-- (mesmo raciocínio de physio_test_name_uk).
create unique index evolution_template_name_uk
  on public.evolution_template (clinic_id, lower(name));

-- O menu de modelos lista só os ativos, em ordem alfabética.
create index evolution_template_active_idx
  on public.evolution_template (clinic_id, name)
  where status = 'active';

-- Cobertura da FK de created_by (o linter de FK sem índice reclama sem isto).
create index evolution_template_created_by_idx
  on public.evolution_template (created_by)
  where created_by is not null;

create trigger tr_touch before update on public.evolution_template
  for each row execute function private.tg_touch_updated_at();
create trigger tr_audit after insert or update or delete on public.evolution_template
  for each row execute function private.tg_audit();

alter table public.evolution_template enable row level security;

-- ── GRANTs por coluna ────────────────────────────────────────────────────────
-- O revoke all é o passo que faz os grants abaixo valerem alguma coisa: sem
-- ele authenticated já chega com arwdDxtm table-wide (default privileges do
-- Supabase) e is_seed/created_by seriam graváveis pelo cliente.
revoke all on public.evolution_template from anon, authenticated;

grant select on public.evolution_template to authenticated;
grant insert (clinic_id, name, description, note, status)
  on public.evolution_template to authenticated;
grant update (name, description, note, status)
  on public.evolution_template to authenticated;
grant delete on public.evolution_template to authenticated;
-- is_seed: fora dos dois grants de propósito (ver comment on column).
-- created_by: fora de propósito também — quem criou vem do default auth.uid(),
-- não de um campo que o cliente manda (mesmo motivo de patient_document.uploaded_by).

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Leitura por 'admin' OU 'patients': a tela do catálogo é do Administrativo,
-- mas quem escreve a evolução no prontuário do paciente precisa listar os
-- modelos (mesmo par de features de physio_test_select).
create policy evolution_template_select on public.evolution_template
  for select to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_access_feature(clinic_id, 'admin', 'patients')
  );

create policy evolution_template_insert on public.evolution_template
  for insert to authenticated
  with check (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  );

create policy evolution_template_update on public.evolution_template
  for update to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
  )
  with check (clinic_id = any(private.auth_clinic_ids()));

-- Modelo de referência não se apaga (is_seed = false), só se inativa — a
-- distinção mora na policy, a parede real, não escondida na tela.
create policy evolution_template_delete on public.evolution_template
  for delete to authenticated
  using (
    clinic_id = any(private.auth_clinic_ids())
    and private.can_edit_feature(clinic_id, 'admin')
    and is_seed = false
  );

-- ── Semeadura ────────────────────────────────────────────────────────────────

create or replace function private.seed_evolution_templates(p_clinic uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  -- Não sobrescreve: se a clínica já tem QUALQUER modelo (seed anterior ou
  -- cadastro manual), não mexe em nada — mesma guarda de
  -- private.seed_physio_test_catalog.
  if exists (select 1 from public.evolution_template where clinic_id = p_clinic) then
    return;
  end if;

  -- Conteúdo curto e de ESTRUTURA, não de conduta: cabeçalhos que o
  -- fisioterapeuta completa. Modelo que já vem com texto clínico pronto ou
  -- vira ruído (ninguém lê) ou vira evolução falsa (alguém salva sem editar).
  -- Nada aqui reproduz instrumento licenciado — são as seções do SOAP
  -- aplicadas ao tipo de atendimento.
  insert into public.evolution_template (clinic_id, name, description, note, is_seed)
  select p_clinic, t.name, t.description, t.note, true
    from (values
      (
        'Avaliação inicial',
        'Primeira consulta: queixa, exame físico e definição do plano terapêutico.',
        jsonb_build_object(
          'subjective', '<p>Queixa principal: </p><p>Início e evolução dos sintomas: </p><p>Dor em repouso e em movimento (0 a 10): </p><p>Histórico de saúde, cirurgias e medicações em uso: </p>',
          'objective',  '<p>Inspeção e postura: </p><p>Amplitude de movimento: </p><p>Força muscular: </p><p>Testes aplicados e resultados: </p>',
          'assessment', '<p>Hipótese diagnóstica fisioterapêutica: </p><p>Fatores limitantes e prognóstico: </p>',
          'plan',       '<p>Objetivos de curto e médio prazo: </p><p>Conduta proposta e frequência semanal: </p><p>Orientações domiciliares: </p>'
        )
      ),
      (
        'Sessão de cinesioterapia',
        'Atendimento de exercício terapêutico: o que foi executado e como o paciente respondeu.',
        jsonb_build_object(
          'subjective', '<p>Relato do paciente desde a última sessão: </p><p>Dor antes da sessão (0 a 10): </p>',
          'objective',  '<p>Exercícios realizados, séries e repetições: </p><p>Carga e progressão aplicada: </p><p>Resposta durante a execução: </p>',
          'assessment', '<p>Tolerância ao esforço e qualidade do movimento: </p>',
          'plan',       '<p>Progressão para a próxima sessão: </p><p>Exercícios domiciliares: </p>'
        )
      ),
      (
        'Reavaliação',
        'Comparativo com a avaliação anterior e ajuste do plano terapêutico.',
        jsonb_build_object(
          'subjective', '<p>Percepção do paciente sobre a evolução: </p><p>Dor atual comparada à avaliação anterior: </p>',
          'objective',  '<p>Medidas repetidas (amplitude, força, perimetria): </p><p>Testes reaplicados e resultados: </p>',
          'assessment', '<p>Comparativo com a avaliação anterior: </p><p>Objetivos atingidos e pendentes: </p>',
          'plan',       '<p>Ajuste do plano terapêutico: </p><p>Nova previsão de sessões: </p>'
        )
      ),
      (
        'Sessão de pilates clínico',
        'Aula individual ou em turma: repertório, controle motor e progressão.',
        jsonb_build_object(
          'subjective', '<p>Relato do aluno e queixas do dia: </p>',
          'objective',  '<p>Aparelhos e molas utilizados: </p><p>Exercícios e repetições: </p><p>Padrão respiratório e ativação do centro de força: </p>',
          'assessment', '<p>Controle motor, alinhamento e compensações observadas: </p>',
          'plan',       '<p>Progressão de repertório e carga: </p><p>Orientações para a próxima aula: </p>'
        )
      ),
      (
        'Reabilitação pós-operatória',
        'Acompanhamento por fases do protocolo, com restrições e critérios de progressão.',
        jsonb_build_object(
          'subjective', '<p>Cirurgia realizada e data: </p><p>Dor, edema e sono na última semana: </p><p>Restrições indicadas pelo cirurgião: </p>',
          'objective',  '<p>Aspecto da cicatriz e edema: </p><p>Amplitude permitida x amplitude obtida: </p><p>Marcha e uso de dispositivo auxiliar: </p>',
          'assessment', '<p>Fase do protocolo pós-operatório e aderência: </p>',
          'plan',       '<p>Condutas da fase atual: </p><p>Critérios para avançar de fase: </p><p>Cuidados e orientações domiciliares: </p>'
        )
      ),
      (
        'Sessão de terapia manual',
        'Mobilização, liberação e alívio de dor, com medida antes e depois.',
        jsonb_build_object(
          'subjective', '<p>Localização e característica da dor referida hoje: </p><p>Dor antes da sessão (0 a 10): </p>',
          'objective',  '<p>Segmentos tratados e técnicas aplicadas: </p><p>Tempo e intensidade: </p><p>Dor após a sessão (0 a 10): </p>',
          'assessment', '<p>Resposta imediata ao tratamento: </p>',
          'plan',       '<p>Manutenção do resultado e exercícios associados: </p><p>Intervalo até a próxima sessão: </p>'
        )
      ),
      (
        'Reabilitação neurofuncional',
        'Paciente neurológico: tônus, equilíbrio, marcha e ganho funcional.',
        jsonb_build_object(
          'subjective', '<p>Relato do paciente ou do acompanhante: </p><p>Intercorrências desde a última sessão: </p>',
          'objective',  '<p>Tônus, sensibilidade e equilíbrio: </p><p>Transferências e marcha: </p><p>Atividades funcionais treinadas: </p>',
          'assessment', '<p>Ganho funcional observado e nível de assistência necessário: </p>',
          'plan',       '<p>Treino funcional da próxima sessão: </p><p>Orientações ao cuidador: </p>'
        )
      ),
      (
        'Alta fisioterapêutica',
        'Encerramento do tratamento: resultado alcançado, orientações e retorno.',
        jsonb_build_object(
          'subjective', '<p>Percepção do paciente sobre o resultado do tratamento: </p><p>Sintomas residuais: </p>',
          'objective',  '<p>Medidas finais comparadas à avaliação inicial: </p><p>Número de sessões realizadas: </p>',
          'assessment', '<p>Objetivos alcançados e justificativa da alta: </p>',
          'plan',       '<p>Programa de manutenção domiciliar: </p><p>Sinais de alerta para retorno: </p><p>Retorno para reavaliação em: </p>'
        )
      )
    ) as t(name, description, note);
end;
$fn$;

comment on function private.seed_evolution_templates(uuid) is
  'Semeia o catálogo de referência de modelos de evolução de uma clínica de '
  'fisioterapia. Idempotente por presença: não faz nada se a clínica já tem '
  'qualquer modelo.';

-- Trigger PRÓPRIO, e não uma quarta chamada dentro de
-- private.tg_seed_physio_test_catalog: aquele trigger semeia CATÁLOGO DE
-- TESTES (escalas, goniometria, faixas de pontuação) e ainda marca is_seed em
-- physio_test no final. Pendurar modelos de evolução ali deixaria o nome
-- mentindo sobre o que a função faz, e o dia em que alguém mexer nos testes
-- mexe sem querer no prontuário.
create or replace function private.tg_seed_evolution_templates()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  perform private.seed_evolution_templates(new.id);
  return new;
end;
$fn$;

-- Função security definer nasce executável por PUBLIC — sem estes revokes,
-- qualquer sessão autenticada chamaria seed_evolution_templates(uuid) passando
-- o id de OUTRA clínica. Mesmo tratamento de 20260725170000_higiene_seguranca.
revoke execute on function private.seed_evolution_templates(uuid) from public;
revoke execute on function private.tg_seed_evolution_templates() from public;

create trigger tr_seed_evolution_templates
  after insert on public.clinic
  for each row
  when (new.specialty = 'physiotherapy')
  execute function private.tg_seed_evolution_templates();

-- Clínicas de fisioterapia que já existem nasceram antes do trigger — a mesma
-- função resolve (é idempotente, quem já tiver modelo não é tocado).
select private.seed_evolution_templates(c.id)
  from public.clinic c
 where c.specialty = 'physiotherapy';
