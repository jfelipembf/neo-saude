import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { toIsoDate, isoToBrDate } from '@/utils/date'
import type { Appointment, AppointmentHistory, DashboardStats, ChartPeriod, SeriesPoint, AppointmentStatus, GoalMetric, MetricComparison } from '@/types/domain'
import type { DashboardRange } from '@/utils/period'

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

/** Série do gráfico de consultas por período (RPC appointment_series). */
export async function getAppointmentSeries(period: ChartPeriod, monthIso: string): Promise<SeriesPoint[]> {
  const { data, error } = await supabase.rpc('appointment_series', { p_period: period, p_month_iso: monthIso })
  if (error) throw error
  return (data ?? []).map(r => ({ label: r.label, value: Number(r.value) }))
}

/** Trio cru de uma métrica, como a RPC devolve (numeric chega como number). */
type MetricRow = { current: number; previous: number | null; target: number | null }

type DashboardStatsRow = {
  metrics: Record<GoalMetric, MetricRow>
}

/**
 * `null` TEM de sobreviver à conversão: `Number(null)` é 0, e 0 é um valor
 * legítimo e diferente ("o mês passado foi zerado" ≠ "não existe mês passado
 * para comparar"). Por isso o null passa reto em vez de virar número.
 */
const toMetric = (m: MetricRow): MetricComparison => ({
  current:  Number(m.current),
  previous: m.previous == null ? null : Number(m.previous),
  target:   m.target   == null ? null : Number(m.target),
})

/** Os números do topo do Dashboard para um PERÍODO (RPC dashboard_stats_period),
 *  em uma chamada. As janelas (atual e anterior) vêm prontas de `dashboardRange`. */
export async function getDashboardStats(range: DashboardRange): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc('dashboard_stats_period', {
    p_from: range.from, p_to: range.to, p_prev_from: range.prevFrom, p_prev_to: range.prevTo,
  })
  if (error) throw error
  const s = data as unknown as DashboardStatsRow
  return {
    // `metrics` é TUDO que a RPC devolve hoje. Os contadores de topo que vinham
    // ao lado (appointments_today, active_patients, pending_confirmations,
    // monthly_revenue) foram podados do banco quando os cartões operacionais
    // saíram do Dashboard — não há mais o que converter aqui.
    metrics: {
      appointments_scheduled: toMetric(s.metrics.appointments_scheduled),
      appointments_completed: toMetric(s.metrics.appointments_completed),
      revenue:                toMetric(s.metrics.revenue),
      expenses:               toMetric(s.metrics.expenses),
    },
  }
}
