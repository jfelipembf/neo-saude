import { supabase } from '@/lib/supabase'
import { getCurrentClinicId, type ClientPayload } from '@/lib/tenant'
import { isoToBrDate } from '@/utils/date'
import type {
  Anamnesis, ClinicSpecialty, YesNo, YesNoUnknown, BloodPressure, BleedingLevel, HealingLevel,
  GumBleeding, FlossUse, AffectedSide,
} from '@/types/domain'
import type { Json } from '@/types/database.types'

// A anamnese é um QUESTIONÁRIO DINÂMICO no banco (template → pergunta → resposta),
// UM POR ESPECIALIDADE (private.seed_anamnesis_template), mas os CÓDIGOS batem 1:1
// com os campos do tipo plano `Anamnesis` (medications, allergy, chiefComplaint,
// painScale…). Então o de-para é direto: salvar via RPC save_anamnesis({codigo:
// resposta}) e carregar via patient_anamnesis (record.answers já vem achatado por
// código). A LEITURA extrai todo código conhecido (o que não existir no template do
// paciente simplesmente não aparece no map — val()/det() voltam undefined, sem
// erro). A ESCRITA precisa do `specialty` para montar só o subconjunto de códigos
// que EXISTE no template ativo — a RPC save_anamnesis rejeita código desconhecido
// (protege contra ficha de um ramo salvando pergunta de outro).

type AnswerVal = { value?: string | null; detail?: string | null } | undefined
type AnswerMap = Record<string, AnswerVal>
const val = (a: AnswerMap, code: string): string | undefined => a[code]?.value ?? undefined
const det = (a: AnswerMap, code: string): string | undefined => a[code]?.detail ?? undefined

/** Ficha do paciente — `null` quando ele ainda não respondeu (sem ficha ativa). */
export async function getPatientAnamnesis(patientId: string): Promise<Anamnesis | null> {
  const { data, error } = await supabase.rpc('patient_anamnesis', { p_patient: patientId })
  if (error) throw error
  const payload = (data ?? {}) as { record?: { updated_at?: string; answers?: AnswerMap } | null }
  const record = payload.record
  if (!record) return null
  const a = record.answers ?? {}

  return {
    clinicId: getCurrentClinicId(),
    patientId,
    updatedAt: isoToBrDate(record.updated_at) ?? '',
    // Saúde geral
    medications: (val(a, 'medications') as YesNo) ?? 'no',
    medicationsDetails: det(a, 'medications'),
    allergy: (val(a, 'allergy') as YesNoUnknown) ?? 'no',
    allergyDetails: det(a, 'allergy'),
    bloodPressure: (val(a, 'bloodPressure') as BloodPressure) ?? 'normal',
    heartCondition: (val(a, 'heartCondition') as YesNo) ?? 'no',
    heartConditionDetails: det(a, 'heartCondition'),
    shortnessOfBreath: (val(a, 'shortnessOfBreath') as YesNo) ?? 'no',
    diabetes: (val(a, 'diabetes') as YesNoUnknown) ?? 'no',
    bleeding: (val(a, 'bleeding') as BleedingLevel) ?? 'normal',
    healing: (val(a, 'healing') as HealingLevel) ?? 'normal',
    surgery: (val(a, 'surgery') as YesNo) ?? 'no',
    pregnant: (val(a, 'pregnant') as YesNoUnknown) ?? 'no',
    pregnancyWeeks: det(a, 'pregnant'),
    healthIssues: val(a, 'healthIssues'),
    chiefComplaint: val(a, 'chiefComplaint'),
    // Saúde bucal (só existe no template de odontologia — nos demais fica tudo undefined)
    anesthesiaReaction: val(a, 'anesthesiaReaction') as YesNo | undefined,
    anesthesiaReactionDetails: det(a, 'anesthesiaReaction'),
    lastTreatment: val(a, 'lastTreatment'),
    toothGumPain: val(a, 'toothGumPain') as YesNo | undefined,
    gumBleeding: val(a, 'gumBleeding') as GumBleeding | undefined,
    badTasteDryMouth: val(a, 'badTasteDryMouth') as YesNo | undefined,
    brushingsPerDay: val(a, 'brushingsPerDay'),
    flossing: val(a, 'flossing') as FlossUse | undefined,
    jawPainClicking: val(a, 'jawPainClicking') as YesNo | undefined,
    grindsTeeth: val(a, 'grindsTeeth') as YesNo | undefined,
    faceSores: val(a, 'faceSores') as YesNo | undefined,
    smokes: val(a, 'smokes') as YesNo | undefined,
    smokingAmount: det(a, 'smokes'),
    // Avaliação fisioterapêutica (só existe no template de fisioterapia)
    onsetDescription: val(a, 'onsetDescription'),
    painScale: val(a, 'painScale'),
    priorTreatment: val(a, 'priorTreatment') as YesNo | undefined,
    priorTreatmentDetails: det(a, 'priorTreatment'),
    physicalActivity: val(a, 'physicalActivity') as YesNo | undefined,
    physicalActivityDetails: det(a, 'physicalActivity'),
    affectedSide: val(a, 'affectedSide') as AffectedSide | undefined,
    dailyImpact: val(a, 'dailyImpact') as YesNo | undefined,
    dailyImpactDetails: det(a, 'dailyImpact'),
    redFlags: val(a, 'redFlags') as YesNo | undefined,
    redFlagsDetails: det(a, 'redFlags'),
  }
}

