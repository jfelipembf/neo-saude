import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getDashboardStats, getAppointmentSeries, setAppointmentStatus } from '@/services/appointmentsService'
import type { ChartPeriod, AppointmentStatus } from '@/types/domain'
import type { DashboardRange } from '@/utils/period'

/** Série do gráfico por período/mês; mantém a série anterior no ar durante a troca. */
export function useAppointmentSeries(period: ChartPeriod, monthIso: string) {
  return useQuery({
    queryKey: queryKeys.appointments.series(period, monthIso),
    queryFn: () => getAppointmentSeries(period, monthIso),
    placeholderData: keepPreviousData,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
      // "Compareceu" é o que conta uma sessão do tratamento — e, quando fecha a
      // conta das sessões previstas, o banco ENCERRA o plano na mesma
      // transação. Sem este invalidate a tela seguiria mostrando o tratamento
      // como ativo até alguém recarregar.
      queryClient.invalidateQueries({ queryKey: queryKeys.carePlans.all })
    },
  })
}
