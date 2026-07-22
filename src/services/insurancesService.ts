import { MOCK_INSURANCES } from '@/mocks/insurances'
import type { Insurance } from '@/types/domain'
import { CURRENT_CLINIC, type ClientPayload } from '@/lib/tenant'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// vira a tabela `insurances` com as MESMAS assinaturas.
export async function listInsurances(): Promise<Insurance[]> {
  return MOCK_INSURANCES
}

/** Campos editáveis do convênio. */
export type EditInsurance = ClientPayload<Insurance>

let nextId = 100

export async function addInsurance(payload: EditInsurance): Promise<void> {
  MOCK_INSURANCES.push({ id: `cv${nextId++}`, clinicId: CURRENT_CLINIC, ...payload })
}

export async function updateInsurance(id: string, payload: EditInsurance): Promise<void> {
  const insurance = MOCK_INSURANCES.find(c => c.id === id)
  if (insurance) Object.assign(insurance, payload)
}
