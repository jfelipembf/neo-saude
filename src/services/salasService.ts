import { MOCK_SALAS } from '@/mocks/salas'
import type { Sala } from '@/types/domain'

/** Dados do formulário de nova sala (id nasce aqui). */
export interface NovaSala {
  nome: string
  foto?: string
}

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('salas')… mantendo a MESMA assinatura —
// páginas e hooks não mudam.
export async function listSalas(): Promise<Sala[]> {
  return MOCK_SALAS
}

// Contador de id do mock — no Supabase o id virá do banco.
let proximoId = 100

/** Cadastra uma sala nova. */
export async function addSala(dados: NovaSala): Promise<void> {
  MOCK_SALAS.push({ id: `s${proximoId++}`, ...dados })
}

/** Atualiza uma sala (mock: muta o registro em memória). */
export async function updateSala(id: string, dados: NovaSala): Promise<void> {
  const sala = MOCK_SALAS.find(s => s.id === id)
  if (sala) Object.assign(sala, dados)
}
