import { MOCK_CONVENIOS } from '@/mocks/convenios'
import type { Insurance } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// vira a tabela `convenios` com as MESMAS assinaturas.
export async function listConvenios(): Promise<Insurance[]> {
  return MOCK_CONVENIOS
}

/** Campos editáveis do convênio. */
export type EditInsurance = Omit<Insurance, 'id'>

let proximoId = 100

export async function addConvenio(dados: EditInsurance): Promise<void> {
  MOCK_CONVENIOS.push({ id: `cv${proximoId++}`, ...dados })
}

export async function updateConvenio(id: string, dados: EditInsurance): Promise<void> {
  const convenio = MOCK_CONVENIOS.find(c => c.id === id)
  if (convenio) Object.assign(convenio, dados)
}
