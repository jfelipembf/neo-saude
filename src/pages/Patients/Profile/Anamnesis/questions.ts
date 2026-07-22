import type { Anamnesis } from '@/types/domain'

// ─────────────────────────────────────────────────────────────────────────────
// Perguntas da anamnese — FONTE ÚNICA. A leitura, o formulário de edição e o
// documento impresso são todos gerados a partir daqui: acrescentar uma pergunta
// é acrescentar uma linha nesta lista (e o campo em `Anamnesis`).
//
// Baseado no modelo de prontuário odontológico sugerido pelos Conselhos
// Regionais de Odontologia (CRO).
// ─────────────────────────────────────────────────────────────────────────────

/** Campos de RESPOSTA — fora a chave do paciente e o carimbo de data, que não
 *  são perguntas. Todos guardam string (opção escolhida ou texto digitado). */
export type CampoAnamnese = Exclude<keyof Anamnesis, 'pacienteId' | 'atualizadaEm'>

export interface PerguntaAnamnese {
  campo: CampoAnamnese
  pergunta: string
  /** Resposta fechada (botões) ou campo aberto. */
  tipo: 'opcoes' | 'texto' | 'textoLongo'
  opcoes?: { value: string; label: string }[]
  /** Campo de detalhe que só aparece quando a resposta estiver em `quando`. */
  detalhe?: { campo: CampoAnamnese; label: string; quando: string[] }
}

const SIM_NAO = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
]

const SIM_NAO_NAO_SEI = [
  ...SIM_NAO,
  { value: 'nao_sei', label: 'Não sei' },
]

export interface SecaoAnamnese {
  titulo: string
  descricao?: string
  perguntas: PerguntaAnamnese[]
}

