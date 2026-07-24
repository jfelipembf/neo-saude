import type { EditAnamnesis } from '@/services/anamnesisService'
import type { ClinicSpecialty } from '@/types/domain'

// ─────────────────────────────────────────────────────────────────────────────
// Perguntas da anamnese — FONTE ÚNICA. A leitura, o formulário de edição e o
// documento impresso são todos gerados a partir daqui: acrescentar uma pergunta
// é acrescentar uma linha nesta lista (e o campo em `Anamnesis`).
//
// "Saúde geral" é o NÚCLEO — toda especialidade pergunta isto. Cada ramo soma a
// SUA seção: odontologia usa o modelo sugerido pelos Conselhos Regionais de
// Odontologia (CRO); fisioterapia usa uma avaliação inicial padrão da área.
// `sectionsForSpecialty` decide quais seções entram, espelhando exatamente o
// que `private.seed_anamnesis_template` grava no banco por ramo — os dois
// PRECISAM ficar em sincronia (a RPC save_anamnesis rejeita código que o
// template do ramo não tiver).
// ─────────────────────────────────────────────────────────────────────────────

/** Campos de RESPOSTA: exatamente o que o formulário envia — logo, sem a chave
 *  do paciente, o carimbo de data nem o tenant, que não são perguntas.
 *  Derivar de `EditAnamnesis` mantém isto correto sozinho quando o domínio muda.
 *  Todos guardam string (opção escolhida ou texto digitado). */
export type AnamnesisField = keyof EditAnamnesis

export interface AnamnesisQuestion {
  field: AnamnesisField
  question: string
  /** Resposta fechada (botões) ou campo aberto. */
  type: 'options' | 'text' | 'longText'
  options?: { value: string; label: string }[]
  /** Campo de detalhe que só aparece quando a resposta estiver em `when`. */
  detail?: { field: AnamnesisField; label: string; when: string[] }
}

const YES_NO = [
  { value: 'yes', label: 'Sim' },
  { value: 'no', label: 'Não' },
]

const YES_NO_UNKNOWN = [
  ...YES_NO,
  { value: 'unknown', label: 'Não sei' },
]

export interface AnamnesisSection {
  title: string
  description?: string
  questions: AnamnesisQuestion[]
}

/** Núcleo — perguntado em toda especialidade. */
const CORE_SECTION: AnamnesisSection = {
  title: 'Saúde geral',
  description: 'Condições que interferem no atendimento e na conduta clínica.',
  questions: [
    {
      field: 'medications', question: 'Está tomando algum medicamento?', type: 'options', options: YES_NO,
      detail: { field: 'medicationsDetails', label: 'Quais (posologia e dose)', when: ['yes'] },
    },
    {
      field: 'allergy', question: 'Tem algum tipo de alergia?', type: 'options', options: YES_NO_UNKNOWN,
      detail: { field: 'allergyDetails', label: 'Qual', when: ['yes'] },
    },
    {
      field: 'bloodPressure', question: 'Sua pressão é:', type: 'options',
      options: [
        { value: 'normal',     label: 'Normal' },
        { value: 'high',       label: 'Alta' },
        { value: 'low',        label: 'Baixa' },
        { value: 'controlled', label: 'Controlada com medicamento' },
      ],
    },
    {
      field: 'heartCondition', question: 'Tem ou teve algum problema de coração?', type: 'options', options: YES_NO,
      detail: { field: 'heartConditionDetails', label: 'Qual', when: ['yes'] },
    },
    { field: 'shortnessOfBreath', question: 'Sente falta de ar com frequência?', type: 'options', options: YES_NO },
    { field: 'diabetes',  question: 'Tem diabetes?', type: 'options', options: YES_NO_UNKNOWN },
    {
      field: 'bleeding', question: 'Quando se corta, o sangramento é:', type: 'options',
      options: [{ value: 'normal', label: 'Normal' }, { value: 'excessive', label: 'Excessivo' }],
    },
    {
      field: 'healing', question: 'Sua cicatrização é:', type: 'options',
      options: [{ value: 'normal', label: 'Normal' }, { value: 'complicated', label: 'Complicada' }],
    },
    { field: 'surgery', question: 'Já fez alguma cirurgia?', type: 'options', options: YES_NO },
    {
      field: 'pregnant', question: 'Gestante?', type: 'options', options: YES_NO_UNKNOWN,
      detail: { field: 'pregnancyWeeks', label: 'Semanas', when: ['yes'] },
    },
    { field: 'healthIssues', question: 'Problemas de saúde que já teve', type: 'longText' },
  ],
}

