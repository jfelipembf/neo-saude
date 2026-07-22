import { supabase } from '@/lib/supabase'
import { getCurrentClinicId, type ClientPayload } from '@/lib/tenant'
import { isoToBrDate } from '@/utils/date'
import type {
  Anamnesis, YesNo, YesNoUnknown, BloodPressure, BleedingLevel, HealingLevel, GumBleeding, FlossUse,
} from '@/types/domain'

// A anamnese é um QUESTIONÁRIO DINÂMICO no banco (template → pergunta → resposta),
// mas os CÓDIGOS das perguntas do template padrão de odontologia batem 1:1 com os
// campos do tipo plano `Anamnesis` (medications, allergy, bloodPressure…). Então
// o de-para é direto: salvar via RPC save_anamnesis({codigo: resposta}) e carregar
// via patient_anamnesis (record.answers já vem achatado por código).

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
    // Saúde bucal
    chiefComplaint: val(a, 'chiefComplaint'),
    anesthesiaReaction: (val(a, 'anesthesiaReaction') as YesNo) ?? 'no',
    anesthesiaReactionDetails: det(a, 'anesthesiaReaction'),
    lastTreatment: val(a, 'lastTreatment'),
    toothGumPain: (val(a, 'toothGumPain') as YesNo) ?? 'no',
    gumBleeding: (val(a, 'gumBleeding') as GumBleeding) ?? 'no',
    badTasteDryMouth: (val(a, 'badTasteDryMouth') as YesNo) ?? 'no',
    brushingsPerDay: val(a, 'brushingsPerDay'),
    flossing: (val(a, 'flossing') as FlossUse) ?? 'no',
    jawPainClicking: (val(a, 'jawPainClicking') as YesNo) ?? 'no',
    grindsTeeth: (val(a, 'grindsTeeth') as YesNo) ?? 'no',
    faceSores: (val(a, 'faceSores') as YesNo) ?? 'no',
    smokes: (val(a, 'smokes') as YesNo) ?? 'no',
    smokingAmount: det(a, 'smokes'),
  }
}

/** Campos editáveis: tudo menos a chave e a data (que é carimbada ao salvar). */
export type EditAnamnesis = Omit<ClientPayload<Anamnesis>, 'patientId' | 'updatedAt'>

// Perguntas com campo de detalhe (o {value, detail} da RPC); as demais vão como
// escalar. Perguntas de texto (healthIssues, chiefComplaint…) vão só com o valor.
type WithDetail = { value: string; detail: string | null }
const withDetail = (value: string, detail?: string): WithDetail => ({ value, detail: detail ?? null })

/** Cria ou atualiza (substitui) a ficha ATIVA do paciente via RPC transacional. */
export async function saveAnamnesis(patientId: string, p: EditAnamnesis): Promise<void> {
  const answers = {
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
    anesthesiaReaction: withDetail(p.anesthesiaReaction, p.anesthesiaReactionDetails),
    lastTreatment: p.lastTreatment ?? '',
    toothGumPain: p.toothGumPain,
    gumBleeding: p.gumBleeding,
    badTasteDryMouth: p.badTasteDryMouth,
    brushingsPerDay: p.brushingsPerDay ?? '',
    flossing: p.flossing,
    jawPainClicking: p.jawPainClicking,
    grindsTeeth: p.grindsTeeth,
    faceSores: p.faceSores,
    smokes: withDetail(p.smokes, p.smokingAmount),
  }
  const { error } = await supabase.rpc('save_anamnesis', { p_patient: patientId, p_answers: answers })
  if (error) throw error
}
