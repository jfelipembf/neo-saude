import { MOCK_LEMBRETES } from '@/mocks/lembretes'
import type { Lembrete } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('lembretes')… mantendo a MESMA assinatura —
// páginas e hooks não mudam.
export async function listLembretes(): Promise<Lembrete[]> {
  return [...MOCK_LEMBRETES]
}

/** Dados do formulário de novo lembrete (modal do card). */
export interface NovoLembrete {
  texto: string
  data?: string          // dd/mm
}

// Contador de id do mock — no Supabase o id virá do banco.
let proximoId = 100

/** Cria um lembrete (entra pendente, no topo da lista). */
export async function addLembrete(dados: NovoLembrete): Promise<void> {
  MOCK_LEMBRETES.unshift({ id: `l${proximoId++}`, concluido: false, ...dados })
}

/** Alterna concluído/pendente. */
export async function toggleLembrete(id: string): Promise<void> {
  const lembrete = MOCK_LEMBRETES.find(l => l.id === id)
  if (lembrete) lembrete.concluido = !lembrete.concluido
}

/** Remove um lembrete. */
export async function removeLembrete(id: string): Promise<void> {
  const indice = MOCK_LEMBRETES.findIndex(l => l.id === id)
  if (indice >= 0) MOCK_LEMBRETES.splice(indice, 1)
}
