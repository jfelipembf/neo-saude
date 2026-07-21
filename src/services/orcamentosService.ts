import { MOCK_ORCAMENTOS } from '@/mocks/orcamentos'
import type { Quote } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// viram as tabelas `orcamentos` 1—N `orcamento_itens` (mesmas assinaturas).
export async function listOrcamentosDoPaciente(pacienteId: string): Promise<Quote[]> {
  return MOCK_ORCAMENTOS.filter(o => o.pacienteId === pacienteId)
}

/** Dados do editor "Criar orçamento". */
export type NewQuote = Omit<Quote, 'id'>

let proximoId = 100

export async function addOrcamento(dados: NewQuote): Promise<void> {
  MOCK_ORCAMENTOS.unshift({ id: `o${proximoId++}`, ...dados })
}

/** Aprova um orçamento aguardando (na lista). */
export async function aprovarOrcamento(id: string): Promise<void> {
  const orcamento = MOCK_ORCAMENTOS.find(o => o.id === id)
  if (orcamento) orcamento.status = 'aprovado'
}
