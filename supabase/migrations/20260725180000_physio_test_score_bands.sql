-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — ESCORE NO CATÁLOGO DE TESTES DE FISIOTERAPIA
--
-- Hoje o banco guarda só a FAIXA atingida (level_id/level_name/level_description).
-- Quem aplica o TUG cronometra 14 segundos e o 14 SE PERDE: o profissional lê a
-- tabela de faixas de cabeça e escolhe "10 – 19 segundos" num Select. Isso custa
-- caro em três frentes:
--   • evolução — não dá para traçar a curva do paciente (14 s → 11 s → 9 s),
--     só o degrau da faixa, que muitas vezes não muda entre sessões;
--   • erro humano — a classificação é feita a olho, sem conferência do banco;
--   • auditoria — não há como reconferir uma classificação antiga.
--
-- Esta migration dá ESCORE ao catálogo: cada faixa passa a declarar seus limites
-- numéricos e o resultado passa a guardar o valor cru medido/somado.
--
-- ── DECISÃO 1: score é a coluna ÚNICA; measured_angle vira LEGADO ────────────
-- measured_angle (goniometria) já é exatamente este conceito — o valor cru da
-- medição. Manter as duas como colunas de primeira classe seria duplicar o dado
-- e abrir divergência (qual vale se discordarem?). Então:
--   • patient_test_result.score passa a ser o valor cru de TODO teste — segundos
--     no TUG, pontos no Berg, metros no TC6 e GRAUS na goniometria;
--   • measured_angle fica como ESPELHO DEPRECIADO, só para a tela atual (que
--     ainda escreve/lê measured_angle) continuar funcionando até a fatia de tela
--     migrar para score. A ponte é um trigger BEFORE (ver abaixo), que é a única
--     forma de garantir que as duas nunca divirjam enquanto coexistem;
--   • a coluna measured_angle sai do banco na fatia de tela.
-- Optar por "as duas convivem para sempre" foi descartado: obrigaria toda
-- consulta de evolução a fazer coalesce(score, measured_angle) e deixaria o
-- catálogo de goniometria fora de physio_test_level_for_score.
--
-- ── DECISÃO 2: semântica da faixa [min_score, max_score] ────────────────────
-- Faixa FECHADA nos dois lados; NULL = aberta naquele lado. Quando duas faixas
-- vizinhas compartilham o limite, o limite pertence à faixa de MAIOR sort_order
-- (a função ordena por sort_order desc) — é o que faz "< 10 segundos" seguido de
-- "10 – 19 segundos" classificar 10 s como a segunda, sem deixar buraco entre as
-- duas.
--
-- ── DECISÃO 3: como os limites foram escritos ───────────────────────────────
-- Os nomes das faixas semeadas usam formatos incompatíveis entre si na MESMA
-- tabela ("21 – 40 pontos", "≥ 90% LSI", "> 3,2 – 5,1", "< 300 m",
-- "Nível 13 ou mais"), então NÃO dá para derivar limite de nome — cada faixa foi
-- escrita à mão, por nome de teste + nome de faixa. Duas convenções:
--   • instrumento de escore INTEIRO (pontos, graus da escala, níveis): o limite
--     é literalmente o do nome — Berg "21 – 40 pontos" → [21, 40];
--   • instrumento CONTÍNUO (segundos, metros, %, índices decimais): o max de uma
--     faixa é o MIN da seguinte, para que nenhum valor intermediário fique órfão
--     — TUG "10 – 19 segundos" → [10, 20], porque 19,4 s existe e precisa cair
--     em alguma faixa. Ler [10, 20] como "de 10 até logo antes de 20".
-- Faixa não numérica ficou com os dois limites NULL (ver bloco comentado no fim
-- da lista) e a função simplesmente não a considera.
--
-- Depende de: 20260724140000_physio_test_starter_catalog.sql (seed das escalas),
--             20260725140000_seed_goniometry_and_is_seed.sql (seed goniometria).
-- ═════════════════════════════════════════════════════════════════════════════

-- ── 1. Limites numéricos da faixa ───────────────────────────────────────────
alter table public.physio_test_level
  add column min_score numeric,
  add column max_score numeric;

comment on column public.physio_test_level.min_score is
  'Limite INFERIOR da faixa, INCLUSIVO. NULL = faixa aberta para baixo (ex.: '
  '"< 300 m"). Quando o min desta faixa é igual ao max da anterior, o valor do '
  'limite pertence a ESTA faixa (a de maior sort_order).';

