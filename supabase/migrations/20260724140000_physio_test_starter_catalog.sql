-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — CATÁLOGO INICIAL DE TESTES DE FISIOTERAPIA
--
-- Hoje uma clínica de fisioterapia nasce com Administrativo → Testes VAZIO — o
-- fisioterapeuta precisa cadastrar cada teste/escala do zero antes de poder
-- usar a aba Testes do paciente. Este arquivo semeia um catálogo INICIAL com
-- pelo menos 4 instrumentos por área de atuação (Neurológica, Ortopédica,
-- Respiratória, Pediátrica, Esportiva, Geriátrica, Uroginecológica,
-- Reumatológica) — os mais citados na literatura/prática de cada área. É ponto
-- de partida editável, não protocolo fechado: a clínica pode editar, remover o
-- que não usa e cadastrar o que faltar, exatamente como qualquer outro teste.
--
-- MECANISMO — por que TRIGGER e não função de chamada manual (como
-- `seed_anamnesis_template`, ver 20260723193000): lá, esquecer de chamar a
-- função só aparece pro usuário no pior momento (ao tentar salvar a PRIMEIRA
-- ficha). Aqui o pedido era "quando um novo usuário for cadastrado, já
-- carregar esses testes" — automático, sem depender de alguém lembrar de rodar
-- um passo extra no provisionamento. Um AFTER INSERT em `clinic`, restrito a
-- specialty='physiotherapy', garante isso sem tocar em nenhuma outra tabela.
--
-- Depende de: 20260724120000_physio_tests.sql (physio_test, physio_test_level).
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function private.seed_physio_test_catalog(p_clinic uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Não sobrescreve: se a clínica já tem QUALQUER teste (seed anterior ou
  -- cadastro manual antes desta função existir), não mexe em nada.
  if exists (select 1 from public.physio_test where clinic_id = p_clinic) then
    return;
  end if;

  insert into public.physio_test (clinic_id, name, specialty, instructions)
  select p_clinic, t.name, t.specialty, t.instructions
    from (values
      -- ── Neurológica ──────────────────────────────────────────────────────
      ('Escala de Equilíbrio de Berg', 'Neurológica',
        'Aplique os 14 itens da escala (ex.: sentar sem apoio, levantar-se, permanecer em pé com os olhos fechados, alcançar à frente, girar-se 360°), pontuando cada um de 0 a 4 conforme o desempenho observado. Some os pontos dos 14 itens (máximo 56) para obter o total.'),
      ('Escala de Fugl-Meyer — Domínio Motor', 'Neurológica',
        'Avalie os itens do domínio motor (membro superior e inferior) conforme o protocolo do instrumento, pontuando cada movimento/reflexo numa escala de 0 (não consegue realizar) a 2 (realiza completamente). Some os pontos do domínio motor (máximo 100) para o total.'),
      ('Índice de Barthel (Atividades de Vida Diária)', 'Neurológica',
        'Avalie 10 atividades de vida diária (alimentação, banho, higiene pessoal, vestir-se, controle esfincteriano, uso do banheiro, transferências, mobilidade e subir escadas), pontuando cada uma conforme o grau de independência do paciente. Some os pontos (máximo 100) para o total.'),
      ('Medida de Independência Funcional (MIF)', 'Neurológica',
        'Avalie 18 itens de autocuidado, controle de esfíncteres, mobilidade, locomoção, comunicação e cognição social, pontuando cada um de 1 (dependência total) a 7 (independência completa). Some os pontos (mínimo 18, máximo 126) para o total.'),

      -- ── Ortopédica ───────────────────────────────────────────────────────
      ('Força Muscular — Escala de Oxford', 'Ortopédica',
        'Peça ao paciente que realize o movimento articular avaliado enquanto o examinador aplica resistência manual. Compare com o lado contralateral quando possível e classifique a força observada em um dos graus de 0 a 5.'),
      ('Escala Visual Analógica de Dor (EVA)', 'Ortopédica',
        'Apresente ao paciente uma linha de 0 a 10, com as extremidades marcadas "sem dor" e "pior dor imaginável". Peça que ele aponte ou marque o ponto que representa a intensidade da dor no momento da avaliação e registre o valor numérico correspondente.'),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'Ortopédica',
        'Aplique o questionário de 24 itens sobre limitações causadas pela dor lombar nas atividades diárias, marcando cada item como sim/não conforme a situação do paciente hoje. Some o número de itens marcados como "sim" (máximo 24) para obter o escore de incapacidade.'),
      ('Escala de Função do Membro Inferior (LEFS)', 'Ortopédica',
        'Aplique o questionário de 20 atividades (ex.: caminhar, subir escada, agachar, correr, carregar objetos), pedindo ao paciente que classifique a dificuldade de cada uma de 0 (extrema dificuldade/incapaz) a 4 (nenhuma dificuldade). Some os pontos (máximo 80) para o escore total.'),
      ('QuickDASH — Função do Membro Superior', 'Ortopédica',
        'Aplique os 11 itens do questionário sobre dificuldade em atividades e sintomas do ombro/braço/mão nos últimos 7 dias, pontuando cada um de 1 a 5. Calcule o escore: [(soma dos itens ÷ 11) − 1] × 25 (0 a 100).'),

      -- ── Respiratória (Cardiorrespiratória) ──────────────────────────────
      ('Teste de Caminhada de 6 Minutos (TC6)', 'Respiratória (Cardiorrespiratória)',
        'Demarque um corredor plano de pelo menos 30 metros. Oriente o paciente a caminhar o mais rápido possível, sem correr, durante 6 minutos — ele pode desacelerar ou parar para descansar se necessário. Registre a distância total percorrida em metros ao final do tempo.'),
      ('Escala de Borg Modificada (Dispneia/Esforço)', 'Respiratória (Cardiorrespiratória)',
        'Durante ou logo após o esforço (ex.: ao final do TC6), pergunte ao paciente qual número de 0 a 10 melhor representa a intensidade da falta de ar ou do cansaço percebido, usando a régua de descritores da escala.'),
      ('Escala MRC de Dispneia', 'Respiratória (Cardiorrespiratória)',
        'Pergunte ao paciente em que situação ele sente falta de ar no dia a dia e classifique num dos 5 graus da escala Medical Research Council, do 0 (sem dispneia) ao 4 (dispneia para atividades mínimas).'),
      ('Teste de Caminhada Incremental (Shuttle Test)', 'Respiratória (Cardiorrespiratória)',
        'Marque um percurso de 10 metros entre dois cones. Oriente o paciente a caminhar acompanhando o ritmo sonoro (sinais gravados), que aumenta a cada minuto, até ele não conseguir mais completar a distância no tempo do sinal. Registre a distância total percorrida e o nível alcançado.'),

      -- ── Pediátrica ───────────────────────────────────────────────────────
      ('Medida da Função Motora Grossa (GMFM)', 'Pediátrica',
        'Aplique os itens das 5 dimensões (deitar/rolar, sentar, engatinhar/ajoelhar, em pé, andar/correr/pular), pontuando cada item de 0 (não inicia) a 3 (completa). Calcule o percentual total (soma ÷ pontuação máxima possível × 100).'),
      ('Escala de Equilíbrio Pediátrica (PBS)', 'Pediátrica',
        'Versão da Escala de Berg adaptada para crianças: aplique os 14 itens de equilíbrio funcional, pontuando cada um de 0 a 4 conforme o desempenho observado. Some os pontos (máximo 56).'),
      ('Sistema de Classificação da Função Motora Grossa (GMFCS)', 'Pediátrica',
        'Observe a criança em suas atividades habituais (sentar, andar, usar cadeira de rodas) e classifique o nível de função motora grossa em um dos 5 níveis, considerando a faixa etária.'),
      ('Inventário de Avaliação Pediátrica de Incapacidade (PEDI)', 'Pediátrica',
        'Entreviste o cuidador (ou observe diretamente) sobre o desempenho da criança nas áreas de autocuidado, mobilidade e função social, registrando quais habilidades funcionais já são realizadas de forma independente.'),

      -- ── Esportiva ────────────────────────────────────────────────────────
      ('Teste de Salto Unipodal (Single Hop Test)', 'Esportiva',
        'Peça ao atleta que salte o mais longe possível apoiado em uma perna só e aterrisse com controle na mesma perna. Meça a distância e repita no lado contralateral. Calcule o Índice de Simetria de Membros (LSI) = (perna lesionada ÷ perna sadia) × 100.'),
      ('Y-Balance Test', 'Esportiva',
        'Com o atleta em apoio unipodal no centro da plataforma, peça que alcance o mais longe possível com a perna livre nas direções anterior, posteromedial e posterolateral, sem perder o equilíbrio. Registre as três distâncias e calcule o escore composto normalizado pelo comprimento do membro.'),
      ('Bateria de Testes de Salto (Hop Test Battery)', 'Esportiva',
        'Aplique em sequência os quatro saltos unipodais (salto único, salto triplo, salto triplo cruzado e salto por tempo de 6 metros), comparando o lado lesionado com o sadio em cada um. Calcule o LSI médio dos quatro testes.'),
      ('Teste de Salto Lateral (Side Hop Test)', 'Esportiva',
        'Marque duas linhas paralelas a 30 cm de distância. Peça ao atleta que salte lateralmente de um lado a outro, apoiado numa perna só, o máximo de vezes possível em 30 segundos. Conte os saltos válidos e compare com o lado contralateral.'),

      -- ── Geriátrica ───────────────────────────────────────────────────────
      ('Timed Up and Go (TUG)', 'Geriátrica',
        'Posicione o paciente sentado numa cadeira com apoio de braços. Ao comando "já", cronometre o tempo que ele leva para se levantar, caminhar 3 metros, virar, retornar e sentar novamente. Registre o tempo total em segundos.'),
      ('Escala de Tinetti (POMA)', 'Geriátrica',
        'Aplique os itens de equilíbrio (sentado, levantando-se, em pé, com olhos fechados, girando) e de marcha (início, comprimento e altura do passo, simetria, trajetória), pontuando cada um conforme o protocolo. Some os pontos (máximo 28: 16 de equilíbrio + 12 de marcha).'),
      ('Teste de Apoio Unipodal (One-Leg Stance Test)', 'Geriátrica',
        'Com o paciente descalço e os braços cruzados sobre o tórax, peça que fique apoiado em uma perna só pelo maior tempo possível, com os olhos abertos, até 30 segundos. Cronometre o tempo até perder o equilíbrio ou tocar o outro pé no chão.'),
      ('Teste de Alcance Funcional (Functional Reach Test)', 'Geriátrica',
        'Com o paciente em pé próximo a uma parede, com o braço estendido a 90° na altura do ombro, meça a posição inicial dos dedos numa fita métrica fixada na parede. Peça que se incline à frente o máximo possível sem dar passo, e meça a nova posição. A diferença é a distância alcançada.'),

      -- ── Uroginecológica ──────────────────────────────────────────────────
      ('Força do Assoalho Pélvico — Escala de Oxford Modificada', 'Uroginecológica',
        'Realize o toque vaginal bidigital e peça à paciente que contraia a musculatura do assoalho pélvico ao redor dos dedos do examinador. Classifique a força da contração percebida em um dos graus de 0 a 5.'),
      ('ICIQ-SF — Questionário de Incontinência Urinária', 'Uroginecológica',
        'Aplique o questionário de autorrelato sobre frequência, quantidade e impacto da perda urinária na qualidade de vida. Some as três perguntas pontuadas (frequência 0-5, quantidade 0-6, impacto 0-10) para o escore total (0 a 21).'),
      ('PERFECT Scheme — Avaliação da Musculatura do Assoalho Pélvico', 'Uroginecológica',
        'Ao toque vaginal, avalie em sequência: Power (força pela escala de Oxford), Endurance (tempo de sustentação da contração máxima, até 10s), Repetitions (número de repetições mantidas) e Fast contractions (número de contrações rápidas sustentadas). Registre o conjunto e classifique a função global da musculatura.'),
      ('Pad Test de 1 Hora (Teste do Absorvente)', 'Uroginecológica',
        'Pese um absorvente seco antes de iniciar. A paciente o usa por 1 hora realizando atividades padronizadas (beber água, subir escada, tossir, correr no lugar, agachar, lavar as mãos). Ao final, pese o absorvente novamente — a diferença é o volume de perda urinária em gramas.'),

      -- ── Reumatológica ────────────────────────────────────────────────────
      ('DAS28 — Escore de Atividade da Doença', 'Reumatológica',
        'Conte o número de articulações dolorosas e edemaciadas entre as 28 avaliadas, registre a VHS (ou PCR) do exame laboratorial mais recente e peça ao paciente que classifique seu estado global de saúde numa escala visual analógica de 0 a 100. Calcule o DAS28 pela fórmula padrão do instrumento.'),
      ('HAQ — Questionário de Avaliação da Saúde', 'Reumatológica',
        'Aplique as 20 perguntas do questionário sobre a dificuldade para realizar atividades diárias (vestir-se, levantar-se, comer, andar, higiene, alcançar, segurar objetos, atividades). Pontue cada item de 0 (sem dificuldade) a 3 (incapaz de realizar) e calcule a média das 8 categorias (índice de 0 a 3).'),
      ('Índice de Ritchie (Articulações Dolorosas)', 'Reumatológica',
        'Pressione manualmente cada uma das articulações do protocolo e peça ao paciente que classifique a dor provocada em cada uma. Some a pontuação de todas as articulações avaliadas para o escore total.'),
      ('BASFI — Índice Funcional de Bath para Espondilite Anquilosante', 'Reumatológica',
        'Aplique as 10 questões sobre a dificuldade para realizar movimentos e atividades relacionadas à coluna e ao quadril (calçar meias, curvar-se, alcançar prateleira alta, levantar-se de uma cadeira sem apoio dos braços, entre outras), pontuando cada uma de 0 (fácil) a 10 (impossível). Calcule a média das 10 questões.')
    ) as t(name, specialty, instructions);

  insert into public.physio_test_level (clinic_id, test_id, name, description, sort_order)
  select p_clinic, pt.id, lv.level_name, lv.description, lv.sort_order
    from (values
      -- Berg
      ('Escala de Equilíbrio de Berg', '0 – 20 pontos', 'Alto risco de queda — equilíbrio comprometido, geralmente dependente de cadeira de rodas', 10),
      ('Escala de Equilíbrio de Berg', '21 – 40 pontos', 'Risco médio de queda — marcha com assistência', 20),
      ('Escala de Equilíbrio de Berg', '41 – 56 pontos', 'Baixo risco de queda — equilíbrio funcional independente', 30),
      -- Fugl-Meyer
      ('Escala de Fugl-Meyer — Domínio Motor', '< 50 pontos', 'Comprometimento motor grave', 10),
      ('Escala de Fugl-Meyer — Domínio Motor', '50 – 84 pontos', 'Comprometimento motor acentuado', 20),
      ('Escala de Fugl-Meyer — Domínio Motor', '85 – 95 pontos', 'Comprometimento motor moderado a leve', 30),
      ('Escala de Fugl-Meyer — Domínio Motor', '96 – 99 pontos', 'Comprometimento motor discreto', 40),
      -- Barthel
      ('Índice de Barthel (Atividades de Vida Diária)', '0 – 20 pontos', 'Dependência total', 10),
      ('Índice de Barthel (Atividades de Vida Diária)', '21 – 60 pontos', 'Dependência grave', 20),
      ('Índice de Barthel (Atividades de Vida Diária)', '61 – 90 pontos', 'Dependência moderada', 30),
      ('Índice de Barthel (Atividades de Vida Diária)', '91 – 99 pontos', 'Dependência leve', 40),
      ('Índice de Barthel (Atividades de Vida Diária)', '100 pontos', 'Independente', 50),
      -- MIF
      ('Medida de Independência Funcional (MIF)', '18 – 53 pontos', 'Dependência completa a assistência máxima', 10),
      ('Medida de Independência Funcional (MIF)', '54 – 89 pontos', 'Assistência moderada', 20),
      ('Medida de Independência Funcional (MIF)', '90 – 107 pontos', 'Assistência mínima a supervisão', 30),
      ('Medida de Independência Funcional (MIF)', '108 – 126 pontos', 'Independência modificada a completa', 40),
      -- Oxford (força muscular)
      ('Força Muscular — Escala de Oxford', 'Grau 0', 'Nenhuma contração muscular', 10),
      ('Força Muscular — Escala de Oxford', 'Grau 1', 'Contração visível, sem movimento', 20),
      ('Força Muscular — Escala de Oxford', 'Grau 2', 'Movimento sem ação da gravidade', 30),
      ('Força Muscular — Escala de Oxford', 'Grau 3', 'Movimento contra a gravidade', 40),
      ('Força Muscular — Escala de Oxford', 'Grau 4', 'Movimento contra resistência moderada', 50),
      ('Força Muscular — Escala de Oxford', 'Grau 5', 'Força normal', 60),
      -- EVA
      ('Escala Visual Analógica de Dor (EVA)', '0', 'Sem dor', 10),
      ('Escala Visual Analógica de Dor (EVA)', '1 – 3', 'Dor leve', 20),
      ('Escala Visual Analógica de Dor (EVA)', '4 – 6', 'Dor moderada', 30),
      ('Escala Visual Analógica de Dor (EVA)', '7 – 9', 'Dor intensa', 40),
      ('Escala Visual Analógica de Dor (EVA)', '10', 'Pior dor imaginável', 50),
      -- Roland-Morris
      ('Escala de Incapacidade de Roland-Morris (Lombar)', '0 – 8 pontos', 'Incapacidade leve (referência geral)', 10),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', '9 – 16 pontos', 'Incapacidade moderada (referência geral)', 20),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', '17 – 24 pontos', 'Incapacidade grave (referência geral)', 30),
      -- LEFS
      ('Escala de Função do Membro Inferior (LEFS)', '0 – 20 pontos', 'Limitação funcional grave do membro inferior', 10),
      ('Escala de Função do Membro Inferior (LEFS)', '21 – 40 pontos', 'Limitação funcional moderada', 20),
      ('Escala de Função do Membro Inferior (LEFS)', '41 – 60 pontos', 'Limitação funcional leve', 30),
      ('Escala de Função do Membro Inferior (LEFS)', '61 – 80 pontos', 'Função praticamente normal', 40),
      -- QuickDASH
      ('QuickDASH — Função do Membro Superior', '0 – 25 pontos', 'Incapacidade leve do membro superior', 10),
      ('QuickDASH — Função do Membro Superior', '26 – 50 pontos', 'Incapacidade moderada', 20),
      ('QuickDASH — Função do Membro Superior', '51 – 75 pontos', 'Incapacidade importante', 30),
      ('QuickDASH — Função do Membro Superior', '76 – 100 pontos', 'Incapacidade grave', 40),
      -- TC6
      ('Teste de Caminhada de 6 Minutos (TC6)', '< 300 m', 'Limitação funcional importante (referência geral — comparar com valor previsto por idade/sexo/altura)', 10),
      ('Teste de Caminhada de 6 Minutos (TC6)', '300 – 450 m', 'Limitação funcional moderada (referência geral)', 20),
      ('Teste de Caminhada de 6 Minutos (TC6)', '> 450 m', 'Capacidade funcional preservada (referência geral)', 30),
      -- Borg
      ('Escala de Borg Modificada (Dispneia/Esforço)', '0', 'Nenhuma falta de ar/esforço', 10),
      ('Escala de Borg Modificada (Dispneia/Esforço)', '1 – 2', 'Muito leve a leve', 20),
      ('Escala de Borg Modificada (Dispneia/Esforço)', '3 – 4', 'Moderada', 30),
      ('Escala de Borg Modificada (Dispneia/Esforço)', '5 – 6', 'Um pouco intensa', 40),
      ('Escala de Borg Modificada (Dispneia/Esforço)', '7 – 9', 'Muito intensa', 50),
      ('Escala de Borg Modificada (Dispneia/Esforço)', '10', 'Máxima, insuportável', 60),
      -- MRC dispneia
      ('Escala MRC de Dispneia', 'Grau 0', 'Falta de ar somente com exercício intenso', 10),
      ('Escala MRC de Dispneia', 'Grau 1', 'Falta de ar ao andar rápido ou subir ladeira leve', 20),
      ('Escala MRC de Dispneia', 'Grau 2', 'Anda mais devagar que pessoas da mesma idade ou precisa parar ao andar no próprio passo', 30),
      ('Escala MRC de Dispneia', 'Grau 3', 'Precisa parar para respirar após andar cerca de 100 metros', 40),
      ('Escala MRC de Dispneia', 'Grau 4', 'Dispneia impede sair de casa ou ocorre ao vestir-se', 50),
      -- Shuttle test
      ('Teste de Caminhada Incremental (Shuttle Test)', 'Nível 1 – 4', 'Capacidade funcional muito baixa', 10),
      ('Teste de Caminhada Incremental (Shuttle Test)', 'Nível 5 – 8', 'Capacidade funcional baixa a moderada', 20),
      ('Teste de Caminhada Incremental (Shuttle Test)', 'Nível 9 – 12', 'Capacidade funcional moderada a boa', 30),
      ('Teste de Caminhada Incremental (Shuttle Test)', 'Nível 13 ou mais', 'Capacidade funcional preservada', 40),
      -- GMFM
      ('Medida da Função Motora Grossa (GMFM)', '0 – 25%', 'Função motora grossa muito limitada', 10),
      ('Medida da Função Motora Grossa (GMFM)', '26 – 50%', 'Função motora grossa limitada', 20),
      ('Medida da Função Motora Grossa (GMFM)', '51 – 75%', 'Função motora grossa moderada', 30),
      ('Medida da Função Motora Grossa (GMFM)', '76 – 100%', 'Função motora grossa próxima do esperado', 40),
      -- PBS
      ('Escala de Equilíbrio Pediátrica (PBS)', '0 – 20 pontos', 'Equilíbrio muito comprometido', 10),
      ('Escala de Equilíbrio Pediátrica (PBS)', '21 – 40 pontos', 'Equilíbrio comprometido — risco de queda', 20),
      ('Escala de Equilíbrio Pediátrica (PBS)', '41 – 56 pontos', 'Equilíbrio funcional adequado para a idade', 30),
      -- GMFCS
      ('Sistema de Classificação da Função Motora Grossa (GMFCS)', 'Nível I', 'Anda sem limitações', 10),
      ('Sistema de Classificação da Função Motora Grossa (GMFCS)', 'Nível II', 'Anda com limitações', 20),
      ('Sistema de Classificação da Função Motora Grossa (GMFCS)', 'Nível III', 'Anda usando um dispositivo auxiliar de locomoção', 30),
      ('Sistema de Classificação da Função Motora Grossa (GMFCS)', 'Nível IV', 'Autolocomoção limitada; pode usar mobilidade motorizada', 40),
      ('Sistema de Classificação da Função Motora Grossa (GMFCS)', 'Nível V', 'Transportado em cadeira de rodas manual', 50),
      -- PEDI
      ('Inventário de Avaliação Pediátrica de Incapacidade (PEDI)', 'Desempenho muito abaixo do esperado', 'Necessita assistência extensa nas três áreas avaliadas', 10),
      ('Inventário de Avaliação Pediátrica de Incapacidade (PEDI)', 'Desempenho abaixo do esperado', 'Necessita assistência moderada em pelo menos uma área', 20),
      ('Inventário de Avaliação Pediátrica de Incapacidade (PEDI)', 'Desempenho próximo do esperado', 'Independência parcial, com supervisão pontual', 30),
      ('Inventário de Avaliação Pediátrica de Incapacidade (PEDI)', 'Desempenho compatível com a idade', 'Independência funcional nas três áreas', 40),
      -- Single hop
      ('Teste de Salto Unipodal (Single Hop Test)', '< 85% LSI', 'Assimetria importante — não liberado para retorno ao esporte', 10),
      ('Teste de Salto Unipodal (Single Hop Test)', '85 – 89% LSI', 'Assimetria limítrofe — reavaliar antes de liberar', 20),
      ('Teste de Salto Unipodal (Single Hop Test)', '≥ 90% LSI', 'Simetria adequada — dentro do critério usual de retorno ao esporte', 30),
      -- Y-Balance
      ('Y-Balance Test', '< 89% do escore composto', 'Risco aumentado de lesão de membro inferior', 10),
      ('Y-Balance Test', '89 – 94%', 'Desempenho limítrofe', 20),
      ('Y-Balance Test', '≥ 94%', 'Desempenho dentro da faixa de baixo risco', 30),
      -- Hop battery
      ('Bateria de Testes de Salto (Hop Test Battery)', '< 85% LSI médio', 'Não atende ao critério funcional para retorno ao esporte', 10),
      ('Bateria de Testes de Salto (Hop Test Battery)', '85 – 89% LSI médio', 'Critério limítrofe — associar a outros achados clínicos', 20),
      ('Bateria de Testes de Salto (Hop Test Battery)', '≥ 90% LSI médio', 'Atende ao critério funcional usual de retorno ao esporte', 30),
      -- Side hop
      ('Teste de Salto Lateral (Side Hop Test)', '< 85% LSI', 'Déficit importante de controle lateral — atenção ao risco de reincidência', 10),
      ('Teste de Salto Lateral (Side Hop Test)', '85 – 89% LSI', 'Déficit leve — monitorar evolução', 20),
      ('Teste de Salto Lateral (Side Hop Test)', '≥ 90% LSI', 'Controle lateral simétrico entre os membros', 30),
      -- TUG
      ('Timed Up and Go (TUG)', '< 10 segundos', 'Mobilidade normal, totalmente independente', 10),
      ('Timed Up and Go (TUG)', '10 – 19 segundos', 'Mobilidade preservada, independente na maioria das atividades', 20),
      ('Timed Up and Go (TUG)', '20 – 29 segundos', 'Mobilidade variável — atenção ao risco de queda', 30),
      ('Timed Up and Go (TUG)', '≥ 30 segundos', 'Dependente para a maioria das atividades de mobilidade — alto risco de queda', 40),
      -- Tinetti
      ('Escala de Tinetti (POMA)', '< 19 pontos', 'Alto risco de queda', 10),
      ('Escala de Tinetti (POMA)', '19 – 23 pontos', 'Risco moderado de queda', 20),
      ('Escala de Tinetti (POMA)', '24 – 28 pontos', 'Baixo risco de queda', 30),
      -- One-leg stance
      ('Teste de Apoio Unipodal (One-Leg Stance Test)', '< 5 segundos', 'Alto risco de queda', 10),
      ('Teste de Apoio Unipodal (One-Leg Stance Test)', '5 – 14 segundos', 'Risco moderado de queda', 20),
      ('Teste de Apoio Unipodal (One-Leg Stance Test)', '≥ 15 segundos', 'Equilíbrio unipodal adequado para a idade', 30),
      -- Functional reach
      ('Teste de Alcance Funcional (Functional Reach Test)', '< 15 cm', 'Alto risco de queda', 10),
      ('Teste de Alcance Funcional (Functional Reach Test)', '15 – 25 cm', 'Risco moderado de queda', 20),
      ('Teste de Alcance Funcional (Functional Reach Test)', '> 25 cm', 'Baixo risco de queda', 30),
      -- Oxford pélvico
      ('Força do Assoalho Pélvico — Escala de Oxford Modificada', 'Grau 0', 'Nenhuma contração perceptível', 10),
      ('Força do Assoalho Pélvico — Escala de Oxford Modificada', 'Grau 1', 'Contração leve, tipo tremor (flicker)', 20),
      ('Força do Assoalho Pélvico — Escala de Oxford Modificada', 'Grau 2', 'Contração fraca', 30),
      ('Força do Assoalho Pélvico — Escala de Oxford Modificada', 'Grau 3', 'Contração moderada, com leve elevação', 40),
      ('Força do Assoalho Pélvico — Escala de Oxford Modificada', 'Grau 4', 'Contração boa, com elevação nítida e resistência', 50),
      ('Força do Assoalho Pélvico — Escala de Oxford Modificada', 'Grau 5', 'Contração forte, com elevação e resistência mantidas', 60),
      -- ICIQ-SF
      ('ICIQ-SF — Questionário de Incontinência Urinária', '0', 'Sem perda urinária referida', 10),
      ('ICIQ-SF — Questionário de Incontinência Urinária', '1 – 5', 'Incontinência leve', 20),
      ('ICIQ-SF — Questionário de Incontinência Urinária', '6 – 12', 'Incontinência moderada', 30),
      ('ICIQ-SF — Questionário de Incontinência Urinária', '13 – 18', 'Incontinência grave', 40),
      ('ICIQ-SF — Questionário de Incontinência Urinária', '19 – 21', 'Incontinência muito grave', 50),
      -- PERFECT
      ('PERFECT Scheme — Avaliação da Musculatura do Assoalho Pélvico', 'Função muito comprometida', 'Força, resistência e repetições bem abaixo do esperado', 10),
      ('PERFECT Scheme — Avaliação da Musculatura do Assoalho Pélvico', 'Função comprometida', 'Pelo menos um dos componentes claramente reduzido', 20),
      ('PERFECT Scheme — Avaliação da Musculatura do Assoalho Pélvico', 'Função satisfatória', 'Componentes dentro da faixa esperada para a idade', 30),
      ('PERFECT Scheme — Avaliação da Musculatura do Assoalho Pélvico', 'Função ótima', 'Força, resistência e repetições dentro do padrão de normalidade', 40),
      -- Pad test
      ('Pad Test de 1 Hora (Teste do Absorvente)', '< 2 g', 'Resultado negativo — dentro da variação normal (evaporação/secreção)', 10),
      ('Pad Test de 1 Hora (Teste do Absorvente)', '2 – 10 g', 'Perda leve', 20),
      ('Pad Test de 1 Hora (Teste do Absorvente)', '10 – 50 g', 'Perda moderada', 30),
      ('Pad Test de 1 Hora (Teste do Absorvente)', '> 50 g', 'Perda grave', 40),
      -- DAS28
      ('DAS28 — Escore de Atividade da Doença', '< 2,6', 'Remissão', 10),
      ('DAS28 — Escore de Atividade da Doença', '2,6 – 3,2', 'Baixa atividade da doença', 20),
      ('DAS28 — Escore de Atividade da Doença', '> 3,2 – 5,1', 'Atividade moderada da doença', 30),
      ('DAS28 — Escore de Atividade da Doença', '> 5,1', 'Alta atividade da doença', 40),
      -- HAQ
      ('HAQ — Questionário de Avaliação da Saúde', '0 – 0,5', 'Sem incapacidade funcional relevante', 10),
      ('HAQ — Questionário de Avaliação da Saúde', '0,6 – 1,0', 'Incapacidade leve a moderada', 20),
      ('HAQ — Questionário de Avaliação da Saúde', '1,1 – 2,0', 'Incapacidade moderada a severa', 30),
      ('HAQ — Questionário de Avaliação da Saúde', '2,1 – 3,0', 'Incapacidade severa', 40),
      -- Ritchie
      ('Índice de Ritchie (Articulações Dolorosas)', 'Sem dor', 'Nenhuma articulação dolorosa à pressão', 10),
      ('Índice de Ritchie (Articulações Dolorosas)', 'Atividade leve', 'Poucas articulações com dor leve à pressão', 20),
      ('Índice de Ritchie (Articulações Dolorosas)', 'Atividade moderada', 'Várias articulações com dor moderada, paciente reage mas não retira o membro', 30),
      ('Índice de Ritchie (Articulações Dolorosas)', 'Atividade alta', 'Múltiplas articulações com dor intensa, paciente retira o membro à pressão', 40),
      -- BASFI
      ('BASFI — Índice Funcional de Bath para Espondilite Anquilosante', '0 – 2', 'Função praticamente preservada', 10),
      ('BASFI — Índice Funcional de Bath para Espondilite Anquilosante', '2,1 – 4', 'Limitação funcional leve', 20),
      ('BASFI — Índice Funcional de Bath para Espondilite Anquilosante', '4,1 – 6', 'Limitação funcional moderada', 30),
      ('BASFI — Índice Funcional de Bath para Espondilite Anquilosante', '> 6', 'Limitação funcional importante', 40)
    ) as lv(test_name, level_name, description, sort_order)
    join public.physio_test pt on pt.clinic_id = p_clinic and pt.name = lv.test_name;
