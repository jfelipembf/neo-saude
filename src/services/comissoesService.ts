import { MOCK_COMISSOES } from '@/mocks/comissoes'
import type { ProfessionalCommission } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// vira a tabela `comissoes` (1 linha por profissional) com as MESMAS assinaturas.
export async function listComissoes(): Promise<ProfessionalCommission[]> {
  return MOCK_COMISSOES
}

/** Campos editáveis da regra de comissão (o id do profissional é a chave). */
export type EditCommission = Omit<ProfessionalCommission, 'profissionalId'>

/** Cria ou atualiza a regra de comissão do profissional (upsert). */
export async function saveComissao(profissionalId: string, dados: EditCommission): Promise<void> {
  const existente = MOCK_COMISSOES.find(c => c.profissionalId === profissionalId)
  if (existente) {
    Object.assign(existente, dados)
    return
  }
  MOCK_COMISSOES.push({ profissionalId, ...dados })
}