comment on column public.physio_test_level.max_score is
  'Limite SUPERIOR da faixa, INCLUSIVO. NULL = faixa aberta para cima (ex.: '
  '"≥ 90% LSI"). Em instrumento contínuo (segundos/metros/%) o max é o min da '
  'faixa seguinte — leia como "até logo antes dela", já que o limite exato cai '
  'na faixa de maior sort_order. Os dois limites NULL = faixa não numérica '
  '(classificação qualitativa), ignorada por private.physio_test_level_for_score.';

-- physio_test_level tem GRANT de TABELA (insert/select/delete) para authenticated
-- — conferido em information_schema.table_privileges — então as colunas novas já
-- nascem gravável/legíveis. Não há update: a tela de Testes reescreve as faixas
-- apagando e reinserindo (testsService.saveTestLevels), então insert basta.

-- ── 2. O escore cru do resultado ────────────────────────────────────────────
alter table public.patient_test_result
  add column score numeric;

comment on column public.patient_test_result.score is
  'Valor CRU medido/somado nesta aplicação, na unidade do teste: segundos no '
  'TUG, pontos no Berg, metros no TC6, GRAUS na goniometria. É a coluna única '
  'do escore — measured_angle é espelho depreciado (some na fatia de tela). '
  'NULL quando o teste não produz número (classificação qualitativa).';

comment on column public.patient_test_result.measured_angle is
  'DEPRECIADO — use score. Espelho do escore para kind=goniometry, mantido em '
  'sincronia por tr_sync_score enquanto a tela atual ainda escreve/lê esta '
  'coluna. Será removido quando a tela migrar para score.';

-- Backfill: todo ângulo já registrado é escore.
update public.patient_test_result
   set score = measured_angle
 where score is null and measured_angle is not null;

-- patient_test_result tem update por COLUNA (não table-wide) — a tela quebraria
-- ao editar um resultado com a RLS passando e o GRANT barrando. insert/select
-- vêm do grant de tabela; só o update precisa da coluna nova nomeada.
grant update (score) on public.patient_test_result to authenticated;

-- Ponte temporária entre score e measured_angle. Existe só porque as duas
-- colunas coexistem por uma fatia: a cópia é assimétrica de propósito —
-- measured_angle alimenta score sempre, mas score só volta para measured_angle
-- quando o teste É goniometria, senão os 14 segundos de um TUG virariam "14°"
-- e o card desenharia uma régua de goniômetro sobre um teste de escala.
create or replace function private.tg_patient_test_result_sync_score()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.score is null then
    new.score := new.measured_angle;
  elsif new.measured_angle is null
    and (select t.kind from public.physio_test t where t.id = new.test_id) = 'goniometry'
  then
    new.measured_angle := new.score;
  end if;
  return new;
end;
$$;

comment on function private.tg_patient_test_result_sync_score() is
  'PONTE TEMPORÁRIA score ⇄ measured_angle enquanto as duas colunas coexistem. '
  'Some junto com measured_angle na fatia de tela.';

create trigger tr_sync_score
  before insert or update on public.patient_test_result
  for each row execute function private.tg_patient_test_result_sync_score();

-- ── 3. Faixa que contém o escore ────────────────────────────────────────────
create or replace function private.physio_test_level_for_score(p_test uuid, p_score numeric)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select l.id
    from public.physio_test_level l
   where l.test_id = p_test
     -- Faixa sem NENHUM limite é qualitativa (Ritchie, PEDI, PERFECT, GMFCS):
     -- sem este filtro ela casaria com QUALQUER escore, porque as duas
     -- comparações abaixo são verdadeiras quando o limite é NULL.
     and (l.min_score is not null or l.max_score is not null)
     and (l.min_score is null or p_score >= l.min_score)
     and (l.max_score is null or p_score <= l.max_score)
   -- Limite compartilhado entre faixas vizinhas pertence à de MAIOR sort_order.
   order by l.sort_order desc
   limit 1;
$$;

comment on function private.physio_test_level_for_score(uuid, numeric) is
  'Devolve o level_id da faixa de p_test que contém p_score. NULL quando o teste '
  'não tem faixa numérica ou quando o escore está fora de todas elas (aí a tela '
  'mantém a escolha manual — melhor não classificar do que classificar errado).';

