import { MOCK_COMMISSIONS } from '@/mocks/commissions'
import type { ProfessionalCommission } from '@/types/domain'
import { CURRENT_CLINIC, type ClientPayload } from '@/lib/tenant'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// vira a tabela `commissions` (1 linha por profissional) com as MESMAS assinaturas.
export async function listCommissions(): Promise<ProfessionalCommission[]> {
  return MOCK_COMMISSIONS
}

/** Campos editáveis da regra de comissão (o id do profissional é a chave). */
export type EditCommission = Omit<ClientPayload<ProfessionalCommission>, 'professionalId'>

/** Cria ou atualiza a regra de comissão do profissional (upsert). */
export async function saveCommission(professionalId: string, payload: EditCommission): Promise<void> {
  const existing = MOCK_COMMISSIONS.find(c => c.professionalId === professionalId)
  if (existing) {
    Object.assign(existing, payload)
    return
  }
  MOCK_COMMISSIONS.push({ professionalId, clinicId: CURRENT_CLINIC, ...payload })
}
