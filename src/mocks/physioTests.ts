// Catálogo de DEMONSTRAÇÃO de testes/escalas de avaliação fisioterapêutica
// (Administrativo → Testes). UI-only: ainda não há tabela no banco.
//
// Cada "teste" aqui = nome + instruções de aplicação + uma lista ordenada de
// NÍVEIS. O modelo atual (nome + imagem + instruções + níveis) é simples de
// propósito — cobre bem escalas de UM eixo (força, dor) e, para os instrumentos
// multi-item mais conhecidos (Berg, Barthel, Roland-Morris, Fugl-Meyer, TUG), os
// "níveis" representam a INTERPRETAÇÃO da pontuação total/tempo — não o
// formulário item a item (isso fica para uma versão futura com motor de
// perguntas, tipo SurveyJS).
//
// Fonte de referência: Rehabilitation Measures Database (instrumentos de
// reabilitação amplamente usados na literatura). Faixas marcadas como
// "referência geral" não têm corte oficial único na literatura — variam por
// fonte/população — e servem de ponto de partida clínico, não de laudo fechado.

export interface TestLevel {
  id: string
  name: string
  description: string
}

export interface PhysioTest {
  id: string
  name: string
  image?: string
  /** Neurológica, Ortopédica, Respiratória... (ver constants/testSpecialty). Texto
   *  livre: a lista fixa é só sugestão — o cadastro aceita uma especialização própria. */
  specialty: string
  /** Como o teste é realizado — o passo a passo da aplicação. */
  instructions?: string
  levels: TestLevel[]
}

let levelSeq = 0
const lv = (name: string, description: string): TestLevel => ({ id: `lv-${++levelSeq}`, name, description })

