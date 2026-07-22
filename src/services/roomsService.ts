import { MOCK_ROOMS } from '@/mocks/rooms'
import type { Room } from '@/types/domain'
import { CURRENT_CLINIC } from '@/lib/tenant'

/** Dados do formulário de nova sala (id nasce aqui). */
export interface NewRoom {
  name: string
  photo?: string
}

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('rooms')… mantendo a MESMA assinatura —
// páginas e hooks não mudam.
export async function listRooms(): Promise<Room[]> {
  return MOCK_ROOMS
}

// Contador de id do mock — no Supabase o id virá do banco.
let nextId = 100

/** Cadastra uma sala nova. */
export async function addRoom(payload: NewRoom): Promise<void> {
  MOCK_ROOMS.push({ id: `s${nextId++}`, clinicId: CURRENT_CLINIC, ...payload })
}

/** Atualiza uma sala (mock: muta o registro em memória). */
export async function updateRoom(id: string, payload: NewRoom): Promise<void> {
  const room = MOCK_ROOMS.find(r => r.id === id)
  if (room) Object.assign(room, payload)
}
