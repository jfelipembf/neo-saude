import { MOCK_APPOINTMENTS } from '@/mocks/appointments'
import { MOCK_APPOINTMENT_HISTORY } from '@/mocks/appointmentHistory'
import { buildAppointmentSeries } from '@/mocks/appointmentSeries'
import type { Appointment, AppointmentHistory, DashboardStats, ChartPeriod, SeriesPoint, AppointmentStatus } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('appointments')… mantendo a MESMA assinatura.
export async function listDayAppointments(): Promise<Appointment[]> {
  return MOCK_APPOINTMENTS
}

/** Marca presença/falta do paciente (mock: muta o array em memória). */
export async function setAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
  const appointment = MOCK_APPOINTMENTS.find(c => c.id === id)
  if (appointment) appointment.status = status
}

/**
 * Série do gráfico de consultas por período (semana → dias, mês → semanas,
 * ano → meses), relativa ao mês de referência ('aaaa-mm').
 */
export async function getAppointmentSeries(period: ChartPeriod, monthIso: string): Promise<SeriesPoint[]> {
  return buildAppointmentSeries(period, monthIso)
}

/** Histórico de consultas do paciente (timeline do perfil), da mais recente à mais antiga. */
export async function listPatientHistory(patientId: string): Promise<AppointmentHistory[]> {
  return MOCK_APPOINTMENT_HISTORY.filter(c => c.patientId === patientId)
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