revoke execute on function private.physio_test_level_for_score(uuid, numeric) from public;

-- ── 4. Os limites, faixa por faixa ──────────────────────────────────────────
-- Aplicável a QUALQUER clínica (o catálogo é por clínica): casa por nome de
-- teste + nome de faixa. Idempotente — o `is distinct from` no fim evita
-- reescrever linha que já está certa (e com isso evita ruído no tr_audit).
create or replace function private.apply_physio_test_score_bands(p_clinic uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.physio_test_level l
     set min_score = b.min_score,
         max_score = b.max_score
    from (values
      -- ══ Instrumentos de escore INTEIRO — limite literal do nome ═══════════
      -- Berg
      ('Escala de Equilíbrio de Berg', '0 – 20 pontos', 0::numeric, 20::numeric),
      ('Escala de Equilíbrio de Berg', '21 – 40 pontos', 21, 40),
      ('Escala de Equilíbrio de Berg', '41 – 56 pontos', 41, 56),
      -- PBS
      ('Escala de Equilíbrio Pediátrica (PBS)', '0 – 20 pontos', 0, 20),
      ('Escala de Equilíbrio Pediátrica (PBS)', '21 – 40 pontos', 21, 40),
      ('Escala de Equilíbrio Pediátrica (PBS)', '41 – 56 pontos', 41, 56),
      -- Fugl-Meyer (0–100; o catálogo não nomeia faixa para 100 — ver relatório)
      ('Escala de Fugl-Meyer — Domínio Motor', '< 50 pontos', null, 49),
      ('Escala de Fugl-Meyer — Domínio Motor', '50 – 84 pontos', 50, 84),
      ('Escala de Fugl-Meyer — Domínio Motor', '85 – 95 pontos', 85, 95),
      ('Escala de Fugl-Meyer — Domínio Motor', '96 – 99 pontos', 96, 99),
      -- LEFS
      ('Escala de Função do Membro Inferior (LEFS)', '0 – 20 pontos', 0, 20),
      ('Escala de Função do Membro Inferior (LEFS)', '21 – 40 pontos', 21, 40),
      ('Escala de Função do Membro Inferior (LEFS)', '41 – 60 pontos', 41, 60),
      ('Escala de Função do Membro Inferior (LEFS)', '61 – 80 pontos', 61, 80),
      -- Roland-Morris
      ('Escala de Incapacidade de Roland-Morris (Lombar)', '0 – 8 pontos', 0, 8),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', '9 – 16 pontos', 9, 16),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', '17 – 24 pontos', 17, 24),
      -- Tinetti
      ('Escala de Tinetti (POMA)', '< 19 pontos', null, 18),
      ('Escala de Tinetti (POMA)', '19 – 23 pontos', 19, 23),
      ('Escala de Tinetti (POMA)', '24 – 28 pontos', 24, 28),
      -- MRC dispneia — o escore é o próprio grau (0–4)
      ('Escala MRC de Dispneia', 'Grau 0', 0, 0),
      ('Escala MRC de Dispneia', 'Grau 1', 1, 1),
      ('Escala MRC de Dispneia', 'Grau 2', 2, 2),
      ('Escala MRC de Dispneia', 'Grau 3', 3, 3),
      ('Escala MRC de Dispneia', 'Grau 4', 4, 4),
      -- EVA
      ('Escala Visual Analógica de Dor (EVA)', '0', 0, 0),
      ('Escala Visual Analógica de Dor (EVA)', '1 – 3', 1, 3),
      ('Escala Visual Analógica de Dor (EVA)', '4 – 6', 4, 6),
      ('Escala Visual Analógica de Dor (EVA)', '7 – 9', 7, 9),
      ('Escala Visual Analógica de Dor (EVA)', '10', 10, 10),
      -- Borg modificada
      ('Escala de Borg Modificada (Dispneia/Esforço)', '0', 0, 0),
      ('Escala de Borg Modificada (Dispneia/Esforço)', '1 – 2', 1, 2),
      ('Escala de Borg Modificada (Dispneia/Esforço)', '3 – 4', 3, 4),
      ('Escala de Borg Modificada (Dispneia/Esforço)', '5 – 6', 5, 6),
      ('Escala de Borg Modificada (Dispneia/Esforço)', '7 – 9', 7, 9),
      ('Escala de Borg Modificada (Dispneia/Esforço)', '10', 10, 10),
      -- Oxford — assoalho pélvico (grau 0–5)
      ('Força do Assoalho Pélvico — Escala de Oxford Modificada', 'Grau 0', 0, 0),
      ('Força do Assoalho Pélvico — Escala de Oxford Modificada', 'Grau 1', 1, 1),
      ('Força do Assoalho Pélvico — Escala de Oxford Modificada', 'Grau 2', 2, 2),
      ('Força do Assoalho Pélvico — Escala de Oxford Modificada', 'Grau 3', 3, 3),
      ('Força do Assoalho Pélvico — Escala de Oxford Modificada', 'Grau 4', 4, 4),
      ('Força do Assoalho Pélvico — Escala de Oxford Modificada', 'Grau 5', 5, 5),
      -- Oxford — força muscular (grau 0–5)
      ('Força Muscular — Escala de Oxford', 'Grau 0', 0, 0),
      ('Força Muscular — Escala de Oxford', 'Grau 1', 1, 1),
      ('Força Muscular — Escala de Oxford', 'Grau 2', 2, 2),
      ('Força Muscular — Escala de Oxford', 'Grau 3', 3, 3),
      ('Força Muscular — Escala de Oxford', 'Grau 4', 4, 4),
      ('Força Muscular — Escala de Oxford', 'Grau 5', 5, 5),
      -- ICIQ-SF
      ('ICIQ-SF — Questionário de Incontinência Urinária', '0', 0, 0),
      ('ICIQ-SF — Questionário de Incontinência Urinária', '1 – 5', 1, 5),
      ('ICIQ-SF — Questionário de Incontinência Urinária', '6 – 12', 6, 12),
      ('ICIQ-SF — Questionário de Incontinência Urinária', '13 – 18', 13, 18),
      ('ICIQ-SF — Questionário de Incontinência Urinária', '19 – 21', 19, 21),
      -- Barthel
      ('Índice de Barthel (Atividades de Vida Diária)', '0 – 20 pontos', 0, 20),
      ('Índice de Barthel (Atividades de Vida Diária)', '21 – 60 pontos', 21, 60),
      ('Índice de Barthel (Atividades de Vida Diária)', '61 – 90 pontos', 61, 90),
      ('Índice de Barthel (Atividades de Vida Diária)', '91 – 99 pontos', 91, 99),
      ('Índice de Barthel (Atividades de Vida Diária)', '100 pontos', 100, 100),
      -- MIF (mínimo 18 por construção do instrumento)
      ('Medida de Independência Funcional (MIF)', '18 – 53 pontos', 18, 53),
      ('Medida de Independência Funcional (MIF)', '54 – 89 pontos', 54, 89),
      ('Medida de Independência Funcional (MIF)', '90 – 107 pontos', 90, 107),
      ('Medida de Independência Funcional (MIF)', '108 – 126 pontos', 108, 126),
      -- Shuttle test — o escore é o NÍVEL alcançado
      ('Teste de Caminhada Incremental (Shuttle Test)', 'Nível 1 – 4', 1, 4),
      ('Teste de Caminhada Incremental (Shuttle Test)', 'Nível 5 – 8', 5, 8),
      ('Teste de Caminhada Incremental (Shuttle Test)', 'Nível 9 – 12', 9, 12),
      ('Teste de Caminhada Incremental (Shuttle Test)', 'Nível 13 ou mais', 13, null),
      -- TC6 — metros inteiros
      ('Teste de Caminhada de 6 Minutos (TC6)', '< 300 m', null, 299),
      ('Teste de Caminhada de 6 Minutos (TC6)', '300 – 450 m', 300, 450),
      ('Teste de Caminhada de 6 Minutos (TC6)', '> 450 m', 451, null),
      -- QuickDASH — 0–100 em passos de 100/44, nunca cai entre 25 e 26
      ('QuickDASH — Função do Membro Superior', '0 – 25 pontos', 0, 25),
      ('QuickDASH — Função do Membro Superior', '26 – 50 pontos', 26, 50),
      ('QuickDASH — Função do Membro Superior', '51 – 75 pontos', 51, 75),
      ('QuickDASH — Função do Membro Superior', '76 – 100 pontos', 76, 100),

      -- ══ Instrumentos CONTÍNUOS — max = min da faixa seguinte ══════════════
      -- BASFI (índice 0–10 com decimal)
      ('BASFI — Índice Funcional de Bath para Espondilite Anquilosante', '0 – 2', 0, 2.1),
      ('BASFI — Índice Funcional de Bath para Espondilite Anquilosante', '2,1 – 4', 2.1, 4.1),
      ('BASFI — Índice Funcional de Bath para Espondilite Anquilosante', '4,1 – 6', 4.1, 6.1),
      ('BASFI — Índice Funcional de Bath para Espondilite Anquilosante', '> 6', 6.1, null),
      -- DAS28 (índice 0–10 com decimal)
      ('DAS28 — Escore de Atividade da Doença', '< 2,6', null, 2.6),
      ('DAS28 — Escore de Atividade da Doença', '2,6 – 3,2', 2.6, 3.3),
      ('DAS28 — Escore de Atividade da Doença', '> 3,2 – 5,1', 3.3, 5.2),
      ('DAS28 — Escore de Atividade da Doença', '> 5,1', 5.2, null),
      -- HAQ (índice 0–3 em passos de 0,125)
      ('HAQ — Questionário de Avaliação da Saúde', '0 – 0,5', 0, 0.6),
      ('HAQ — Questionário de Avaliação da Saúde', '0,6 – 1,0', 0.6, 1.1),
      ('HAQ — Questionário de Avaliação da Saúde', '1,1 – 2,0', 1.1, 2.1),
      ('HAQ — Questionário de Avaliação da Saúde', '2,1 – 3,0', 2.1, 3),
      -- GMFM — percentual com decimal
      ('Medida da Função Motora Grossa (GMFM)', '0 – 25%', 0, 26),
      ('Medida da Função Motora Grossa (GMFM)', '26 – 50%', 26, 51),
      ('Medida da Função Motora Grossa (GMFM)', '51 – 75%', 51, 76),
      ('Medida da Função Motora Grossa (GMFM)', '76 – 100%', 76, 100),
      -- Pad test — gramas. "2 – 10 g" e "10 – 50 g" se sobrepõem no nome; os
      -- limites seguem o corte clássico (leve até 10 g, moderada a partir daí).
      ('Pad Test de 1 Hora (Teste do Absorvente)', '< 2 g', null, 2),
      ('Pad Test de 1 Hora (Teste do Absorvente)', '2 – 10 g', 2, 10.1),
      ('Pad Test de 1 Hora (Teste do Absorvente)', '10 – 50 g', 10.1, 50.1),
      ('Pad Test de 1 Hora (Teste do Absorvente)', '> 50 g', 50.1, null),
      -- Alcance funcional — centímetros
      ('Teste de Alcance Funcional (Functional Reach Test)', '< 15 cm', null, 15),
      ('Teste de Alcance Funcional (Functional Reach Test)', '15 – 25 cm', 15, 25.1),
      ('Teste de Alcance Funcional (Functional Reach Test)', '> 25 cm', 25.1, null),
      -- Apoio unipodal — segundos
      ('Teste de Apoio Unipodal (One-Leg Stance Test)', '< 5 segundos', null, 5),
      ('Teste de Apoio Unipodal (One-Leg Stance Test)', '5 – 14 segundos', 5, 15),
      ('Teste de Apoio Unipodal (One-Leg Stance Test)', '≥ 15 segundos', 15, null),
      -- TUG — segundos
      ('Timed Up and Go (TUG)', '< 10 segundos', null, 10),
      ('Timed Up and Go (TUG)', '10 – 19 segundos', 10, 20),
      ('Timed Up and Go (TUG)', '20 – 29 segundos', 20, 30),
      ('Timed Up and Go (TUG)', '≥ 30 segundos', 30, null),
      -- LSI (%) — hop battery, side hop, single hop
      ('Bateria de Testes de Salto (Hop Test Battery)', '< 85% LSI médio', null, 85),
      ('Bateria de Testes de Salto (Hop Test Battery)', '85 – 89% LSI médio', 85, 90),
      ('Bateria de Testes de Salto (Hop Test Battery)', '≥ 90% LSI médio', 90, null),
      ('Teste de Salto Lateral (Side Hop Test)', '< 85% LSI', null, 85),
      ('Teste de Salto Lateral (Side Hop Test)', '85 – 89% LSI', 85, 90),
      ('Teste de Salto Lateral (Side Hop Test)', '≥ 90% LSI', 90, null),
      ('Teste de Salto Unipodal (Single Hop Test)', '< 85% LSI', null, 85),
      ('Teste de Salto Unipodal (Single Hop Test)', '85 – 89% LSI', 85, 90),
      ('Teste de Salto Unipodal (Single Hop Test)', '≥ 90% LSI', 90, null),
      -- Y-Balance — escore composto (%)
      ('Y-Balance Test', '< 89% do escore composto', null, 89),
      ('Y-Balance Test', '89 – 94%', 89, 94),
      ('Y-Balance Test', '≥ 94%', 94, null),

      -- ══ GONIOMETRIA — o escore é o ângulo em graus ════════════════════════
      -- Entra aqui, e não só as escalas, justamente porque score unificou
      -- measured_angle: sem limites, a goniometria ficaria de fora da
      -- classificação automática.
      ('Goniometria — Flexão de Ombro', '0° – 90°', 0, 90),
      ('Goniometria — Flexão de Ombro', '90° – 150°', 90, 150),
      ('Goniometria — Flexão de Ombro', '150° – 180°', 150, 180),
      ('Goniometria — Abdução de Ombro', '0° – 90°', 0, 90),
      ('Goniometria — Abdução de Ombro', '90° – 150°', 90, 150),
      ('Goniometria — Abdução de Ombro', '150° – 180°', 150, 180),
      ('Goniometria — Flexão de Cotovelo', '0° – 90°', 0, 90),
      ('Goniometria — Flexão de Cotovelo', '90° – 130°', 90, 130),
      ('Goniometria — Flexão de Cotovelo', '130° – 150°', 130, 150),
      ('Goniometria — Flexão de Quadril', '0° – 60°', 0, 60),
      ('Goniometria — Flexão de Quadril', '60° – 100°', 60, 100),
      ('Goniometria — Flexão de Quadril', '100° – 120°', 100, 120),
      ('Goniometria — Flexão de Joelho', '0° – 90°', 0, 90),
      ('Goniometria — Flexão de Joelho', '90° – 120°', 90, 120),
      ('Goniometria — Flexão de Joelho', '120° – 135°', 120, 135),
      -- Extensão de joelho: o escore é o DÉFICIT de extensão, não a amplitude.
      ('Goniometria — Extensão de Joelho', '0°', 0, 1),
      ('Goniometria — Extensão de Joelho', '1° – 15°', 1, 15.1),
      ('Goniometria — Extensão de Joelho', '> 15°', 15.1, null),
      -- Dorsiflexão: ângulo negativo = pé equino, por isso a faixa abre embaixo.
      ('Goniometria — Dorsiflexão de Tornozelo', '< 0°', null, 0),
      ('Goniometria — Dorsiflexão de Tornozelo', '0° – 10°', 0, 10),
      ('Goniometria — Dorsiflexão de Tornozelo', '10° – 20°', 10, 20),

      -- ══ SEM LIMITE — faixa qualitativa, classificada pelo profissional ════
      -- Estão aqui de propósito, com os dois limites NULL, para deixar
      -- registrado que a ausência de número é DECISÃO e não esquecimento.
      -- Ritchie: o índice é numérico (0–78), mas as faixas semeadas descrevem a
      -- reação do paciente à pressão, sem corte numérico publicado.
      ('Índice de Ritchie (Articulações Dolorosas)', 'Sem dor', null, null),
      ('Índice de Ritchie (Articulações Dolorosas)', 'Atividade leve', null, null),
      ('Índice de Ritchie (Articulações Dolorosas)', 'Atividade moderada', null, null),
      ('Índice de Ritchie (Articulações Dolorosas)', 'Atividade alta', null, null),
      -- PEDI: as faixas comparam com o esperado para a idade — sem escore único.
      ('Inventário de Avaliação Pediátrica de Incapacidade (PEDI)', 'Desempenho muito abaixo do esperado', null, null),
      ('Inventário de Avaliação Pediátrica de Incapacidade (PEDI)', 'Desempenho abaixo do esperado', null, null),
      ('Inventário de Avaliação Pediátrica de Incapacidade (PEDI)', 'Desempenho próximo do esperado', null, null),
      ('Inventário de Avaliação Pediátrica de Incapacidade (PEDI)', 'Desempenho compatível com a idade', null, null),
      -- PERFECT: quatro componentes (P/E/R/F) — não há um número só para casar.
      ('PERFECT Scheme — Avaliação da Musculatura do Assoalho Pélvico', 'Função muito comprometida', null, null),
      ('PERFECT Scheme — Avaliação da Musculatura do Assoalho Pélvico', 'Função comprometida', null, null),
      ('PERFECT Scheme — Avaliação da Musculatura do Assoalho Pélvico', 'Função satisfatória', null, null),
      ('PERFECT Scheme — Avaliação da Musculatura do Assoalho Pélvico', 'Função ótima', null, null),
      -- GMFCS: classificação em algarismo romano, não escore medido.
      ('Sistema de Classificação da Função Motora Grossa (GMFCS)', 'Nível I', null, null),
      ('Sistema de Classificação da Função Motora Grossa (GMFCS)', 'Nível II', null, null),
      ('Sistema de Classificação da Função Motora Grossa (GMFCS)', 'Nível III', null, null),
      ('Sistema de Classificação da Função Motora Grossa (GMFCS)', 'Nível IV', null, null),
      ('Sistema de Classificação da Função Motora Grossa (GMFCS)', 'Nível V', null, null)
    ) as b(test_name, level_name, min_score, max_score)
    join public.physio_test t
      on t.clinic_id = p_clinic and t.name = b.test_name
   where l.test_id = t.id
     and l.name = b.level_name
     and (l.min_score is distinct from b.min_score
       or l.max_score is distinct from b.max_score);
