import { MOCK_SCHEDULE_SLOTS } from '@/mocks/scheduleSlots'
import type { ScheduleSlot } from '@/types/domain'
import { CURRENT_CLINIC, type ClientPayload } from '@/lib/tenant'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('schedule_slots')… mantendo a MESMA assinatura.
export async function listScheduleSlots(): Promise<ScheduleSlot[]> {
  return MOCK_SCHEDULE_SLOTS
}

/** Dados do modal de agendamento (criação e edição usam o mesmo shape). */
export type EditScheduleSlot = ClientPayload<ScheduleSlot>

let nextId = 100

export async function addScheduleSlot(payload: EditScheduleSlot): Promise<void> {
  MOCK_SCHEDULE_SLOTS.push({ id: `g${nextId++}`, clinicId: CURRENT_CLINIC, ...payload })
}

export async function updateScheduleSlot(id: string, payload: EditScheduleSlot): Promise<void> {
  const slot = MOCK_SCHEDULE_SLOTS.find(s => s.id === id)
  if (slot) Object.assign(slot, payload)
}