export const MOCK_PHYSIO_TESTS: PhysioTest[] = [
  {
    id: 't1',
    name: 'Força Muscular — Escala de Oxford',
    specialty: 'Ortopédica',
    instructions:
      'Peça ao paciente que realize o movimento articular avaliado enquanto o examinador aplica '
      + 'resistência manual. Compare com o lado contralateral quando possível e classifique a força '
      + 'observada em um dos graus de 0 a 5.',
    levels: [
      lv('Grau 0', 'Nenhuma contração muscular'),
      lv('Grau 1', 'Contração visível, sem movimento'),
      lv('Grau 2', 'Movimento sem ação da gravidade'),
      lv('Grau 3', 'Movimento contra a gravidade'),
      lv('Grau 4', 'Movimento contra resistência moderada'),
      lv('Grau 5', 'Força normal'),
    ],
  },
  {
    id: 't2',
    name: 'Escala Visual Analógica de Dor (EVA)',
    specialty: 'Ortopédica',
    instructions:
      'Apresente ao paciente uma linha de 0 a 10, com as extremidades marcadas "sem dor" e "pior dor '
      + 'imaginável". Peça que ele aponte ou marque o ponto que representa a intensidade da dor no '
      + 'momento da avaliação e registre o valor numérico correspondente.',
    levels: [
      lv('0', 'Sem dor'),
      lv('1 – 3', 'Dor leve'),
      lv('4 – 6', 'Dor moderada'),
      lv('7 – 9', 'Dor intensa'),
      lv('10', 'Pior dor imaginável'),
    ],
  },
  {
    id: 't3',
    name: 'Escala de Equilíbrio de Berg',
    specialty: 'Neurológica',
    instructions:
      'Aplique os 14 itens da escala (ex.: sentar sem apoio, levantar-se, permanecer em pé com os olhos '
      + 'fechados, alcançar à frente, girar-se 360°), pontuando cada um de 0 a 4 conforme o desempenho '
      + 'observado. Some os pontos dos 14 itens (máximo 56) para obter o total.',
    levels: [
      lv('0 – 20 pontos', 'Alto risco de queda — equilíbrio comprometido, geralmente dependente de cadeira de rodas'),
      lv('21 – 40 pontos', 'Risco médio de queda — marcha com assistência'),
      lv('41 – 56 pontos', 'Baixo risco de queda — equilíbrio funcional independente'),
    ],
  },
  {
    id: 't4',
    name: 'Timed Up and Go (TUG)',
    specialty: 'Geriátrica',
    instructions:
      'Posicione o paciente sentado numa cadeira com apoio de braços. Ao comando "já", cronometre o '
      + 'tempo que ele leva para se levantar, caminhar 3 metros, virar, retornar e sentar novamente. '
      + 'Registre o tempo total em segundos.',
    levels: [
      lv('< 10 segundos', 'Mobilidade normal, totalmente independente'),
      lv('10 – 19 segundos', 'Mobilidade preservada, independente na maioria das atividades'),
      lv('20 – 29 segundos', 'Mobilidade variável — atenção ao risco de queda'),
      lv('≥ 30 segundos', 'Dependente para a maioria das atividades de mobilidade — alto risco de queda'),
    ],
  },
  {
    id: 't5',
    name: 'Teste de Caminhada de 6 Minutos (TC6)',
    specialty: 'Respiratória (Cardiorrespiratória)',
    instructions:
      'Demarque um corredor plano de pelo menos 30 metros. Oriente o paciente a caminhar o mais rápido '
      + 'possível, sem correr, durante 6 minutos — ele pode desacelerar ou parar para descansar se '
      + 'necessário. Registre a distância total percorrida em metros ao final do tempo.',
    levels: [
      lv('< 300 m', 'Limitação funcional importante (referência geral — comparar com valor previsto por idade/sexo/altura)'),
      lv('300 – 450 m', 'Limitação funcional moderada (referência geral)'),
      lv('> 450 m', 'Capacidade funcional preservada (referência geral)'),
    ],
  },
  {
    id: 't6',
    name: 'Índice de Barthel (Atividades de Vida Diária)',
    specialty: 'Neurológica',
    instructions:
      'Avalie 10 atividades de vida diária (alimentação, banho, higiene pessoal, vestir-se, controle '
      + 'esfincteriano, uso do banheiro, transferências, mobilidade e subir escadas), pontuando cada '
      + 'uma conforme o grau de independência do paciente. Some os pontos (máximo 100) para o total.',
    levels: [
      lv('0 – 20 pontos', 'Dependência total'),
      lv('21 – 60 pontos', 'Dependência grave'),
      lv('61 – 90 pontos', 'Dependência moderada'),
      lv('91 – 99 pontos', 'Dependência leve'),
      lv('100 pontos', 'Independente'),
    ],
  },
  {
    id: 't7',
    name: 'Escala de Incapacidade de Roland-Morris (Lombar)',
    specialty: 'Ortopédica',
    instructions:
      'Aplique o questionário de 24 itens sobre limitações causadas pela dor lombar nas atividades '
      + 'diárias, marcando cada item como sim/não conforme a situação do paciente hoje. Some o número '
      + 'de itens marcados como "sim" (máximo 24) para obter o escore de incapacidade.',
    levels: [
      lv('0 – 8 pontos', 'Incapacidade leve (referência geral)'),
      lv('9 – 16 pontos', 'Incapacidade moderada (referência geral)'),
      lv('17 – 24 pontos', 'Incapacidade grave (referência geral)'),
    ],
  },
  {
    id: 't8',
    name: 'Escala de Fugl-Meyer (Domínio Motor)',
    specialty: 'Neurológica',
    instructions:
      'Avalie os itens do domínio motor (membro superior e inferior) conforme o protocolo do '
      + 'instrumento, pontuando cada movimento/reflexo numa escala de 0 (não consegue realizar) a 2 '
      + '(realiza completamente). Some os pontos do domínio motor (máximo 100) para o total.',
    levels: [
      lv('< 50 pontos', 'Comprometimento motor grave'),
      lv('50 – 84 pontos', 'Comprometimento motor acentuado'),
      lv('85 – 95 pontos', 'Comprometimento motor moderado a leve'),
      lv('96 – 99 pontos', 'Comprometimento motor discreto'),
    ],
  },
]
