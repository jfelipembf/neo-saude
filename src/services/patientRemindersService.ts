import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'

/**
 * Lembrete que o profissional deixa para o PRÓXIMO atendimento do paciente
 * ("usar outro material", "conferir a oclusão do 26").
 *
 * Tabela própria (public.patient_reminder) porque nada que existia servia:
 * `task` é o kanban da recepção e não tem paciente; `patient` não tem campo de
 * texto livre — e não deve ganhar um, é a tabela do expurgo LGPD; e
 * `appointment.notes` é da consulta, morre no remarcar e é invisível na tela
 * cheia, que só conhece o paciente.
 */
export interface PatientReminder {
  id: string
  texto: string
  done: boolean
  createdAt: string
}

type ReminderRow = { id: string; texto: string; done: boolean; created_at: string }

/** Só os ABERTOS — resolvido interessa em auditoria, não no atendimento. */
export async function listOpenReminders(patientId: string): Promise<PatientReminder[]> {
  const { data, error } = await supabase
    .from('patient_reminder')
    .select('id, texto, done, created_at')
    .eq('patient_id', patientId)
    .eq('done', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as ReminderRow[]).map(r => ({
    id: r.id, texto: r.texto, done: r.done, createdAt: r.created_at,
  }))
}

export async function addReminder(patientId: string, texto: string): Promise<void> {
  // `created_by`/`updated_by` NÃO vão aqui: estão fora dos grants de propósito
  // (o rastro não pode ser forjável) e são preenchidos por default/trigger.
  const { error } = await supabase.from('patient_reminder').insert({
    clinic_id: getCurrentClinicId(),
    patient_id: patientId,
    texto: texto.trim(),
  })
  if (error) throw error
}

/** Marca como resolvido — o lembrete some do atendimento, mas fica no histórico. */
export async function closeReminder(id: string): Promise<void> {
  const { error } = await supabase
    .from('patient_reminder')
    .update({ done: true, done_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
