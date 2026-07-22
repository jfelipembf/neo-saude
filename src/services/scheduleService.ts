import { supabase } from '@/lib/supabase'
import { getCurrentClinicId, type ClientPayload } from '@/lib/tenant'
import type { ScheduleSlot } from '@/types/domain'

const COLUMNS =
  'id, clinic_id, patient_id, professional_id, room_id, activity, weekday, start_time, end_time, color, status, notes, send_confirmation'

type SlotRow = {
  id: string
  clinic_id: string
  patient_id: string
  professional_id: string
  room_id: string | null
  activity: string
  weekday: number
  start_time: string
  end_time: string
  color: string | null
  status: ScheduleSlot['status']
  notes: string | null
  send_confirmation: boolean
}

// 'HH:MM:SS' (banco) → 'HH:MM' (domínio).
const hhmm = (t: string) => t.slice(0, 5)

/** Salas da clínica como mapa id→nome e nome→id (o domínio usa o NOME da sala). */
async function roomMaps(clinicId: string): Promise<{ byId: Map<string, string>; byName: Map<string, string> }> {
  const { data, error } = await supabase.from('room').select('id, name').eq('clinic_id', clinicId)
  if (error) throw error
  const byId = new Map<string, string>()
  const byName = new Map<string, string>()
  for (const r of data ?? []) {
    byId.set(r.id as string, r.name as string)
    byName.set(r.name as string, r.id as string)
  }
  return { byId, byName }
}

export async function listScheduleSlots(): Promise<ScheduleSlot[]> {
  const clinicId = getCurrentClinicId()
  const [{ byId }, { data, error }] = await Promise.all([
    roomMaps(clinicId),
    supabase.from('schedule_slot').select(COLUMNS).eq('clinic_id', clinicId),
  ])
  if (error) throw error
  return (data as SlotRow[]).map(row => ({
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    activity: row.activity,
    weekday: row.weekday,
    startTime: hhmm(row.start_time),
    endTime: hhmm(row.end_time),
    professionalId: row.professional_id,
    room: row.room_id ? byId.get(row.room_id) : undefined,
    color: row.color ?? undefined,
    status: row.status,
    notes: row.notes ?? undefined,
    sendConfirmation: row.send_confirmation,
  }))
}

/** Dados do modal de agendamento (criação e edição usam o mesmo shape). */
export type EditScheduleSlot = ClientPayload<ScheduleSlot>

async function toRow(clinicId: string, payload: EditScheduleSlot) {
  const { byName } = await roomMaps(clinicId)
  return {
    patient_id: payload.patientId,
    professional_id: payload.professionalId,
    room_id: payload.room ? (byName.get(payload.room) ?? null) : null,
    activity: payload.activity,
    weekday: payload.weekday,
    start_time: payload.startTime,
    end_time: payload.endTime,
    color: payload.color ?? null,
    status: payload.status,
    notes: payload.notes ?? null,
    send_confirmation: payload.sendConfirmation ?? false,
  }
}

export async function addScheduleSlot(payload: EditScheduleSlot): Promise<void> {
  const clinicId = getCurrentClinicId()
  const { error } = await supabase.from('schedule_slot').insert({ clinic_id: clinicId, ...(await toRow(clinicId, payload)) })
  if (error) throw error
}

export async function updateScheduleSlot(id: string, payload: EditScheduleSlot): Promise<void> {
  const clinicId = getCurrentClinicId()
  const { error } = await supabase.from('schedule_slot').update(await toRow(clinicId, payload)).eq('id', id)
  if (error) throw error
}
