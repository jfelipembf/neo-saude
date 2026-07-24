-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — SEED DE FISIOTERAPIA: GONIOMETRIA + PROTEÇÃO is_seed
--
-- Dois furos no provisionamento de clínica de fisioterapia, achados ao criar
-- um tenant novo e comparar com o antigo:
--
-- 1) GONIOMETRIA NÃO ERA SEMEADA. seed_physio_test_catalog() só insere os 33
--    testes de ESCALA — nenhuma menção a goniometria. Os 7 testes de
--    goniometria da clínica piloto foram cadastrados À MÃO pela tela; nenhuma
--    migration os inseriu. Resultado: toda clínica nova nascia sem o catálogo
--    de goniometria, apesar de o app trazer a medição inteira por foto
--    (GoniometryPhoto + utils/goniometry.ts).
--
--    Detalhe que despistava: 20260724210000 rodou `update physio_test set
--    is_seed = true` em tudo, com o comentário "todo teste já cadastrado até
--    aqui veio do seed". Não era verdade — isso carimbou os 7 feitos à mão
--    como catálogo oficial, escondendo a lacuna.
--
-- 2) O SEED NÃO MARCAVA is_seed. seed_physio_test_catalog() insere sem setar a
--    coluna, então valia o default `false`. A migration que criou is_seed só
--    fez backfill do que já existia. Consequência: em toda clínica criada
--    DEPOIS dela, os 33 testes de referência entram como "personalizados" e a
--    policy physio_test_delete deixa a clínica APAGAR o próprio catálogo.
--
-- Depende de: 20260724140000_physio_test_starter_catalog.sql (seed das escalas),
--             20260724210000_physio_test_is_seed_and_delete.sql (is_seed).
-- ═════════════════════════════════════════════════════════════════════════════

