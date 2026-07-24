import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  addAgendaAppointment,
  listAgendaAppointments,
  updateAgendaAppointment,
  updateClinicalNote,
} from '@/services/scheduleService'
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
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
      // Agendada num pacote: tg_debit_entitlement já reservou a sessão no
      // banco (scheduled_sessions) — sem isto, o saldo (card do modal, bloco
      // "Pacotes" do perfil) ficava mostrando o número de ANTES de agendar.
      if (payload.entitlementId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.entitlements.byPatient(payload.patientId) })
      }
    },
  })
}

/** Edita uma consulta existente (clique no card da grade). */
export function useUpdateAgendaAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EditAgendaAppointment }) => updateAgendaAppointment(id, payload),
    onSuccess: (_data, { payload }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
      // Mudar a situação (compareceu/faltou/cancelar) desloca sessão entre
      // reservada/usada/devolvida — mesmo motivo do invalidate acima.
      if (payload.entitlementId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.entitlements.byPatient(payload.patientId) })
      }
    },
  })
}

/** Salva o prontuário da SESSÃO — ação própria, independente do resto do agendamento. */
export function useUpdateClinicalNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ appointmentId, html }: { appointmentId: string; html: string; patientId: string }) =>
      updateClinicalNote(appointmentId, html),
    onSuccess: (_data, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
      queryClient.invalidateQueries({ queryKey: ['clinicalNotes', patientId] })
    },
  })
}
