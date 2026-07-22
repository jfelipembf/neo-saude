import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { brToIsoDate, isoToBrDate } from '@/utils/date'
import type { Json } from '@/types/database.types'
import type { UsedMaterial, ToothStatus, Treatment, TreatmentSession } from '@/types/domain'

/**
 * O tratamento nasce VAZIO (sem odontograma) e recebe PROCEDIMENTOS (sessões)
 * ao longo dos dias — cada procedimento traz descrição, data, o que foi
 * sinalizado no odontograma e os dentes envolvidos.
 */
export interface NewTreatment {
  patientId: string
  procedure: string   // descrição do tratamento
  date: string           // dd/mm/aaaa (início)
}

/** Dados de UM procedimento registrado pelo editor com odontograma. */
export interface NewTreatmentSession {
  description?: string     // nome do procedimento
  date: string           // dd/mm/aaaa
  actions: string[]
  teeth?: string[]      // dentes sinalizados (mesclados no tratamento)
  materials?: UsedMaterial[]
  notes?: string
  amount?: number
  odontogram?: Record<string, unknown>
  statusAfter: ToothStatus
}

// Formato devolvido pela RPC patient_treatments (snake_case).
type SessionJson = {
  id: string
  description: string | null
  performed_on: string
  professional_id: string | null
  amount: number | null
  notes: string | null
  teeth: string[]
  actions: string[]
  materials: { material_id: string | null; name: string; quantity: string }[]
  odontogram: Record<string, unknown> | null
}
type TreatmentJson = {
  id: string
  clinic_id: string
  patient_id: string
  procedure: string
  status: ToothStatus
  started_at: string
  completed_at: string | null
  notes: string | null
  teeth: string[]
  sessions: SessionJson[]
}

function toSession(s: SessionJson): TreatmentSession {
  return {
    id: s.id,
    description: s.description ?? undefined,
    date: isoToBrDate(s.performed_on) ?? '',
    professionalId: s.professional_id ?? undefined,
    teeth: s.teeth ?? [],
    actions: s.actions ?? [],
    materials: (s.materials ?? []).map(m => ({ name: m.name, quantity: m.quantity })),
    notes: s.notes ?? undefined,
    amount: s.amount != null ? Number(s.amount) : undefined,
    odontogram: s.odontogram ?? undefined,
  }
}

function toTreatment(t: TreatmentJson): Treatment {
  return {
    id: t.id,
    clinicId: t.clinic_id,
    patientId: t.patient_id,
    tooth: t.teeth?.length ? t.teeth.join(', ') : undefined,
    procedure: t.procedure,
    status: t.status,
    startedAt: isoToBrDate(t.started_at) ?? '',
    completedAt: isoToBrDate(t.completed_at),
    notes: t.notes ?? undefined,
    sessions: (t.sessions ?? []).map(toSession),
  }
}

export async function listPatientTreatments(patientId: string): Promise<Treatment[]> {
  const { data, error } = await supabase.rpc('patient_treatments', { p_patient: patientId })
  if (error) throw error
  return ((data ?? []) as unknown as TreatmentJson[]).map(toTreatment)
}

/** Cria o tratamento (guarda-chuva) vazio — os procedimentos vêm depois. */
export async function addTreatment(payload: NewTreatment): Promise<void> {
  const { error } = await supabase.from('treatment').insert({
    clinic_id: getCurrentClinicId(),
    patient_id: payload.patientId,
    procedure: payload.procedure,
    status: 'open',
    started_at: brToIsoDate(payload.date) ?? undefined,
  })
  if (error) throw error
}

/**
 * Adiciona um procedimento ao tratamento via RPC transacional
 * `record_treatment_session` (grava sessão + dentes + etapas + materiais +
 * odontograma e atualiza o status do tratamento, tudo numa transação).
 */
export async function addTreatmentSession(treatmentId: string, session: NewTreatmentSession): Promise<void> {
  const performedOn = brToIsoDate(session.date)
  if (!performedOn) throw new Error('Data do procedimento inválida.')
  const { error } = await supabase.rpc('record_treatment_session', {
    p_treatment: treatmentId,
    p_performed_on: performedOn,
    p_status_after: session.statusAfter,
    p_description: session.description ?? undefined,
    p_amount: session.amount ?? undefined,
    p_notes: session.notes ?? undefined,
    p_teeth: session.teeth ?? [],
    p_actions: session.actions,
    p_materials: (session.materials ?? []).map(m => ({ material_id: null, name: m.name, quantity: m.quantity })) as unknown as Json,
    p_odontogram: (session.odontogram ?? undefined) as unknown as Json | undefined,
  })
  if (error) throw error
}
