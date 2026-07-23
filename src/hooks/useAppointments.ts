import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listDayAppointments, listPatientHistory, getDashboardStats, getAppointmentSeries, setAppointmentStatus } from '@/services/appointmentsService'
import type { ChartPeriod, AppointmentStatus } from '@/types/domain'
import type { DashboardRange } from '@/utils/period'

export function useDayAppointments() {
  return useQuery({ queryKey: queryKeys.appointments.all, queryFn: listDayAppointments })
}

/** Série do gráfico por período/mês; mantém a série anterior no ar durante a troca. */
export function useAppointmentSeries(period: ChartPeriod, monthIso: string) {
  return useQuery({
    queryKey: queryKeys.appointments.series(period, monthIso),
    queryFn: () => getAppointmentSeries(period, monthIso),
    placeholderData: keepPreviousData,
  })
}

/** Histórico de consultas do paciente (timeline do perfil). */
export function useAppointmentHistory(patientId: string) {
  return useQuery({
    queryKey: queryKeys.appointments.history(patientId),
    queryFn: () => listPatientHistory(patientId),
  })
}

export function useDashboardStats(range: DashboardRange) {
  return useQuery({
    // A janela entra na key: trocar o período refaz a busca. O prefixo
    // ['appointments','stats'] segue valendo p/ as invalidações do módulo.
    queryKey: [...queryKeys.appointments.stats, range.from, range.to],
    queryFn: () => getDashboardStats(range),
  })
}

/** Muda o status de uma consulta (presença/falta) e atualiza as listas. */
export function useSetAppointmentStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) => setAppointmentStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all }),
  })
}
