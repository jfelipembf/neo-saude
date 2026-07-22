import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addAgendaAppointment, listAgendaAppointments, updateAgendaAppointment } from '@/services/scheduleService'
import type { EditAgendaAppointment } from '@/services/scheduleService'

/** Consultas do intervalo visível (semana da grade / janela do calendário). */
export function useAgendaAppointments(fromIso: string, toIso: string) {
  return useQuery({
    queryKey: queryKeys.appointments.range(fromIso, toIso),
    queryFn: () => listAgendaAppointments(fromIso, toIso),
  })
}

// Invalidar `appointments.all` pega TODAS as leituras de consulta de uma vez:
// a grade (range), "Consultas de hoje" (byDay), o gráfico (series) e os cartões
// do Dashboard (stats) — agendar tem de refletir em todos, sem lista para
// alguém esquecer de manter.

/** Cria uma consulta datada (modal da Agenda). */
export function useCreateAgendaAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EditAgendaAppointment) => addAgendaAppointment(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all }),
  })
}

/** Edita uma consulta existente (clique no card da grade). */
export function useUpdateAgendaAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EditAgendaAppointment }) => updateAgendaAppointment(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all }),
  })
}
