import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { toIsoDate, isoToBrDate } from '@/utils/date'
import { MOCK_APPOINTMENTS } from '@/mocks/appointments'
import { buildAppointmentSeries } from '@/mocks/appointmentSeries'
import type { Appointment, AppointmentHistory, DashboardStats, ChartPeriod, SeriesPoint, AppointmentStatus } from '@/types/domain'

const hhmm = (t: string) => t.slice(0, 5)

type AppointmentRow = {
  id: string
  clinic_id: string
  patient_id: string
  professional_id: string
  service: string
  start_time: string
  status: AppointmentStatus
}

/** Consultas do DIA (lista "Consultas de hoje" do Dashboard e a agenda do dia). */
export async function listDayAppointments(): Promise<Appointment[]> {
  const today = toIsoDate(new Date())
  const { data, error } = await supabase
    .from('appointment')
    .select('id, clinic_id, patient_id, professional_id, service, start_time, status')
    .eq('clinic_id', getCurrentClinicId())
    .eq('date', today)
    .order('start_time')
  if (error) throw error
  return (data as AppointmentRow[]).map(row => ({
    id: row.id,
    clinicId: row.clinic_id,
    time: hhmm(row.start_time),
    patientId: row.patient_id,
    service: row.service,
    professionalId: row.professional_id,
    status: row.status,
  }))
}

/** Marca presença/falta/etc. do paciente na consulta. */
export async function setAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
  const { error } = await supabase.from('appointment').update({ status }).eq('id', id)
  if (error) throw error
}

type HistoryRow = {
  id: string
  clinic_id: string
  patient_id: string
  professional_id: string
  service: string
  date: string
  start_time: string
  duration_minutes: number | null
  procedures: string[]
  notes: string | null
}

/** Histórico de consultas do paciente (timeline do perfil), da mais recente à mais antiga. */
export async function listPatientHistory(patientId: string): Promise<AppointmentHistory[]> {
  const { data, error } = await supabase
    .from('appointment_history')
    .select('id, clinic_id, patient_id, professional_id, service, date, start_time, duration_minutes, procedures, notes')
    .eq('patient_id', patientId)
    .order('date', { ascending: false })
    .order('start_time', { ascending: false })
  if (error) throw error
  // NOTA: `materials` (UsedMaterial[]) vive na tabela filha appointment_history_material
  // e é carregada ao expandir o item — não entra nesta listagem (fica undefined).
  return (data as HistoryRow[]).map(row => ({
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    date: isoToBrDate(row.date) ?? '',
    time: hhmm(row.start_time),
    service: row.service,
    professionalId: row.professional_id,
    procedures: row.procedures ?? [],
    notes: row.notes ?? undefined,
    duration: row.duration_minutes != null ? `${row.duration_minutes} min` : undefined,
  }))
}

// TODO(neoSaúde): série do gráfico e stats do dashboard são AGREGAÇÕES sem RPC
// dedicada (e o faturamento cruza com o Financeiro). Seguem em modo mock até
// existir uma RPC de agregação (ex.: dashboard_stats/appointment_series).
export async function getAppointmentSeries(period: ChartPeriod, monthIso: string): Promise<SeriesPoint[]> {
  return buildAppointmentSeries(period, monthIso)
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const active = MOCK_APPOINTMENTS.filter(c => c.status !== 'canceled')
  return {
    appointmentsToday: active.length,
    activePatients: 132,
    pendingConfirmations: MOCK_APPOINTMENTS.filter(c => c.status === 'scheduled').length,
    monthlyRevenue: 'R$ 24.380',
  }
}