export const SECOES_ANAMNESE: SecaoAnamnese[] = [
  {
    titulo: 'Saúde geral',
    descricao: 'Condições que interferem no atendimento, na anestesia e na cicatrização.',
    perguntas: [
      {
        campo: 'medicamentos', pergunta: 'Está tomando algum medicamento?', tipo: 'opcoes', opcoes: SIM_NAO,
        detalhe: { campo: 'medicamentosQuais', label: 'Quais (posologia e dose)', quando: ['sim'] },
      },
      {
        campo: 'alergia', pergunta: 'Tem algum tipo de alergia?', tipo: 'opcoes', opcoes: SIM_NAO_NAO_SEI,
        detalhe: { campo: 'alergiaQual', label: 'Qual', quando: ['sim'] },
      },
      {
        campo: 'pressao', pergunta: 'Sua pressão é:', tipo: 'opcoes',
        opcoes: [
          { value: 'normal',     label: 'Normal' },
          { value: 'alta',       label: 'Alta' },
          { value: 'baixa',      label: 'Baixa' },
          { value: 'controlada', label: 'Controlada com medicamento' },
        ],
      },
      {
        campo: 'problemaCoracao', pergunta: 'Tem ou teve algum problema de coração?', tipo: 'opcoes', opcoes: SIM_NAO,
        detalhe: { campo: 'problemaCoracaoQual', label: 'Qual', quando: ['sim'] },
      },
      { campo: 'faltaDeAr', pergunta: 'Sente falta de ar com frequência?', tipo: 'opcoes', opcoes: SIM_NAO },
      { campo: 'diabetes',  pergunta: 'Tem diabetes?', tipo: 'opcoes', opcoes: SIM_NAO_NAO_SEI },
      {
        campo: 'sangramento', pergunta: 'Quando se corta, o sangramento é:', tipo: 'opcoes',
        opcoes: [{ value: 'normal', label: 'Normal' }, { value: 'excessivo', label: 'Excessivo' }],
      },
      {
        campo: 'cicatrizacao', pergunta: 'Sua cicatrização é:', tipo: 'opcoes',
        opcoes: [{ value: 'normal', label: 'Normal' }, { value: 'complicada', label: 'Complicada' }],
      },
      { campo: 'cirurgia', pergunta: 'Já fez alguma cirurgia?', tipo: 'opcoes', opcoes: SIM_NAO },
      {
        campo: 'gestante', pergunta: 'Gestante?', tipo: 'opcoes', opcoes: SIM_NAO_NAO_SEI,
        detalhe: { campo: 'gestanteSemanas', label: 'Semanas', quando: ['sim'] },
      },
      { campo: 'problemasSaude', pergunta: 'Problemas de saúde que já teve', tipo: 'textoLongo' },
    ],
  },
  {
    titulo: 'Saúde bucal',
    descricao: 'Queixa, histórico odontológico e hábitos de higiene.',
    perguntas: [
      { campo: 'queixaPrincipal', pergunta: 'Queixa principal', tipo: 'textoLongo' },
      {
        campo: 'reacaoAnestesia', pergunta: 'Já teve alguma reação com anestesia dental?', tipo: 'opcoes', opcoes: SIM_NAO,
        detalhe: { campo: 'reacaoAnestesiaQual', label: 'Qual', quando: ['sim'] },
      },
      { campo: 'ultimoTratamento',  pergunta: 'Quando foi seu último tratamento dentário?', tipo: 'texto' },
      { campo: 'dorDentesGengiva',  pergunta: 'Tem sentido dor nos dentes ou na gengiva?', tipo: 'opcoes', opcoes: SIM_NAO },
      {
        campo: 'gengivaSangra', pergunta: 'Sua gengiva sangra?', tipo: 'opcoes',
        opcoes: [
          { value: 'nao',              label: 'Não' },
          { value: 'sim',              label: 'Sim' },
          { value: 'durante_higiene',  label: 'Durante a higiene' },
          { value: 'as_vezes',         label: 'Às vezes' },
        ],
      },
      { campo: 'gostoRuimBocaSeca', pergunta: 'Tem sentido gosto ruim na boca ou boca seca?', tipo: 'opcoes', opcoes: SIM_NAO },
      { campo: 'escovacoesPorDia',  pergunta: 'Quantas vezes escova os dentes por dia?', tipo: 'texto' },
      {
        campo: 'fioDental', pergunta: 'Usa fio dental?', tipo: 'opcoes',
        opcoes: [
          { value: 'diariamente', label: 'Diariamente' },
          { value: 'as_vezes',    label: 'Às vezes' },
          { value: 'nao',         label: 'Não usa' },
        ],
      },
      { campo: 'dorEstalosMaxilar', pergunta: 'Sente dores ou estalos no maxilar ou no ouvido?', tipo: 'opcoes', opcoes: SIM_NAO },
      { campo: 'rangeDentes',       pergunta: 'Range os dentes de dia ou de noite?', tipo: 'opcoes', opcoes: SIM_NAO },
      { campo: 'feridaBolhaFace',   pergunta: 'Já teve alguma ferida ou bolha na face ou nos lábios?', tipo: 'opcoes', opcoes: SIM_NAO },
      {
        campo: 'fuma', pergunta: 'Fuma?', tipo: 'opcoes', opcoes: SIM_NAO,
        detalhe: { campo: 'fumaQuantidade', label: 'Quantidade por dia', quando: ['sim'] },
      },
    ],
  },
]

/** Rótulo legível de uma resposta fechada (leitura e impressão). */
export function rotuloDaResposta(p: PerguntaAnamnese, valor?: string) {
  if (!valor) return '—'
  return p.opcoes?.find(o => o.value === valor)?.label ?? valor
}

/** Respostas que merecem destaque clínico — o que muda a conduta do atendimento. */
export function ehAlerta(campo: CampoAnamnese, valor?: string) {
  if (!valor) return false
  const alertas: Partial<Record<CampoAnamnese, string[]>> = {
    alergia:         ['sim'],
    problemaCoracao: ['sim'],
    diabetes:        ['sim'],
    gestante:        ['sim'],
    pressao:         ['alta', 'baixa'],
    sangramento:     ['excessivo'],
    cicatrizacao:    ['complicada'],
    reacaoAnestesia: ['sim'],
    medicamentos:    ['sim'],
  }
  return alertas[campo]?.includes(valor) ?? false
}
