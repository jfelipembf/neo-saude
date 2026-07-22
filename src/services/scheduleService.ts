import { supabase } from '@/lib/supabase'
import { getCurrentClinicId, type ClientPayload } from '@/lib/tenant'
import type { AgendaAppointment, AppointmentStatus } from '@/types/domain'

// A Agenda trabalha com consultas DATADAS na tabela `appointment` — a mesma
// que o Dashboard conta em dashboard_stats() e que "Consultas de hoje" lista.
// (`schedule_slot` ficou reservada para regras recorrentes; a Agenda não a usa.)

const COLUMNS =
  'id, clinic_id, patient_id, professional_id, room_id, service, date, start_time, duration_minutes, status, notes, color, send_confirmation'

type AppointmentRow = {
  id: string
  clinic_id: string
  patient_id: string
  professional_id: string
  room_id: string | null
  service: string
  date: string
  start_time: string
  duration_minutes: number
  status: AppointmentStatus
  notes: string | null
  color: string | null
  send_confirmation: boolean
}

// 'HH:MM:SS' (banco) → 'HH:MM' (domínio).
const hhmm = (t: string) => t.slice(0, 5)

/** '07:30' + 30min → '08:00' (fim exibido nos cards). */
function addMinutes(start: string, minutes: number) {
  const [h, m] = start.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** Duração (min) entre '07:30' e '08:00' — o banco guarda duração, não o fim. */
function minutesBetween(start: string, end: string) {
  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)
  return Math.max(5, endH * 60 + endM - (startH * 60 + startM))
}

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

/** Consultas do intervalo [fromIso, toIso] (a semana visível da grade). */
export async function listAgendaAppointments(fromIso: string, toIso: string): Promise<AgendaAppointment[]> {
  const clinicId = getCurrentClinicId()
  const [{ byId }, { data, error }] = await Promise.all([
    roomMaps(clinicId),
    supabase
      .from('appointment')
      .select(COLUMNS)
      .eq('clinic_id', clinicId)
      .gte('date', fromIso)
      .lte('date', toIso)
      .order('date')
      .order('start_time'),
  ])
  if (error) throw error
  return (data as AppointmentRow[]).map(row => ({
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    activity: row.service,
    date: row.date,
    startTime: hhmm(row.start_time),
    endTime: addMinutes(hhmm(row.start_time), row.duration_minutes),
    professionalId: row.professional_id,
    room: row.room_id ? byId.get(row.room_id) : undefined,
    color: row.color ?? undefined,
    status: row.status,
    notes: row.notes ?? undefined,
    sendConfirmation: row.send_confirmation,
  }))
}

/** Dados do modal de agendamento (criação e edição usam o mesmo shape). */
export type EditAgendaAppointment = ClientPayload<AgendaAppointment>

async function toRow(clinicId: string, payload: EditAgendaAppointment) {
  const { byName } = await roomMaps(clinicId)
  return {
    patient_id: payload.patientId,
    professional_id: payload.professionalId,
    room_id: payload.room ? (byName.get(payload.room) ?? null) : null,
    service: payload.activity,
    date: payload.date,
    start_time: payload.startTime,
    duration_minutes: minutesBetween(payload.startTime, payload.endTime),
    status: payload.status,
    notes: payload.notes ?? null,
    color: payload.color ?? null,
    send_confirmation: payload.sendConfirmation ?? false,
  }
}

export async function addAgendaAppointment(payload: EditAgendaAppointment): Promise<void> {
  const clinicId = getCurrentClinicId()
  const { error } = await supabase.from('appointment').insert({ clinic_id: clinicId, ...(await toRow(clinicId, payload)) })
  if (error) throw error
}

export async function updateAgendaAppointment(id: string, payload: EditAgendaAppointment): Promise<void> {
  const clinicId = getCurrentClinicId()
  const { error } = await supabase.from('appointment').update(await toRow(clinicId, payload)).eq('id', id)
  if (error) throw error
}
