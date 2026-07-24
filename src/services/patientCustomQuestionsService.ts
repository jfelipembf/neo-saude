import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { isoToBrDate } from '@/utils/date'
import type { PatientCustomQuestion } from '@/types/domain'

const COLUMNS = 'id, clinic_id, patient_id, question_text, answer_text, created_at, updated_at'

type Row = {
  id: string
  clinic_id: string
  patient_id: string
  question_text: string
  answer_text: string | null
  created_at: string
  updated_at: string
}

function toDomain(row: Row): PatientCustomQuestion {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    questionText: row.question_text,
    answerText: row.answer_text ?? undefined,
    createdAt: isoToBrDate(row.created_at) ?? '',
    updatedAt: isoToBrDate(row.updated_at) ?? '',
  }
}

/** Perguntas personalizadas do paciente — permanentes, independem da ficha ativa. */
export async function listPatientCustomQuestions(patientId: string): Promise<PatientCustomQuestion[]> {
  const { data, error } = await supabase
    .from('patient_custom_question')
    .select(COLUMNS)
    .eq('clinic_id', getCurrentClinicId())
    .eq('patient_id', patientId)
    .order('created_at')
  if (error) throw error
  return (data as Row[]).map(toDomain)
}

export async function addPatientCustomQuestion(
  patientId: string, questionText: string, answerText?: string,
): Promise<void> {
  const { error } = await supabase.from('patient_custom_question').insert({
    clinic_id: getCurrentClinicId(),
    patient_id: patientId,
    question_text: questionText,
    answer_text: answerText ?? null,
  })
  if (error) throw error
}

export async function updatePatientCustomQuestion(
  id: string, questionText: string, answerText?: string,
): Promise<void> {
  const { error } = await supabase
    .from('patient_custom_question')
    .update({ question_text: questionText, answer_text: answerText ?? null })
    .eq('id', id)
  if (error) throw error
}

export async function deletePatientCustomQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('patient_custom_question').delete().eq('id', id)
  if (error) throw error
}