end;
$$;

comment on function private.seed_physio_test_catalog(uuid) is
  'Semeia o catálogo inicial de testes/escalas de fisioterapia (≥4 por área) '
  'numa clínica que ainda não tem NENHUM teste cadastrado — não sobrescreve '
  'catálogo já existente/editado. Chamada automaticamente pelo trigger '
  'tr_seed_physio_test_catalog; pode ser chamada manualmente em backfill.';

revoke execute on function private.seed_physio_test_catalog(uuid) from public;

-- ── Trigger: dispara sozinho ao provisionar uma clínica de fisioterapia ──────
create or replace function private.tg_seed_physio_test_catalog()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.seed_physio_test_catalog(new.id);
  return new;
end;
$$;

create trigger tr_seed_physio_test_catalog
  after insert on public.clinic
  for each row
  when (new.specialty = 'physiotherapy')
  execute function private.tg_seed_physio_test_catalog();

-- ── Backfill: clínicas de fisioterapia já provisionadas, ainda sem teste ────
do $$
declare
  r record;
begin
  for r in
    select c.id from public.clinic c
     where c.specialty = 'physiotherapy'
       and not exists (select 1 from public.physio_test t where t.clinic_id = c.id)
  loop
    perform private.seed_physio_test_catalog(r.id);
  end loop;
end $$;
