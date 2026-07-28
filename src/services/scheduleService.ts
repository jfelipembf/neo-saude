import { supabase } from '@/lib/supabase'
import { getCurrentClinicId, type ClientPayload } from '@/lib/tenant'
import type { Json } from '@/types/database.types'
import type { ScheduledAppointment, AppointmentStatus, SoapNote } from '@/types/domain'
import { addMinutes } from '@/utils/date'

// A Agenda trabalha com consultas DATADAS na tabela `appointment` — a mesma
// que o Dashboard conta em dashboard_stats() e que "Consultas de hoje" lista.
// (`schedule_slot` ficou reservada para regras recorrentes; a Agenda não a usa.)

const COLUMNS =
  'id, clinic_id, patient_id, professional_id, room_id, service, date, start_time, duration_minutes, status, notes, color, send_confirmation, is_overbook, entitlement_id, clinical_note, medical_record'

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
  is_overbook: boolean
  entitlement_id: string | null
  // O CHECK `appointment_clinical_note_shape_ck` já garante no BANCO que só
  // existem as quatro chaves do SOAP, cada uma string — por isso a linha entra
  // como SoapNote em vez de Json solto, sem validar de novo na leitura.
  clinical_note: SoapNote | null
  medical_record: string | null
}

// 'HH:MM:SS' (banco) → 'HH:MM' (domínio).
const hhmm = (t: string) => t.slice(0, 5)

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
export async function listScheduleAppointments(fromIso: string, toIso: string): Promise<ScheduledAppointment[]> {
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
    isOverbook: row.is_overbook,
    entitlementId: row.entitlement_id ?? undefined,
    clinicalNote: row.clinical_note ?? undefined,
  }))
}

/** Dados do modal de agendamento (criação e edição usam o mesmo shape). */
export type EditScheduledAppointment = ClientPayload<ScheduledAppointment>

export interface AppointmentConfirmationResult {
  ok: boolean
  status: 'sent' | 'pending' | 'skipped' | 'failed'
  reason?: string
  reused?: boolean
}

export interface CreatedScheduleAppointment {
  id: string
  confirmation: AppointmentConfirmationResult
}

async function toRow(clinicId: string, payload: EditScheduledAppointment) {
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
    send_confirmation: payload.sendConfirmation ?? true,
    is_overbook: payload.isOverbook ?? false,
  }
}

export async function sendAppointmentConfirmation(
  appointmentId: string,
  force = false,
): Promise<AppointmentConfirmationResult> {
  const { data, error } = await supabase.functions.invoke<AppointmentConfirmationResult>(
    'appointment-confirmation',
    {
      body: {
        clinicId: getCurrentClinicId(),
        appointmentId,
        force,
      },
    },
  )
  if (error) throw error
  if (!data) throw new Error('appointment_confirmation_failed')
  return data
}

export async function addScheduleAppointment(
  payload: EditScheduledAppointment,
): Promise<CreatedScheduleAppointment> {
  const clinicId = getCurrentClinicId()
  const { data, error } = await supabase
    .from('appointment')
    .insert({
      clinic_id: clinicId,
      // Só entra no INSERT: a coluna é imutável depois de criada (sem GRANT de
      // update nela — ver 20260724150000_sales_and_entitlements).
      entitlement_id: payload.entitlementId ?? null,
      ...(await toRow(clinicId, payload)),
    })
    .select('id')
    .single()
  if (error) throw error

  try {
    return {
      id: data.id,
      confirmation: await sendAppointmentConfirmation(data.id),
    }
  } catch {
    // A consulta já foi criada. Não a transforma em erro de agendamento, pois
    // uma tentativa do usuário duplicaria a consulta; a UI informa a falha.
    return {
      id: data.id,
      confirmation: {
        ok: false,
        status: 'failed',
        reason: 'confirmation_request_failed',
      },
    }
  }
}

export async function updateScheduleAppointment(id: string, payload: EditScheduledAppointment): Promise<void> {
  const clinicId = getCurrentClinicId()
  const { error } = await supabase.from('appointment').update(await toRow(clinicId, payload)).eq('id', id)
  if (error) throw error
}

/**
 * Prontuário SOAP da SESSÃO — salvo à parte do resto do agendamento (ver
 * AppointmentModal).
 *
 * `note` já chega normalizado (normalizeSoapNote): seção em branco não vira
 * chave e nota inteiramente vazia chega como `undefined`, que grava NULL. É o
 * que o CHECK do banco exige — ele recusa `'{}'` e seção `''` de propósito,
 * para não existirem dois jeitos de dizer "não escrevi nada".
 */
export async function updateClinicalNote(appointmentId: string, note: SoapNote | undefined): Promise<void> {
  const { error } = await supabase
    .from('appointment')
    .update({ clinical_note: (note ?? null) as Json })
    .eq('id', appointmentId)
  if (error) throw error
}