-- ── 1. Catálogo de goniometria, idempotente ─────────────────────────────────
-- Função IRMÃ de seed_physio_test_catalog (que continua sendo só as escalas),
-- e não uma reescrita dela: o corpo daquela tem ~300 linhas de conteúdo
-- clínico que não precisa ser re-emitido para acrescentar 7 testes.
-- Idempotente por NOME, então serve tanto para clínica nova quanto p/ backfill.
create or replace function private.seed_physio_goniometry_catalog(p_clinic uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.physio_test (clinic_id, name, specialty, kind, is_seed, instructions)
  select p_clinic, t.name, t.specialty, 'goniometry'::public.physio_test_kind, true, t.instructions
    from (values
      ('Goniometria — Flexão de Ombro', 'Ortopédica',
        'Paciente sentado ou em pé, braço ao lado do corpo. Fotografe de lado e posicione os 3 pontos: A na crista ilíaca (referência do tronco), o vértice no acrômio (ombro), e C no epicôndilo lateral do úmero (cotovelo) — o ângulo entre os dois segmentos é a amplitude de flexão.'),
      ('Goniometria — Abdução de Ombro', 'Ortopédica',
        'Paciente sentado ou em pé, braço ao lado do corpo. Fotografe de frente e posicione os 3 pontos: A no quadril (referência do tronco), o vértice no acrômio (ombro), e C no epicôndilo lateral do úmero (cotovelo) — o ângulo entre os dois segmentos é a amplitude de abdução.'),
      ('Goniometria — Flexão de Cotovelo', 'Ortopédica',
        'Paciente sentado, braço estendido ao lado do corpo com a palma voltada para cima. Fotografe de lado e posicione os 3 pontos: A no acrômio (ombro), o vértice no epicôndilo lateral do úmero (cotovelo), e C no processo estiloide do rádio (punho) — o ângulo entre os dois segmentos é a amplitude de flexão.'),
      ('Goniometria — Flexão de Quadril', 'Ortopédica',
        'Paciente em decúbito dorsal, membro inferior estendido. Fotografe de lado e posicione os 3 pontos: A na linha média axilar da última costela (referência do tronco), o vértice no trocânter maior (quadril), e C no côndilo lateral do fêmur (joelho) — o ângulo entre os dois segmentos é a amplitude de flexão.'),
      ('Goniometria — Flexão de Joelho', 'Ortopédica',
        'Posicione o paciente em decúbito ventral ou sentado, com o segmento a medir bem visível na foto (coxa e perna alinhadas lateralmente, sem obstruções). Fotografe e posicione os 3 pontos: A no meio da coxa (fêmur), o vértice no côndilo lateral do joelho, e C no maléolo lateral (fíbula) — o ângulo entre os dois segmentos é a amplitude de flexão.'),
      ('Goniometria — Extensão de Joelho', 'Ortopédica',
        'Paciente em decúbito dorsal ou sentado, joelho o mais estendido possível. Fotografe de lado e posicione os 3 pontos: A no meio da coxa (fêmur), o vértice no côndilo lateral do joelho, e C no maléolo lateral (fíbula) — o ângulo é o quanto falta para a extensão completa (0° = extensão total, sem déficit).'),
      ('Goniometria — Dorsiflexão de Tornozelo', 'Ortopédica',
        'Paciente sentado, joelho a 90°, pé relaxado. Fotografe de lado e posicione os 3 pontos: A na cabeça da fíbula (referência da perna), o vértice no maléolo lateral (tornozelo), e C na base do 5º metatarso (pé) — o ângulo entre os dois segmentos é a amplitude de dorsiflexão.')
    ) as t(name, specialty, instructions)
   where not exists (
     select 1 from public.physio_test pt
      where pt.clinic_id = p_clinic and pt.name = t.name
   );

  -- Em goniometria o NÍVEL é a interpretação da faixa de graus (ver o comentário
  -- de physio_test.kind em 20260724130000).
  insert into public.physio_test_level (clinic_id, test_id, name, description, sort_order)
  select p_clinic, pt.id, lv.level_name, lv.description, lv.sort_order
    from (values
      ('Goniometria — Flexão de Ombro', '0° – 90°', 'Amplitude limitada — abaixo do necessário para alcançar acima da cabeça', 10),
      ('Goniometria — Flexão de Ombro', '90° – 150°', 'Amplitude parcial — funcional para a maioria das AVDs', 20),
      ('Goniometria — Flexão de Ombro', '150° – 180°', 'Amplitude normal (referência geral)', 30),

      ('Goniometria — Abdução de Ombro', '0° – 90°', 'Amplitude limitada — abaixo do necessário para alcançar acima da cabeça', 10),
      ('Goniometria — Abdução de Ombro', '90° – 150°', 'Amplitude parcial — funcional para a maioria das AVDs', 20),
      ('Goniometria — Abdução de Ombro', '150° – 180°', 'Amplitude normal (referência geral)', 30),

      ('Goniometria — Flexão de Cotovelo', '0° – 90°', 'Amplitude limitada — abaixo do necessário para levar a mão à boca', 10),
      ('Goniometria — Flexão de Cotovelo', '90° – 130°', 'Amplitude parcial — funcional para a maioria das AVDs', 20),
      ('Goniometria — Flexão de Cotovelo', '130° – 150°', 'Amplitude normal (referência geral)', 30),

      ('Goniometria — Flexão de Quadril', '0° – 60°', 'Amplitude limitada — abaixo do necessário para sentar confortavelmente', 10),
      ('Goniometria — Flexão de Quadril', '60° – 100°', 'Amplitude parcial — funcional para a maioria das AVDs', 20),
      ('Goniometria — Flexão de Quadril', '100° – 120°', 'Amplitude normal (referência geral)', 30),

      ('Goniometria — Flexão de Joelho', '0° – 90°', 'Amplitude limitada — abaixo da flexão funcional para caminhar/subir escadas', 10),
      ('Goniometria — Flexão de Joelho', '90° – 120°', 'Amplitude parcial — funcional para a maioria das AVDs', 20),
      ('Goniometria — Flexão de Joelho', '120° – 135°', 'Amplitude normal (referência geral)', 30),

      ('Goniometria — Extensão de Joelho', '0°', 'Extensão completa (normal)', 10),
      ('Goniometria — Extensão de Joelho', '1° – 15°', 'Déficit leve de extensão (contratura em flexão leve)', 20),
      ('Goniometria — Extensão de Joelho', '> 15°', 'Déficit importante de extensão', 30),

      ('Goniometria — Dorsiflexão de Tornozelo', '< 0°', 'Limitação importante (padrão de pé equino)', 10),
      ('Goniometria — Dorsiflexão de Tornozelo', '0° – 10°', 'Amplitude parcial', 20),
      ('Goniometria — Dorsiflexão de Tornozelo', '10° – 20°', 'Amplitude normal (referência geral)', 30)
    ) as lv(test_name, level_name, description, sort_order)
    join public.physio_test pt
      on pt.clinic_id = p_clinic and pt.name = lv.test_name
   where not exists (
     select 1 from public.physio_test_level l
      where l.test_id = pt.id and l.name = lv.level_name
   );
end;
$$;

comment on function private.seed_physio_goniometry_catalog(uuid) is
  'Semeia os testes de GONIOMETRIA (kind=goniometry) do catálogo de referência. '
  'Irmã de seed_physio_test_catalog (que cobre só as escalas). Idempotente por '
  'nome do teste e do nível — pode rodar em clínica nova ou em backfill.';

revoke execute on function private.seed_physio_goniometry_catalog(uuid) from public;

-- ── 2. Trigger passa a semear os DOIS catálogos e a proteger o resultado ────
create or replace function private.tg_seed_physio_test_catalog()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.seed_physio_test_catalog(new.id);       -- escalas
  perform private.seed_physio_goniometry_catalog(new.id); -- goniometria
  -- Tudo que acabou de entrar é catálogo de REFERÊNCIA. Marcar aqui (e não
  -- dentro de cada seeder) resolve de uma vez o default `false` que deixava o
  -- catálogo apagável pela clínica — e é seguro porque a clínica acabou de
  -- nascer: não existe teste personalizado dela para ser marcado por engano.
  update public.physio_test set is_seed = true where clinic_id = new.id;
  return new;
end;
$$;

-- ── 3. Backfill das clínicas de fisioterapia já existentes ──────────────────
do $$
declare
  c record;
begin
  for c in select id from public.clinic where specialty = 'physiotherapy' loop
    perform private.seed_physio_goniometry_catalog(c.id);
    -- Só o catálogo de referência: um teste que a clínica criou pela tela
    -- (nome fora do catálogo) continua is_seed = false e apagável.
    update public.physio_test t
       set is_seed = true
     where t.clinic_id = c.id
       and t.is_seed = false
       and (t.kind = 'goniometry' or exists (
             select 1 from public.physio_test ref
              where ref.name = t.name and ref.is_seed = true and ref.clinic_id <> t.clinic_id
           ));
  end loop;
end;
$$;
