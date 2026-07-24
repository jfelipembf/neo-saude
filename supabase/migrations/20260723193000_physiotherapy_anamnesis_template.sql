-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — ANAMNESE DE FISIOTERAPIA
--
-- private.seed_anamnesis_template() (20260722120200_patients.sql) só tinha
-- conteúdo pronto para odontologia; os demais ramos nasciam com o questionário
-- VAZIO de propósito ("a fatia de cada especialidade traz o seu conteúdo").
-- Este arquivo é a fatia da FISIOTERAPIA.
--
-- Reestrutura a função em NÚCLEO + SEÇÃO DO RAMO:
--   · "Saúde geral" — agora COMPARTILHADA entre odontologia e fisioterapia
--     (medicamentos, alergia, pressão, coração, cirurgia... não são perguntas
--     de dentista, são perguntas de saúde). Conteúdo IDÊNTICO ao anterior.
--   · "Saúde bucal" (odontologia) e "Avaliação fisioterapêutica" (fisioterapia)
--     são a seção específica — só uma delas entra, conforme p_specialty.
--
-- Odontologia fica byte-a-byte igual ao que já existia (mesmos códigos, textos
-- e sort_order) — isto NÃO reescreve o template já seedado da clínica existente
-- (create or replace function não toca linha já inserida); só muda o que
-- `seed_anamnesis_template` grava numa PRÓXIMA chamada.
--
-- Nutrição, psicologia e personal trainer continuam nascendo vazios — ainda
-- sem revisão clínica da área.
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
      when 'dentistry'     then 'Anamnese odontológica'
      when 'physiotherapy' then 'Avaliação fisioterapêutica'
      else 'Anamnese'
    end,
    case p_specialty
      when 'dentistry'     then 'Questionário de saúde no modelo sugerido pelos Conselhos Regionais de Odontologia.'
      when 'physiotherapy' then 'Queixa, histórico da dor ou lesão e sinais de alerta da avaliação inicial.'
      else 'Questionário de saúde. Ajuste as perguntas em Administrativo → Anamnese.'
    end,
    true
  )
  returning id into v_template;

  -- Só odontologia e fisioterapia têm questionário pronto por ora. Nutrição,
  -- psicologia e personal trainer nascem com o questionário VAZIO de propósito:
  -- inventar perguntas clínicas de uma área que ninguém revisou é pior que não
  -- ter — a fatia de cada especialidade traz o seu conteúdo.
  if p_specialty not in ('dentistry', 'physiotherapy') then
    return v_template;
  end if;

  -- "Saúde geral" é o NÚCLEO — mesma seção, mesmas perguntas, em qualquer ramo
  -- com conteúdo pronto (não são perguntas exclusivas de dentista).
  insert into public.anamnesis_section (clinic_id, template_id, title, description, sort_order)
  values (p_clinic, v_template, 'Saúde geral',
          'Condições que interferem no atendimento e na conduta clínica.', 10);

  -- Segunda seção: a do RAMO.
  insert into public.anamnesis_section (clinic_id, template_id, title, description, sort_order)
  values (
    p_clinic, v_template,
    case p_specialty when 'dentistry' then 'Saúde bucal' else 'Avaliação fisioterapêutica' end,
    case p_specialty
      when 'dentistry' then 'Queixa, histórico odontológico e hábitos de higiene.'
      else 'Queixa, histórico da dor ou lesão e sinais de alerta.'
    end,
    20
  );

  -- Perguntas do NÚCLEO — idênticas às que já existiam na "Saúde geral" de
  -- odontologia (mesmos códigos, textos, sort_order); agora reaproveitadas.
  insert into public.anamnesis_question (
    clinic_id, template_id, section_id, code, question_text, input_type,
    sort_order, detail_label, detail_shown_for
  )
  select p_clinic, v_template, s.id, q.code, q.question_text, q.input_type,
         q.sort_order, q.detail_label, q.detail_shown_for
    from (values
      ('medications',       'Está tomando algum medicamento?',           'options'::public.anamnesis_input_type,  10, 'Quais (posologia e dose)', array['yes']),
      ('allergy',           'Tem algum tipo de alergia?',                'options'::public.anamnesis_input_type,  20, 'Qual',                     array['yes']),
      ('bloodPressure',     'Sua pressão é:',                            'options'::public.anamnesis_input_type,  30, null::text,                 null::text[]),
      ('heartCondition',    'Tem ou teve algum problema de coração?',    'options'::public.anamnesis_input_type,  40, 'Qual',                     array['yes']),
      ('shortnessOfBreath', 'Sente falta de ar com frequência?',         'options'::public.anamnesis_input_type,  50, null::text,                 null::text[]),
      ('diabetes',          'Tem diabetes?',                             'options'::public.anamnesis_input_type,  60, null::text,                 null::text[]),
      ('bleeding',          'Quando se corta, o sangramento é:',         'options'::public.anamnesis_input_type,  70, null::text,                 null::text[]),
      ('healing',           'Sua cicatrização é:',                       'options'::public.anamnesis_input_type,  80, null::text,                 null::text[]),
      ('surgery',           'Já fez alguma cirurgia?',                   'options'::public.anamnesis_input_type,  90, null::text,                 null::text[]),
      ('pregnant',          'Gestante?',                                 'options'::public.anamnesis_input_type, 100, 'Semanas',                  array['yes']),
      ('healthIssues',      'Problemas de saúde que já teve',            'longText'::public.anamnesis_input_type, 110, null::text,                null::text[])
    ) as q(code, question_text, input_type, sort_order, detail_label, detail_shown_for)
    join public.anamnesis_section s
      on s.template_id = v_template and s.title = 'Saúde geral';

  -- Perguntas da seção do RAMO.
  if p_specialty = 'dentistry' then
    insert into public.anamnesis_question (
      clinic_id, template_id, section_id, code, question_text, input_type,
      sort_order, detail_label, detail_shown_for
    )
    select p_clinic, v_template, s.id, q.code, q.question_text, q.input_type,
           q.sort_order, q.detail_label, q.detail_shown_for
      from (values
        ('chiefComplaint',     'Queixa principal',                                       'longText'::public.anamnesis_input_type,  10, null::text, null::text[]),
        ('anesthesiaReaction', 'Já teve alguma reação com anestesia dental?',            'options'::public.anamnesis_input_type,   20, 'Qual',     array['yes']),
        ('lastTreatment',      'Quando foi seu último tratamento dentário?',             'text'::public.anamnesis_input_type,      30, null::text, null::text[]),
        ('toothGumPain',       'Tem sentido dor nos dentes ou na gengiva?',              'options'::public.anamnesis_input_type,   40, null::text, null::text[]),
        ('gumBleeding',        'Sua gengiva sangra?',                                    'options'::public.anamnesis_input_type,   50, null::text, null::text[]),
        ('badTasteDryMouth',   'Tem sentido gosto ruim na boca ou boca seca?',           'options'::public.anamnesis_input_type,   60, null::text, null::text[]),
        ('brushingsPerDay',    'Quantas vezes escova os dentes por dia?',                'text'::public.anamnesis_input_type,      70, null::text, null::text[]),
        ('flossing',           'Usa fio dental?',                                        'options'::public.anamnesis_input_type,   80, null::text, null::text[]),
        ('jawPainClicking',    'Sente dores ou estalos no maxilar ou no ouvido?',        'options'::public.anamnesis_input_type,   90, null::text, null::text[]),
        ('grindsTeeth',        'Range os dentes de dia ou de noite?',                    'options'::public.anamnesis_input_type,  100, null::text, null::text[]),
        ('faceSores',          'Já teve alguma ferida ou bolha na face ou nos lábios?',  'options'::public.anamnesis_input_type,  110, null::text, null::text[]),
        ('smokes',             'Fuma?',                                                  'options'::public.anamnesis_input_type,  120, 'Quantidade por dia', array['yes'])
      ) as q(code, question_text, input_type, sort_order, detail_label, detail_shown_for)
      join public.anamnesis_section s
        on s.template_id = v_template and s.title = 'Saúde bucal';
  else
    insert into public.anamnesis_question (
      clinic_id, template_id, section_id, code, question_text, input_type,
      sort_order, detail_label, detail_shown_for
    )
    select p_clinic, v_template, s.id, q.code, q.question_text, q.input_type,
           q.sort_order, q.detail_label, q.detail_shown_for
      from (values
        ('chiefComplaint',   'Queixa principal',
          'longText'::public.anamnesis_input_type, 10, null::text, null::text[]),
        ('onsetDescription', 'Como e quando o problema começou? (trauma, esforço repetitivo, cirurgia recente, início espontâneo...)',
          'longText'::public.anamnesis_input_type, 20, null::text, null::text[]),
        ('painScale',        'Intensidade da dor hoje (0 a 10)',
          'text'::public.anamnesis_input_type,     30, null::text, null::text[]),
        ('priorTreatment',   'Já fez fisioterapia ou outro tratamento para este problema?',
          'options'::public.anamnesis_input_type,  40, 'Onde/quando e com quais resultados', array['yes']),
        ('physicalActivity', 'Pratica atividade física regularmente?',
          'options'::public.anamnesis_input_type,  50, 'Qual e com que frequência', array['yes']),
        ('affectedSide',     'Lado predominantemente afetado',
          'options'::public.anamnesis_input_type,  60, null::text, null::text[]),
        ('dailyImpact',      'A queixa atrapalha suas atividades diárias ou o trabalho?',
          'options'::public.anamnesis_input_type,  70, 'Como', array['yes']),
        ('redFlags',         'Tem sentido emagrecimento sem motivo aparente, dor noturna que não passa com repouso, febre ou alteração de força/sensibilidade?',
          'options'::public.anamnesis_input_type,  80, 'Descreva', array['yes'])
      ) as q(code, question_text, input_type, sort_order, detail_label, detail_shown_for)
      join public.anamnesis_section s
        on s.template_id = v_template and s.title = 'Avaliação fisioterapêutica';
  end if;

  -- Opções Sim/Não (YesNo do domain.ts) — núcleo + as duas seções de ramo. Um
  -- código que não existir NESTE template (a outra especialidade) simplesmente
  -- não casa linha nenhuma — sem erro.
  insert into public.anamnesis_question_option (clinic_id, question_id, value, label, sort_order)
  select p_clinic, q.id, o.value, o.label, o.sort_order
    from public.anamnesis_question q
    cross join (values ('yes', 'Sim', 10), ('no', 'Não', 20)) as o(value, label, sort_order)
   where q.template_id = v_template
     and q.code in (
       'medications', 'heartCondition', 'shortnessOfBreath', 'surgery',
       'anesthesiaReaction', 'toothGumPain', 'badTasteDryMouth',
       'jawPainClicking', 'grindsTeeth', 'faceSores', 'smokes',
       'priorTreatment', 'physicalActivity', 'dailyImpact', 'redFlags'
     );

  -- Opções Sim/Não/Não sei (YesNoUnknown) — só no núcleo.
  insert into public.anamnesis_question_option (clinic_id, question_id, value, label, sort_order)
  select p_clinic, q.id, o.value, o.label, o.sort_order
    from public.anamnesis_question q
    cross join (values ('yes', 'Sim', 10), ('no', 'Não', 20), ('unknown', 'Não sei', 30)) as o(value, label, sort_order)
   where q.template_id = v_template
     and q.code in ('allergy', 'diabetes', 'pregnant');

  -- Opções próprias de cada pergunta (núcleo + odontologia + fisioterapia).
  insert into public.anamnesis_question_option (clinic_id, question_id, value, label, sort_order)
  select p_clinic, q.id, o.value, o.label, o.sort_order
    from (values
      -- BloodPressure (núcleo)
      ('bloodPressure', 'normal',           'Normal',                      10),
      ('bloodPressure', 'high',             'Alta',                        20),
      ('bloodPressure', 'low',              'Baixa',                       30),
      ('bloodPressure', 'controlled',       'Controlada com medicamento',  40),
      -- BleedingLevel (núcleo)
      ('bleeding',      'normal',           'Normal',                      10),
      ('bleeding',      'excessive',        'Excessivo',                   20),
      -- HealingLevel (núcleo)
      ('healing',       'normal',           'Normal',                      10),
      ('healing',       'complicated',      'Complicada',                  20),
      -- GumBleeding (odontologia)
      ('gumBleeding',   'no',               'Não',                         10),
      ('gumBleeding',   'yes',              'Sim',                         20),
      ('gumBleeding',   'during_brushing',  'Durante a higiene',           30),
      ('gumBleeding',   'sometimes',        'Às vezes',                    40),
      -- FlossUse (odontologia)
      ('flossing',      'daily',            'Diariamente',                 10),
      ('flossing',      'sometimes',        'Às vezes',                    20),
      ('flossing',      'no',               'Não usa',                     30),
      -- AffectedSide (fisioterapia)
      ('affectedSide',  'right',            'Direito',                     10),
      ('affectedSide',  'left',             'Esquerdo',                    20),
      ('affectedSide',  'both',             'Ambos',                       30),
      ('affectedSide',  'not_applicable',   'Não se aplica',               40)
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
       ('anesthesiaReaction', 'yes'),
       ('redFlags',           'yes')
     );

  return v_template;
end;
$$;

comment on function private.seed_anamnesis_template(uuid, public.clinic_specialty) is
  'Cria o questionário padrão da clínica. "Saúde geral" é o núcleo (compartilhado); '
  'a segunda seção é do ramo (Saúde bucal / Avaliação fisioterapêutica). Nutrição, '
  'psicologia e personal trainer ainda nascem vazios. Chamar UMA vez no onboarding.';

-- ─────────────────────────────────────────────────────────────────────────────
-- BACKFILL: a clínica de fisioterapia já provisionada tinha o template VAZIO
-- (seedado antes desta função existir). Sem paciente com ficha usando-o ainda
-- — troca segura: apaga o vazio e semeia de novo com a função atualizada.
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare
  v_clinic uuid := 'd3110000-0000-4000-8000-000000000002';
  v_old    uuid;
begin
  select id into v_old from public.anamnesis_template where clinic_id = v_clinic and specialty = 'physiotherapy';

  if v_old is not null and not exists (select 1 from public.anamnesis where template_id = v_old) then
    delete from public.anamnesis_template where id = v_old;
    perform private.seed_anamnesis_template(v_clinic, 'physiotherapy');
  end if;
end $$;
