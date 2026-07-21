import { MOCK_TRATAMENTOS } from '@/mocks/tratamentos'
import type { StatusDente, Tratamento } from '@/types/domain'

/** Dados do formulário de novo tratamento (modal do odontograma). */
export interface NovoTratamento {
  pacienteId: string
  dente: string          // notação FDI
  procedimento: string
  data: string           // dd/mm/aaaa
  status: StatusDente
  observacao?: string
}

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('tratamentos')… mantendo a MESMA assinatura —
// páginas e hooks não mudam.
export async function listTratamentosDoPaciente(pacienteId: string): Promise<Tratamento[]> {
  return MOCK_TRATAMENTOS.filter(t => t.pacienteId === pacienteId)
}

// Contador de id do mock — no Supabase o id virá do banco.
let proximoId = 100

/** Registra um tratamento feito num dente (entra no topo do histórico). */
export async function addTratamento(dados: NovoTratamento): Promise<void> {
  MOCK_TRATAMENTOS.unshift({ id: `t${proximoId++}`, ...dados })
}
