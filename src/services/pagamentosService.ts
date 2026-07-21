import { MOCK_PAGAMENTOS } from '@/mocks/pagamentos'
import type { Pagamento, TipoPagamento } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('pagamentos')… mantendo a MESMA assinatura.
export async function listPagamentosDoPaciente(pacienteId: string): Promise<Pagamento[]> {
  return MOCK_PAGAMENTOS.filter(p => p.pacienteId === pacienteId)
}

/** Dados do modal "Realizar pagamento" (campos de cartão só p/ crédito/débito). */
export interface RecebimentoInput {
  tipo: TipoPagamento
  valor: number
  data: string           // dd/mm/aaaa
  bandeira?: string
  autorizacao?: string
  nsu?: string
  parcelas?: number      // só crédito
}

/** Registra um recebimento; o pagamento quita quando a soma das formas cobre o total. */
export async function receberPagamento(id: string, dados: RecebimentoInput): Promise<void> {
  const pagamento = MOCK_PAGAMENTOS.find(p => p.id === id)
  if (!pagamento) return
  pagamento.formas.push({ ...dados })
  const recebido = pagamento.formas.reduce((soma, f) => soma + f.valor, 0)
  if (recebido >= pagamento.valor) pagamento.status = 'pago'
}
