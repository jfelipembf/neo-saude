import { supabase } from '@/lib/supabase'
import type { DashboardStats, ChartPeriod, SeriesPoint, AppointmentStatus, GoalMetric, MetricComparison } from '@/types/domain'
import type { DashboardRange } from '@/utils/period'

/** Marca presença/falta/etc. do paciente na consulta. */
export async function setAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
  const { error } = await supabase.from('appointment').update({ status }).eq('id', id)
  if (error) throw error
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