/** Campos editáveis: tudo menos a chave e a data (que é carimbada ao salvar). */
export type EditAnamnesis = Omit<ClientPayload<Anamnesis>, 'patientId' | 'updatedAt'>

// Perguntas com campo de detalhe (o {value, detail} da RPC); as demais vão como
// escalar. Perguntas de texto (healthIssues, chiefComplaint…) vão só com o valor.
type WithDetail = { value: string; detail: string | null }
const withDetail = (value: string, detail?: string): WithDetail => ({ value, detail: detail ?? null })

/** Saúde geral — núcleo comum a todo template (existe em qualquer especialidade). */
function coreAnswers(p: EditAnamnesis) {
  return {
    medications: withDetail(p.medications, p.medicationsDetails),
    allergy: withDetail(p.allergy, p.allergyDetails),
    bloodPressure: p.bloodPressure,
    heartCondition: withDetail(p.heartCondition, p.heartConditionDetails),
    shortnessOfBreath: p.shortnessOfBreath,
    diabetes: p.diabetes,
    bleeding: p.bleeding,
    healing: p.healing,
    surgery: p.surgery,
    pregnant: withDetail(p.pregnant, p.pregnancyWeeks),
    healthIssues: p.healthIssues ?? '',
    chiefComplaint: p.chiefComplaint ?? '',
  }
}

/** Cria ou atualiza (substitui) a ficha ATIVA do paciente via RPC transacional.
 *  `specialty` decide QUAIS códigos entram além do núcleo: a RPC save_anamnesis
 *  valida cada código contra o template ativo da clínica e rejeita o que não
 *  existir nele — mandar os campos do ramo errado quebraria o salvamento. */
export async function saveAnamnesis(patientId: string, p: EditAnamnesis, specialty?: ClinicSpecialty): Promise<void> {
  const answers: Record<string, unknown> = coreAnswers(p)

  if (specialty === 'physiotherapy') {
    Object.assign(answers, {
      onsetDescription: p.onsetDescription ?? '',
      painScale: p.painScale ?? '',
      priorTreatment: withDetail(p.priorTreatment ?? 'no', p.priorTreatmentDetails),
      physicalActivity: withDetail(p.physicalActivity ?? 'no', p.physicalActivityDetails),
      affectedSide: p.affectedSide ?? 'not_applicable',
      dailyImpact: withDetail(p.dailyImpact ?? 'no', p.dailyImpactDetails),
      redFlags: withDetail(p.redFlags ?? 'no', p.redFlagsDetails),
    })
  } else if (specialty === 'dentistry' || specialty === undefined) {
    // undefined (sessão ainda resolvendo) cai no ramo odontológico por ser o
    // template histórico do produto — só é alcançado num instante de boot raro.
    Object.assign(answers, {
      anesthesiaReaction: withDetail(p.anesthesiaReaction ?? 'no', p.anesthesiaReactionDetails),
      lastTreatment: p.lastTreatment ?? '',
      toothGumPain: p.toothGumPain ?? 'no',
      gumBleeding: p.gumBleeding ?? 'no',
      badTasteDryMouth: p.badTasteDryMouth ?? 'no',
      brushingsPerDay: p.brushingsPerDay ?? '',
      flossing: p.flossing ?? 'no',
      jawPainClicking: p.jawPainClicking ?? 'no',
      grindsTeeth: p.grindsTeeth ?? 'no',
      faceSores: p.faceSores ?? 'no',
      smokes: withDetail(p.smokes ?? 'no', p.smokingAmount),
    })
  }
  // Demais ramos (nutrição, psicologia, personal trainer): questionário nasce
  // vazio de propósito (ver seed_anamnesis_template) — só o núcleo é enviado.

  const { error } = await supabase.rpc('save_anamnesis', { p_patient: patientId, p_answers: answers as unknown as Json })
  if (error) throw error
}
