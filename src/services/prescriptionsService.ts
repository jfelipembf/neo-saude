import { MOCK_PRESCRIPTIONS } from '@/mocks/prescriptions'
import type { Prescription } from '@/types/domain'
import { CURRENT_CLINIC, nextCode, type ClientPayload } from '@/lib/tenant'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// vira a tabela `prescriptions` (medicamentos como jsonb) com as MESMAS assinaturas.
export async function listPatientPrescriptions(patientId: string): Promise<Prescription[]> {
  return MOCK_PRESCRIPTIONS.filter(p => p.patientId === patientId)
}

/** Dados do modal "Nova prescrição". */
export type NewPrescription = ClientPayload<Prescription>

let nextId = 100

export async function addPrescription(payload: NewPrescription): Promise<void> {
  MOCK_PRESCRIPTIONS.unshift({
    id: `pr${nextId++}`,
    clinicId: CURRENT_CLINIC,
    code: nextCode('REC', MOCK_PRESCRIPTIONS),
    ...payload,
  })
}
