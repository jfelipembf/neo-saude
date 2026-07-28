import { supabase } from '@/lib/supabase'
import { getCurrentClinicId, type ClientPayload } from '@/lib/tenant'
import type { ClientInsert, Insert } from '@/lib/db'
import { brToIsoDate, isoToBrDate, toIsoDate } from '@/utils/date'
import type { Prescription, PrescribedMedication } from '@/types/domain'

type PrescriptionRow = {
  id: string
  clinic_id: string
  code: string
  patient_id: string
  type: Prescription['type']
  title: string
  issued_on: string
  delivered_at: string | null
  professional_id: string | null
  body: string | null
  notes: string | null
}

type MedRow = { prescription_id: string; name: string; dosage: string; quantity: string | null }

export async function listPatientPrescriptions(patientId: string): Promise<Prescription[]> {
  const { data, error } = await supabase
    .from('prescription')
    .select('id, clinic_id, code, patient_id, type, title, issued_on, professional_id, body, notes, delivered_at')
    .eq('patient_id', patientId)
    .order('issued_on', { ascending: false })
  if (error) throw error
  const rows = data as PrescriptionRow[]
  if (rows.length === 0) return []

  // Medicamentos (só de receituário) das prescrições listadas, agrupados por id.
  const { data: meds, error: medError } = await supabase
    .from('prescription_medication')
    .select('prescription_id, name, dosage, quantity, sort_order')
    .in('prescription_id', rows.map(r => r.id))
    .order('sort_order')
  if (medError) throw medError
  const byPrescription = new Map<string, PrescribedMedication[]>()
  for (const m of (meds ?? []) as MedRow[]) {
    const list = byPrescription.get(m.prescription_id) ?? []
    list.push({ name: m.name, dosage: m.dosage, quantity: m.quantity ?? undefined })
    byPrescription.set(m.prescription_id, list)
  }

  return rows.map(row => ({
    id: row.id,
    clinicId: row.clinic_id,
    code: row.code,
    patientId: row.patient_id,
    type: row.type,
    title: row.title,
    date: isoToBrDate(row.issued_on) ?? '',
    professionalId: row.professional_id ?? undefined,
    medications: byPrescription.get(row.id),
    text: row.body ?? undefined,
    notes: row.notes ?? undefined,
    deliveredOn: isoToBrDate(row.delivered_at),
  }))
}

/** Dados do modal "Nova prescrição". */
export type NewPrescription = ClientPayload<Prescription>

// `prescription_type` NÃO é enviado: é a coluna discriminadora da FK composta
// (prescription_id, prescription_type)→prescription(id,type), com DEFAULT
// 'prescription' e CHECK. Como todo cadastro filho, o cliente não tem GRANT de
// coluna nela (nem em id/created_at) — mandá-la dá "permission denied for table".
// O default preenche, e a FK garante que só receituário aceita medicamento.

/**
 * Marca (ou desmarca) o resultado do exame como ENTREGUE.
 *
 * Existe separado do anexo porque as duas coisas acontecem em ordens
 * diferentes: o paciente traz o papel, o médico lê e devolve — resultado
 * entregue, arquivo nenhum. Derivar "entregue" da existência de anexo perderia
 * esse caso, que é o mais comum no consultório.
 */
export async function setPrescriptionDelivered(
  id: string, entregue: boolean,
): Promise<void> {
  const { data, error } = await supabase
    .from('prescription')
    .update({ delivered_at: entregue ? toIsoDate(new Date()) : null })
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Não foi possível atualizar a entrega.')
}

export async function addPrescription(payload: NewPrescription): Promise<void> {
  const clinicId = getCurrentClinicId()
  const row: ClientInsert<'prescription'> = {
    clinic_id: clinicId,
    patient_id: payload.patientId,
    type: payload.type,
    title: payload.title,
    issued_on: brToIsoDate(payload.date) ?? undefined,
    professional_id: payload.professionalId ?? null,
    body: payload.text ?? null,
    // `notes` estava faltando: o modal coletava "Observações", o GRANT permitia
    // gravar, e o insert simplesmente não mandava — o campo sumia em silêncio a
    // cada prescrição emitida.
    notes: payload.notes?.trim() || null,
  }
  const { data, error } = await supabase
    .from('prescription')
    .insert(row as Insert<'prescription'>)
    .select('id')
    .single()
  if (error) throw error

  // Medicamentos só existem no receituário (FK composta exige type='prescription').
  if (payload.type === 'prescription' && payload.medications?.length) {
    const meds = payload.medications.map((m, i) => ({
      clinic_id: clinicId,
      prescription_id: data.id,
      sort_order: i,
      name: m.name,
      dosage: m.dosage,
      quantity: m.quantity ?? null,
    }))
    const { error: medError } = await supabase.from('prescription_medication').insert(meds)
    if (medError) throw medError
  }
}

/** O que dá para corrigir num documento já emitido. */
export interface EditPrescription {
  title: string
  text?: string
  notes?: string
  /** dd/mm/aaaa */
  date?: string
}

/**
 * Corrige um documento emitido.
 *
 * NÃO troca paciente nem tipo: `patient_id` e `type` não têm GRANT de coluna, e
 * é de propósito — mudar o paciente de um atestado já impresso é falsificação,
 * não edição. O tipo ainda é a coluna discriminadora da FK com
 * prescription_medication (só receita aceita medicamento).
 */
export async function updatePrescription(id: string, payload: EditPrescription): Promise<void> {
  const { data, error } = await supabase
    .from('prescription')
    .update({
      title: payload.title,
      body: payload.text ?? null,
      notes: payload.notes?.trim() || null,
      ...(payload.date ? { issued_on: brToIsoDate(payload.date) ?? undefined } : {}),
    })
    .eq('id', id)
    .select('id')
  if (error) throw error
  // Zero linhas = a RLS recusou. Sem conferir, a tela diria "salvo" e o
  // documento continuaria como estava — mesmo bug silencioso da exclusão de
  // tratamento.
  if (!data?.length) throw new Error('Não foi possível alterar este documento.')
}

export async function removePrescription(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('prescription')
    .delete()
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Não foi possível excluir este documento.')
}