$$;

comment on function private.apply_physio_test_score_bands(uuid) is
  'Escreve min_score/max_score nas faixas do catálogo de referência de uma '
  'clínica, casando por nome de teste + nome de faixa. Idempotente. Fonte única '
  'dos limites: serve tanto o backfill quanto a clínica nova (chamada por '
  'tg_seed_physio_test_catalog).';

revoke execute on function private.apply_physio_test_score_bands(uuid) from public;

-- ── 5. Clínica nova já nasce com os limites ─────────────────────────────────
-- Os limites entram por função IRMÃ, e não dentro de seed_physio_test_catalog:
-- aquele corpo tem ~300 linhas de conteúdo clínico que teriam de ser
-- re-emitidas inteiras para acrescentar duas colunas, duplicando o catálogo em
-- duas migrations e abrindo espaço para divergirem. Mesmo padrão já adotado por
-- seed_physio_goniometry_catalog em 20260725140000. As assinaturas existentes
-- (seed_physio_test_catalog(uuid), seed_physio_goniometry_catalog(uuid),
-- tg_seed_physio_test_catalog()) ficam INTOCADAS — nenhuma sobrecarga nova.
create or replace function private.tg_seed_physio_test_catalog()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.seed_physio_test_catalog(new.id);       -- escalas
  perform private.seed_physio_goniometry_catalog(new.id); -- goniometria
  perform private.apply_physio_test_score_bands(new.id);  -- limites numéricos
  -- Tudo que acabou de entrar é catálogo de REFERÊNCIA. Marcar aqui (e não
  -- dentro de cada seeder) resolve de uma vez o default `false` que deixava o
  -- catálogo apagável pela clínica — e é seguro porque a clínica acabou de
  -- nascer: não existe teste personalizado dela para ser marcado por engano.
  update public.physio_test set is_seed = true where clinic_id = new.id;
  return new;
end;
$$;

comment on function private.seed_physio_test_catalog(uuid) is
  'Semeia o catálogo inicial de testes/escalas de fisioterapia (≥4 por área) numa '
  'clínica que ainda não tem NENHUM teste cadastrado — não sobrescreve catálogo '
  'já existente/editado. Chamada automaticamente pelo trigger '
  'tr_seed_physio_test_catalog; pode ser chamada manualmente em backfill. NÃO '
  'preenche min_score/max_score das faixas: isso é responsabilidade de '
  'private.apply_physio_test_score_bands, que precisa ser chamada junto.';

-- ── 6. Backfill das clínicas existentes ─────────────────────────────────────
do $$
declare
  c record;
begin
  for c in select id from public.clinic loop
    perform private.apply_physio_test_score_bands(c.id);
  end loop;
end;
$$;
