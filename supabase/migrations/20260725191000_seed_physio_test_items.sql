-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — ITENS DOS INSTRUMENTOS DE DOMÍNIO PÚBLICO
--
-- Conteúdo clínico do motor criado em 20260725190000. Aqui entram os ITENS e as
-- OPÇÕES dos instrumentos que podem ser reproduzidos, e nascem os dois testes
-- que faltavam no catálogo (SPPB e Ashworth).
--
-- ── QUEM ENTRA E QUEM NÃO ENTRA ─────────────────────────────────────────────
-- Entram só os 7 instrumentos de DOMÍNIO PÚBLICO autorizados. Dos 7:
--   • Berg (14 itens × 0–4), Roland-Morris (24 itens sim/não) e SPPB
--     (3 componentes × 0–4) são SOMATÓRIOS — ganham item a item e o banco soma;
--   • Ashworth e Oxford são escalas de GRAU: classificam UM músculo/segmento por
--     aplicação e não têm total. Viram UM item com as opções de grau (ver a
--     justificativa no bloco 3) — o "somatório" de um item só é o próprio grau,
--     então o mesmo motor serve sem inventar um total que o instrumento não tem;
--   • TUG e TC6 são MEDIDOS (segundos, metros) — NÃO ganham item nenhum e
--     continuam em scoring_kind = 'manual', do jeito que já funcionavam: a tela
--     digita o valor cronometrado e private.physio_test_level_for_score deriva a
--     faixa a partir dos limites que 20260725180000 gravou. Somar item aqui
--     seria transformar uma medida numa pontuação que o instrumento não define.
-- KOOS, Oswestry, DASH/QuickDASH e ICIQ-SF são LICENCIADOS e ficam de fora por
-- decisão jurídica do dono — seguem com escore total manual, que já funciona.
--
-- ── PROCEDÊNCIA DO TEXTO ────────────────────────────────────────────────────
-- Berg: enunciados e descritores 0–4 conforme a versão brasileira da Escala de
-- Equilíbrio de Berg (Miyamoto et al., 2004). Roland-Morris: as 24 afirmações da
-- versão brasileira do questionário (Nusbaum et al., 2001). SPPB: pontos de
-- corte publicados por Guralnik et al. (1994) para o percurso de 4 metros.
-- Ashworth: descritores da Escala de Ashworth Modificada (Bohannon & Smith,
-- 1987). Oxford/MRC: graus 0–5 de força muscular.
-- Nada aqui foi parafraseado "de memória aproximada": item de que não se tinha o
-- texto oficial ficou de fora em vez de entrar reescrito.
--
-- Depende de: 20260725190000_physio_test_item_engine.sql.
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function private.seed_physio_test_items(p_clinic uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Clínica sem catálogo de fisioterapia não ganha nada: esta função roda no
  -- backfill de TODAS as clínicas, e numa odontológica os dois testes novos
  -- seriam lixo numa tela que ela nunca abre.
  if not exists (select 1 from public.physio_test where clinic_id = p_clinic) then
    return;
  end if;

  -- ── 1. Os dois testes que faltavam no catálogo ────────────────────────────
  -- SPPB e Ashworth não existiam (conferido em physio_test): sem eles, dois dos
  -- instrumentos autorizados não teriam onde pendurar item.
  insert into public.physio_test (clinic_id, name, specialty, kind, is_seed, scoring_kind, instructions)
  select p_clinic, t.name, t.specialty, 'scale'::public.physio_test_kind, true,
         'sum_items'::public.physio_scoring_kind, t.instructions
    from (values
      ('Bateria Curta de Desempenho Físico (SPPB)', 'Geriátrica',
        'Avalie os três componentes na ordem: equilíbrio (pés juntos, semitandem e tandem, até 10 segundos cada), velocidade de marcha em 4 metros no ritmo habitual e levantar-se da cadeira 5 vezes com os braços cruzados sobre o tórax. Cada componente vale de 0 a 4 pontos; o total vai de 0 a 12.'),
      ('Escala de Ashworth Modificada (Espasticidade)', 'Neurológica',
        'Mobilize passivamente o segmento avaliado e classifique a resistência sentida ao longo da amplitude. A escala avalia UM grupo muscular por aplicação — registre na evolução qual músculo e qual lado foram avaliados, e repita o teste para cada segmento de interesse.')
    ) as t(name, specialty, instructions)
   where not exists (
     select 1 from public.physio_test pt
      where pt.clinic_id = p_clinic and pt.name = t.name
   );

  -- Faixas dos testes novos, já com os limites numéricos. Entram aqui (e não em
  -- private.apply_physio_test_score_bands) porque aquela função é o BACKFILL de
  -- um catálogo que já existia sem limites; teste que NASCE nesta migration
  -- nasce com o limite junto, sem depender de uma segunda passada.
  insert into public.physio_test_level (clinic_id, test_id, name, description, sort_order, min_score, max_score)
  select p_clinic, pt.id, lv.level_name, lv.description, lv.sort_order, lv.min_score, lv.max_score
    from (values
      ('Bateria Curta de Desempenho Físico (SPPB)', '0 – 3 pontos',
        'Desempenho físico muito baixo — incapacidade grave', 10, 0::numeric, 3::numeric),
      ('Bateria Curta de Desempenho Físico (SPPB)', '4 – 6 pontos',
        'Desempenho físico baixo — incapacidade moderada', 20, 4, 6),
      ('Bateria Curta de Desempenho Físico (SPPB)', '7 – 9 pontos',
        'Desempenho físico moderado — incapacidade leve', 30, 7, 9),
      ('Bateria Curta de Desempenho Físico (SPPB)', '10 – 12 pontos',
        'Desempenho físico bom — incapacidade mínima', 40, 10, 12),
      -- Ashworth: a "faixa" É o grau. O 1+ vale 1,5 para caber entre o 1 e o 2
      -- sem quebrar a ordem numérica (ver o comment de physio_test_item_option.points).
      ('Escala de Ashworth Modificada (Espasticidade)', 'Grau 0',
        'Nenhum aumento do tônus muscular', 10, 0, 0),
      ('Escala de Ashworth Modificada (Espasticidade)', 'Grau 1',
        'Leve aumento do tônus, com resistência mínima no final da amplitude', 20, 1, 1),
      ('Escala de Ashworth Modificada (Espasticidade)', 'Grau 1+',
        'Leve aumento do tônus, com resistência em menos da metade da amplitude', 25, 1.5, 1.5),
      ('Escala de Ashworth Modificada (Espasticidade)', 'Grau 2',
        'Aumento do tônus na maior parte da amplitude, mas o segmento move-se facilmente', 30, 2, 2),
      ('Escala de Ashworth Modificada (Espasticidade)', 'Grau 3',
        'Aumento considerável do tônus — movimento passivo difícil', 40, 3, 3),
      ('Escala de Ashworth Modificada (Espasticidade)', 'Grau 4',
        'Segmento rígido em flexão ou extensão', 50, 4, 4)
    ) as lv(test_name, level_name, description, sort_order, min_score, max_score)
    join public.physio_test pt
      on pt.clinic_id = p_clinic and pt.name = lv.test_name
   where not exists (
     select 1 from public.physio_test_level l
      where l.test_id = pt.id and l.name = lv.level_name
   );

  -- ── 2. Os itens ───────────────────────────────────────────────────────────
  insert into public.physio_test_item (clinic_id, test_id, code, label, help, sort_order)
  select p_clinic, pt.id, it.code, it.label, it.help, it.sort_order
    from (values
      -- ══ Berg — 14 itens, 0 a 4 pontos cada (total 56) ═══════════════════
      ('Escala de Equilíbrio de Berg', 'berg_01',
        'Posição sentada para posição em pé', null::text, 10),
      ('Escala de Equilíbrio de Berg', 'berg_02',
        'Permanecer em pé sem apoio', null, 20),
      ('Escala de Equilíbrio de Berg', 'berg_03',
        'Permanecer sentado sem apoio nas costas, mas com os pés apoiados no chão ou num banquinho', null, 30),
      ('Escala de Equilíbrio de Berg', 'berg_04',
        'Posição em pé para posição sentada', null, 40),
      ('Escala de Equilíbrio de Berg', 'berg_05',
        'Transferências', null, 50),
      ('Escala de Equilíbrio de Berg', 'berg_06',
        'Permanecer em pé sem apoio com os olhos fechados', null, 60),
      ('Escala de Equilíbrio de Berg', 'berg_07',
        'Permanecer em pé sem apoio com os pés juntos', null, 70),
      ('Escala de Equilíbrio de Berg', 'berg_08',
        'Alcançar à frente com o braço estendido permanecendo em pé', null, 80),
      ('Escala de Equilíbrio de Berg', 'berg_09',
        'Pegar um objeto do chão a partir de uma posição em pé', null, 90),
      ('Escala de Equilíbrio de Berg', 'berg_10',
        'Virar-se e olhar para trás por cima dos ombros direito e esquerdo enquanto permanece em pé', null, 100),
      ('Escala de Equilíbrio de Berg', 'berg_11',
        'Girar 360 graus', null, 110),
      ('Escala de Equilíbrio de Berg', 'berg_12',
        'Posicionar os pés alternadamente no degrau ou banquinho enquanto permanece em pé sem apoio', null, 120),
      ('Escala de Equilíbrio de Berg', 'berg_13',
        'Permanecer em pé sem apoio com um pé à frente', null, 130),
      ('Escala de Equilíbrio de Berg', 'berg_14',
        'Permanecer em pé sobre uma perna', null, 140),

      -- ══ Roland-Morris — 24 afirmações sim/não (total 24) ════════════════
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_01',
        'Fico em casa a maior parte do tempo por causa da minha dor nas costas.', null, 10),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_02',
        'Mudo de posição frequentemente, tentando deixar minhas costas confortáveis.', null, 20),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_03',
        'Ando mais devagar do que o habitual por causa das minhas costas.', null, 30),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_04',
        'Por causa das minhas costas, eu não estou fazendo nenhum dos trabalhos que geralmente faço em casa.', null, 40),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_05',
        'Por causa das minhas costas, eu uso o corrimão para subir escadas.', null, 50),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_06',
        'Por causa das minhas costas, eu me deito para descansar mais frequentemente.', null, 60),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_07',
        'Por causa das minhas costas, eu tenho que me apoiar em alguma coisa para me levantar de uma poltrona.', null, 70),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_08',
        'Por causa das minhas costas, tento conseguir que outras pessoas façam as coisas por mim.', null, 80),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_09',
        'Eu me visto mais lentamente do que o habitual por causa das minhas costas.', null, 90),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_10',
        'Eu somente fico em pé por curtos períodos de tempo por causa das minhas costas.', null, 100),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_11',
        'Por causa das minhas costas, eu evito me abaixar ou me ajoelhar.', null, 110),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_12',
        'Encontro dificuldade para me levantar de uma cadeira por causa das minhas costas.', null, 120),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_13',
        'Minhas costas doem quase o tempo todo.', null, 130),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_14',
        'Tenho dificuldade em me virar na cama por causa das minhas costas.', null, 140),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_15',
        'Meu apetite não é muito bom por causa da minha dor nas costas.', null, 150),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_16',
        'Tenho problemas para colocar minhas meias por causa da dor nas minhas costas.', null, 160),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_17',
        'Caminho apenas curtas distâncias por causa da minha dor nas costas.', null, 170),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_18',
        'Não durmo tão bem por causa das minhas costas.', null, 180),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_19',
        'Por causa da minha dor nas costas, eu me visto com ajuda de outras pessoas.', null, 190),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_20',
        'Fico sentado a maior parte do dia por causa das minhas costas.', null, 200),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_21',
        'Evito trabalhos pesados em casa por causa das minhas costas.', null, 210),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_22',
        'Por causa da minha dor nas costas, fico mais irritado e mal humorado com as pessoas do que o habitual.', null, 220),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_23',
        'Por causa das minhas costas, eu subo escadas mais vagarosamente do que o habitual.', null, 230),
      ('Escala de Incapacidade de Roland-Morris (Lombar)', 'rm_24',
        'Fico na cama a maior parte do tempo por causa das minhas costas.', null, 240),

      -- ══ SPPB — 3 componentes, 0 a 4 pontos cada (total 12) ══════════════
      ('Bateria Curta de Desempenho Físico (SPPB)', 'sppb_balance',
        'Equilíbrio: pés juntos, semitandem e tandem',
        'Peça ao paciente que mantenha cada posição por até 10 segundos, nesta ordem: pés juntos; semitandem (o calcanhar de um pé ao lado do hálux do outro); tandem (um pé imediatamente à frente do outro). Interrompa a contagem quando ele sair da posição.', 10),
      ('Bateria Curta de Desempenho Físico (SPPB)', 'sppb_gait',
        'Velocidade de marcha em 4 metros',
        'Cronometre o tempo para percorrer 4 metros em ritmo habitual, com o dispositivo de auxílio à marcha que o paciente costuma usar. Faça duas tentativas e registre a mais rápida.', 20),
      ('Bateria Curta de Desempenho Físico (SPPB)', 'sppb_chair',
        'Levantar-se da cadeira 5 vezes',
        'Com os braços cruzados sobre o tórax, o paciente levanta-se e senta-se 5 vezes seguidas, o mais rápido que conseguir. Cronometre do início até estar em pé na 5ª repetição.', 30),

      -- ══ Ashworth — 1 item de GRAU ═══════════════════════════════════════
      ('Escala de Ashworth Modificada (Espasticidade)', 'ashworth_grade',
        'Grau de espasticidade do segmento avaliado',
        'Mobilize o segmento passivamente e classifique a resistência sentida. Um segmento por aplicação — repita o teste para cada músculo/lado de interesse.', 10),

      -- ══ Oxford — 1 item de GRAU ═════════════════════════════════════════
      ('Força Muscular — Escala de Oxford', 'oxford_grade',
        'Grau de força do músculo avaliado',
        'Posicione o paciente conforme o músculo testado e classifique a força observada. Um músculo por aplicação — repita o teste para cada grupo muscular de interesse.', 10)
    ) as it(test_name, code, label, help, sort_order)
    join public.physio_test pt
      on pt.clinic_id = p_clinic and pt.name = it.test_name
   where not exists (
     select 1 from public.physio_test_item i
      where i.test_id = pt.id and i.code = it.code
   );

  -- ── 3. As opções ──────────────────────────────────────────────────────────
  -- Ordem de apresentação: Berg segue a folha oficial (4 → 0); as escalas de
  -- grau seguem a ordem crescente do grau, que é como o profissional lê.
  -- O casamento é por `code` dentro da clínica (o teste fica implícito), e é por
  -- isso que todo code semeado leva o prefixo do instrumento: `code` só é único
  -- por TESTE, então dois instrumentos com o mesmo code pendurariam opção no
  -- item errado.
  insert into public.physio_test_item_option (clinic_id, item_id, label, points, sort_order)
  select p_clinic, i.id, op.label, op.points, op.sort_order
    from (values
      -- ══ Berg ════════════════════════════════════════════════════════════
      ('berg_01', 'Capaz de levantar-se sem utilizar as mãos e estabilizar-se independentemente', 4::numeric, 10),
      ('berg_01', 'Capaz de levantar-se independentemente utilizando as mãos', 3, 20),
      ('berg_01', 'Capaz de levantar-se utilizando as mãos após diversas tentativas', 2, 30),
      ('berg_01', 'Necessita de ajuda mínima para levantar-se ou estabilizar-se', 1, 40),
      ('berg_01', 'Necessita de ajuda moderada ou máxima para levantar-se', 0, 50),

      ('berg_02', 'Capaz de permanecer em pé com segurança por 2 minutos', 4, 10),
      ('berg_02', 'Capaz de permanecer em pé por 2 minutos com supervisão', 3, 20),
      ('berg_02', 'Capaz de permanecer em pé por 30 segundos sem apoio', 2, 30),
      ('berg_02', 'Necessita de várias tentativas para permanecer em pé por 30 segundos sem apoio', 1, 40),
      ('berg_02', 'Incapaz de permanecer em pé por 30 segundos sem apoio', 0, 50),

      ('berg_03', 'Capaz de permanecer sentado com segurança e com firmeza por 2 minutos', 4, 10),
      ('berg_03', 'Capaz de permanecer sentado por 2 minutos sob supervisão', 3, 20),
      ('berg_03', 'Capaz de permanecer sentado por 30 segundos', 2, 30),
      ('berg_03', 'Capaz de permanecer sentado por 10 segundos', 1, 40),
      ('berg_03', 'Incapaz de permanecer sentado sem apoio durante 10 segundos', 0, 50),

      ('berg_04', 'Senta-se com segurança com uso mínimo das mãos', 4, 10),
      ('berg_04', 'Controla a descida utilizando as mãos', 3, 20),
      ('berg_04', 'Utiliza a parte posterior das pernas contra a cadeira para controlar a descida', 2, 30),
      ('berg_04', 'Senta-se independentemente, mas tem descida sem controle', 1, 40),
      ('berg_04', 'Necessita de ajuda para sentar-se', 0, 50),

      ('berg_05', 'Capaz de transferir-se com segurança com uso mínimo das mãos', 4, 10),
      ('berg_05', 'Capaz de transferir-se com segurança com o uso das mãos', 3, 20),
      ('berg_05', 'Capaz de transferir-se seguindo orientações verbais e/ou supervisão', 2, 30),
      ('berg_05', 'Necessita de uma pessoa para ajudar', 1, 40),
      ('berg_05', 'Necessita de duas pessoas para ajudar ou supervisionar para realizar a tarefa com segurança', 0, 50),

      ('berg_06', 'Capaz de permanecer em pé por 10 segundos com segurança', 4, 10),
      ('berg_06', 'Capaz de permanecer em pé por 10 segundos com supervisão', 3, 20),
      ('berg_06', 'Capaz de permanecer em pé por 3 segundos', 2, 30),
      ('berg_06', 'Incapaz de permanecer com os olhos fechados durante 3 segundos, mas mantém-se em pé', 1, 40),
      ('berg_06', 'Necessita de ajuda para não cair', 0, 50),

      ('berg_07', 'Capaz de posicionar os pés juntos independentemente e permanecer por 1 minuto com segurança', 4, 10),
      ('berg_07', 'Capaz de posicionar os pés juntos independentemente e permanecer por 1 minuto com supervisão', 3, 20),
      ('berg_07', 'Capaz de posicionar os pés juntos independentemente e permanecer por 30 segundos', 2, 30),
      ('berg_07', 'Necessita de ajuda para posicionar-se, mas é capaz de permanecer com os pés juntos durante 15 segundos', 1, 40),
      ('berg_07', 'Necessita de ajuda para posicionar-se e é incapaz de permanecer nessa posição por 15 segundos', 0, 50),

      ('berg_08', 'Pode avançar à frente mais que 25 cm com segurança', 4, 10),
      ('berg_08', 'Pode avançar à frente mais que 12,5 cm com segurança', 3, 20),
      ('berg_08', 'Pode avançar à frente mais que 5 cm com segurança', 2, 30),
      ('berg_08', 'Pode avançar à frente, mas necessita de supervisão', 1, 40),
      ('berg_08', 'Perde o equilíbrio na tentativa ou necessita de apoio externo', 0, 50),

      ('berg_09', 'Capaz de pegar o objeto com facilidade e segurança', 4, 10),
      ('berg_09', 'Capaz de pegar o objeto, mas necessita de supervisão', 3, 20),
      ('berg_09', 'Incapaz de pegá-lo, mas se estica até ficar a 2–5 cm do objeto e mantém o equilíbrio independentemente', 2, 30),
      ('berg_09', 'Incapaz de pegá-lo, necessitando de supervisão enquanto está tentando', 1, 40),
      ('berg_09', 'Incapaz de tentar ou necessita de ajuda para não perder o equilíbrio ou cair', 0, 50),

      ('berg_10', 'Olha para trás de ambos os lados com boa distribuição do peso', 4, 10),
      ('berg_10', 'Olha para trás somente de um lado; o lado contrário demonstra menor distribuição do peso', 3, 20),
      ('berg_10', 'Vira somente para os lados, mas mantém o equilíbrio', 2, 30),
      ('berg_10', 'Necessita de supervisão para virar', 1, 40),
      ('berg_10', 'Necessita de ajuda para não perder o equilíbrio ou cair', 0, 50),

      ('berg_11', 'Capaz de girar 360 graus com segurança em 4 segundos ou menos', 4, 10),
      ('berg_11', 'Capaz de girar 360 graus com segurança somente para um lado em 4 segundos ou menos', 3, 20),
      ('berg_11', 'Capaz de girar 360 graus com segurança, mas lentamente', 2, 30),
      ('berg_11', 'Necessita de supervisão próxima ou orientações verbais', 1, 40),
      ('berg_11', 'Necessita de ajuda enquanto gira', 0, 50),

      ('berg_12', 'Capaz de permanecer em pé independentemente e com segurança, completando 8 movimentos em 20 segundos', 4, 10),
      ('berg_12', 'Capaz de permanecer em pé independentemente e completar 8 movimentos em mais que 20 segundos', 3, 20),
      ('berg_12', 'Capaz de completar 4 movimentos sem ajuda', 2, 30),
      ('berg_12', 'Capaz de completar mais que 2 movimentos com o mínimo de ajuda', 1, 40),
      ('berg_12', 'Incapaz de tentar ou necessita de ajuda para não cair', 0, 50),

      ('berg_13', 'Capaz de colocar um pé imediatamente à frente do outro, independentemente, e permanecer por 30 segundos', 4, 10),
      ('berg_13', 'Capaz de colocar um pé um pouco mais à frente do outro e levemente para o lado, independentemente, e permanecer por 30 segundos', 3, 20),
      ('berg_13', 'Capaz de dar um pequeno passo independentemente e permanecer por 30 segundos', 2, 30),
      ('berg_13', 'Necessita de ajuda para dar o passo, porém permanece por 15 segundos', 1, 40),
      ('berg_13', 'Perde o equilíbrio ao tentar dar um passo ou ficar de pé', 0, 50),

      ('berg_14', 'Capaz de levantar uma perna independentemente e permanecer por mais que 10 segundos', 4, 10),
      ('berg_14', 'Capaz de levantar uma perna independentemente e permanecer por 5 a 10 segundos', 3, 20),
      ('berg_14', 'Capaz de levantar uma perna independentemente e permanecer por mais que 3 segundos', 2, 30),
      ('berg_14', 'Tenta levantar uma perna, mas é incapaz de permanecer por 3 segundos, embora permaneça em pé independentemente', 1, 40),
      ('berg_14', 'Incapaz de tentar ou necessita de ajuda para não cair', 0, 50),

      -- ══ SPPB ════════════════════════════════════════════════════════════
      ('sppb_balance', 'Tandem por 10 segundos', 4, 10),
      ('sppb_balance', 'Semitandem por 10 segundos e tandem de 3 a 9,99 segundos', 3, 20),
      ('sppb_balance', 'Semitandem por 10 segundos, mas tandem por menos de 3 segundos', 2, 30),
      ('sppb_balance', 'Pés juntos por 10 segundos, mas semitandem por menos de 10 segundos', 1, 40),
      ('sppb_balance', 'Incapaz de manter os pés juntos por 10 segundos', 0, 50),

      ('sppb_gait', 'Menos de 4,82 segundos', 4, 10),
      ('sppb_gait', 'De 4,82 a 6,20 segundos', 3, 20),
      ('sppb_gait', 'De 6,21 a 8,70 segundos', 2, 30),
      ('sppb_gait', 'Mais de 8,70 segundos', 1, 40),
      ('sppb_gait', 'Incapaz de completar o percurso', 0, 50),

      ('sppb_chair', '11,19 segundos ou menos', 4, 10),
      ('sppb_chair', 'De 11,20 a 13,69 segundos', 3, 20),
      ('sppb_chair', 'De 13,70 a 16,69 segundos', 2, 30),
      ('sppb_chair', '16,70 segundos ou mais', 1, 40),
      ('sppb_chair', 'Incapaz de completar as 5 repetições ou tempo acima de 60 segundos', 0, 50),

      -- ══ Ashworth ════════════════════════════════════════════════════════
      ('ashworth_grade', 'Grau 0 — nenhum aumento do tônus muscular', 0, 10),
      ('ashworth_grade', 'Grau 1 — leve aumento do tônus, manifestado por tensão momentânea ou resistência mínima no final da amplitude de movimento', 1, 20),
      ('ashworth_grade', 'Grau 1+ — leve aumento do tônus, manifestado por tensão abrupta seguida de resistência mínima em menos da metade da amplitude restante', 1.5, 30),
      ('ashworth_grade', 'Grau 2 — aumento mais marcante do tônus durante a maior parte da amplitude, mas o segmento é movido facilmente', 2, 40),
      ('ashworth_grade', 'Grau 3 — aumento considerável do tônus; o movimento passivo é difícil', 3, 50),
      ('ashworth_grade', 'Grau 4 — segmento rígido em flexão ou extensão', 4, 60),

      -- ══ Oxford ══════════════════════════════════════════════════════════
      ('oxford_grade', 'Grau 0 — nenhuma contração muscular visível ou palpável', 0, 10),
      ('oxford_grade', 'Grau 1 — contração muscular visível ou palpável, sem movimento articular', 1, 20),
      ('oxford_grade', 'Grau 2 — movimento completo na amplitude, com a gravidade eliminada', 2, 30),
      ('oxford_grade', 'Grau 3 — movimento completo contra a gravidade, sem resistência', 3, 40),
      ('oxford_grade', 'Grau 4 — movimento completo contra a gravidade e contra resistência parcial', 4, 50),
      ('oxford_grade', 'Grau 5 — movimento completo contra a gravidade e contra resistência máxima (força normal)', 5, 60)
    ) as op(item_code, label, points, sort_order)
    join public.physio_test_item i
      on i.clinic_id = p_clinic and i.code = op.item_code
   where not exists (
     select 1 from public.physio_test_item_option x
      where x.item_id = i.id and x.label = op.label
   );

  -- Roland-Morris é sim/não nos 24 itens: gerar por cross join em vez de listar
  -- 48 linhas idênticas deixa claro que a resposta é a MESMA em todos eles.
  insert into public.physio_test_item_option (clinic_id, item_id, label, points, sort_order)
  select p_clinic, i.id, o.label, o.points, o.sort_order
    from public.physio_test_item i
    join public.physio_test t on t.id = i.test_id
   cross join (values ('Sim', 1::numeric, 10), ('Não', 0, 20)) as o(label, points, sort_order)
   where t.clinic_id = p_clinic
     and t.name = 'Escala de Incapacidade de Roland-Morris (Lombar)'
     and not exists (
       select 1 from public.physio_test_item_option x
        where x.item_id = i.id and x.label = o.label
     );

  -- ── 4. Quem passa a somar no banco ────────────────────────────────────────
  -- `is distinct from` evita reescrever linha que já está certa — sem isso,
  -- cada backfill geraria uma linha de tr_audit por teste, sem nada ter mudado.
  update public.physio_test t
     set scoring_kind = 'sum_items'
   where t.clinic_id = p_clinic
     and t.name in (
       'Escala de Equilíbrio de Berg',
       'Escala de Incapacidade de Roland-Morris (Lombar)',
       'Bateria Curta de Desempenho Físico (SPPB)',
       'Escala de Ashworth Modificada (Espasticidade)',
       'Força Muscular — Escala de Oxford'
     )
     and t.scoring_kind is distinct from 'sum_items'::public.physio_scoring_kind;
