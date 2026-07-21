import { MOCK_PRESCRICOES } from '@/mocks/prescricoes'
import type { Prescription } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// vira a tabela `prescricoes` (medicamentos como jsonb) com as MESMAS assinaturas.
export async function listPrescricoesDoPaciente(pacienteId: string): Promise<Prescription[]> {
  return MOCK_PRESCRICOES.filter(p => p.pacienteId === pacienteId)
}

/** Dados do modal "Nova prescrição". */
export type NewPrescription = Omit<Prescription, 'id'>

let proximoId = 100

export async function addPrescricao(dados: NewPrescription): Promise<void> {
  MOCK_PRESCRICOES.unshift({ id: `pr${proximoId++}`, ...dados })
}
