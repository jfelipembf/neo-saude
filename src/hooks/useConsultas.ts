import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listConsultasDoDia, listHistoricoDoPaciente, getDashboardStats, getSerieConsultas, setStatusConsulta } from '@/services/consultasService'
import type { PeriodoGrafico, StatusConsulta } from '@/types/domain'

export function useConsultasDoDia() {
  return useQuery({ queryKey: queryKeys.consultas.all, queryFn: listConsultasDoDia })
}

/** Série do gráfico por período/mês; mantém a série anterior no ar durante a troca. */
export function useSerieConsultas(periodo: PeriodoGrafico, mesIso: string) {
  return useQuery({
    queryKey: queryKeys.consultas.serie(periodo, mesIso),
    queryFn: () => getSerieConsultas(periodo, mesIso),
    placeholderData: keepPreviousData,
  })
}

/** Histórico de consultas do paciente (timeline do perfil). */
export function useHistoricoConsultas(pacienteId: string) {
  return useQuery({
    queryKey: queryKeys.consultas.historico(pacienteId),
    queryFn: () => listHistoricoDoPaciente(pacienteId),
  })
}

export function useDashboardStats() {
  return useQuery({ queryKey: [...queryKeys.consultas.all, 'stats'], queryFn: getDashboardStats })
}

/** Muda o status de uma consulta (presença/falta) e atualiza as listas. */
export function useSetStatusConsulta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusConsulta }) => setStatusConsulta(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.consultas.all }),
  })
}