/** Só odontologia — modelo sugerido pelo CRO. */
const DENTISTRY_SECTION: AnamnesisSection = {
  title: 'Saúde bucal',
  description: 'Queixa, histórico odontológico e hábitos de higiene.',
  questions: [
    { field: 'chiefComplaint', question: 'Queixa principal', type: 'longText' },
    {
      field: 'anesthesiaReaction', question: 'Já teve alguma reação com anestesia dental?', type: 'options', options: YES_NO,
      detail: { field: 'anesthesiaReactionDetails', label: 'Qual', when: ['yes'] },
    },
    { field: 'lastTreatment',  question: 'Quando foi seu último tratamento dentário?', type: 'text' },
    { field: 'toothGumPain',  question: 'Tem sentido dor nos dentes ou na gengiva?', type: 'options', options: YES_NO },
    {
      field: 'gumBleeding', question: 'Sua gengiva sangra?', type: 'options',
      options: [
        { value: 'no',               label: 'Não' },
        { value: 'yes',              label: 'Sim' },
        { value: 'during_brushing',  label: 'Durante a higiene' },
        { value: 'sometimes',        label: 'Às vezes' },
      ],
    },
    { field: 'badTasteDryMouth', question: 'Tem sentido gosto ruim na boca ou boca seca?', type: 'options', options: YES_NO },
    { field: 'brushingsPerDay',  question: 'Quantas vezes escova os dentes por dia?', type: 'text' },
    {
      field: 'flossing', question: 'Usa fio dental?', type: 'options',
      options: [
        { value: 'daily',     label: 'Diariamente' },
        { value: 'sometimes', label: 'Às vezes' },
        { value: 'no',        label: 'Não usa' },
      ],
    },
    { field: 'jawPainClicking', question: 'Sente dores ou estalos no maxilar ou no ouvido?', type: 'options', options: YES_NO },
    { field: 'grindsTeeth',       question: 'Range os dentes de dia ou de noite?', type: 'options', options: YES_NO },
    { field: 'faceSores',   question: 'Já teve alguma ferida ou bolha na face ou nos lábios?', type: 'options', options: YES_NO },
    {
      field: 'smokes', question: 'Fuma?', type: 'options', options: YES_NO,
      detail: { field: 'smokingAmount', label: 'Quantidade por dia', when: ['yes'] },
    },
  ],
}

/** Só fisioterapia — avaliação inicial: queixa, histórico da dor/lesão e sinais
 *  de alerta que mudam a conduta (encaminhar/investigar antes de tratar). */
const PHYSIOTHERAPY_SECTION: AnamnesisSection = {
  title: 'Avaliação fisioterapêutica',
  description: 'Queixa, histórico da dor ou lesão e sinais de alerta.',
  questions: [
    { field: 'chiefComplaint', question: 'Queixa principal', type: 'longText' },
    {
      field: 'onsetDescription',
      question: 'Como e quando o problema começou? (trauma, esforço repetitivo, cirurgia recente, início espontâneo...)',
      type: 'longText',
    },
    { field: 'painScale', question: 'Intensidade da dor hoje (0 a 10)', type: 'text' },
    {
      field: 'priorTreatment', question: 'Já fez fisioterapia ou outro tratamento para este problema?', type: 'options', options: YES_NO,
      detail: { field: 'priorTreatmentDetails', label: 'Onde/quando e com quais resultados', when: ['yes'] },
    },
    {
      field: 'physicalActivity', question: 'Pratica atividade física regularmente?', type: 'options', options: YES_NO,
      detail: { field: 'physicalActivityDetails', label: 'Qual e com que frequência', when: ['yes'] },
    },
    {
      field: 'affectedSide', question: 'Lado predominantemente afetado', type: 'options',
      options: [
        { value: 'right',          label: 'Direito' },
        { value: 'left',           label: 'Esquerdo' },
        { value: 'both',           label: 'Ambos' },
        { value: 'not_applicable', label: 'Não se aplica' },
      ],
    },
    {
      field: 'dailyImpact', question: 'A queixa atrapalha suas atividades diárias ou o trabalho?', type: 'options', options: YES_NO,
      detail: { field: 'dailyImpactDetails', label: 'Como', when: ['yes'] },
    },
    {
      field: 'redFlags',
      question: 'Tem sentido emagrecimento sem motivo aparente, dor noturna que não passa com repouso, febre ou alteração de força/sensibilidade?',
      type: 'options', options: YES_NO,
      detail: { field: 'redFlagsDetails', label: 'Descreva', when: ['yes'] },
    },
  ],
}

/** As seções da ficha, no ramo da clínica atual. Núcleo sempre entra; a segunda
 *  seção varia por especialidade (ausente = ramo ainda sem questionário próprio
 *  — ver comentário de seed_anamnesis_template). */
export function sectionsForSpecialty(specialty: ClinicSpecialty | undefined): AnamnesisSection[] {
  if (specialty === 'dentistry') return [CORE_SECTION, DENTISTRY_SECTION]
  if (specialty === 'physiotherapy') return [CORE_SECTION, PHYSIOTHERAPY_SECTION]
  return [CORE_SECTION]
}

/** Rótulo legível de uma resposta fechada (leitura e impressão). */
export function answerLabel(question: AnamnesisQuestion, value?: string) {
  if (!value) return '—'
  return question.options?.find(o => o.value === value)?.label ?? value
}

/** Respostas que merecem destaque clínico — o que muda a conduta do atendimento. */
export function isAlert(field: AnamnesisField, value?: string) {
  if (!value) return false
  const alerts: Partial<Record<AnamnesisField, string[]>> = {
    allergy:            ['yes'],
    heartCondition:     ['yes'],
    diabetes:           ['yes'],
    pregnant:           ['yes'],
    bloodPressure:      ['high', 'low'],
    bleeding:           ['excessive'],
    healing:            ['complicated'],
    anesthesiaReaction: ['yes'],
    medications:        ['yes'],
    redFlags:           ['yes'],
  }
  return alerts[field]?.includes(value) ?? false
}