end;
$$;

comment on function private.seed_physio_test_items(uuid) is
  'Semeia os ITENS e as OPÇÕES dos instrumentos de domínio público autorizados '
  '(Berg, Roland-Morris, SPPB, Ashworth, Oxford) e cria SPPB e Ashworth, que '
  'não existiam no catálogo. Marca esses cinco como scoring_kind = sum_items. '
  'Idempotente por nome do teste / code do item / label da opção. Não faz nada '
  'em clínica sem catálogo de fisioterapia.';

revoke execute on function private.seed_physio_test_items(uuid) from public;

-- ── 5. Clínica nova já nasce com os itens ───────────────────────────────────
-- Mesma composição de funções irmãs de 20260725140000/20260725180000: a
-- assinatura de tg_seed_physio_test_catalog não muda, só o corpo ganha mais uma
-- chamada — nenhum seeder precisa ser reescrito para o catálogo crescer.
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
  perform private.seed_physio_test_items(new.id);         -- itens das escalas somadas
  -- Tudo que acabou de entrar é catálogo de REFERÊNCIA. Marcar aqui (e não
  -- dentro de cada seeder) resolve de uma vez o default `false` que deixava o
  -- catálogo apagável pela clínica — e é seguro porque a clínica acabou de
  -- nascer: não existe teste personalizado dela para ser marcado por engano.
  update public.physio_test set is_seed = true where clinic_id = new.id;
  return new;
end;
$$;

-- ── 6. Backfill das clínicas existentes ─────────────────────────────────────
do $$
declare
  c record;
begin
  for c in select id from public.clinic loop
    perform private.seed_physio_test_items(c.id);
  end loop;
end;
$$;
