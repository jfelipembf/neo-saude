import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  addScheduleAppointment,
  listScheduleAppointments,
  sendAppointmentConfirmation,
  updateScheduleAppointment,
  updateClinicalNote,
} from '@/services/scheduleService'
import type { EditScheduledAppointment } from '@/services/scheduleService'
import type { SoapNote } from '@/types/domain'

/** Consultas do intervalo visível (semana da grade / janela do calendário). */
export function useScheduleAppointments(fromIso: string, toIso: string) {
  return useQuery({
    queryKey: queryKeys.appointments.range(fromIso, toIso),
    queryFn: () => listScheduleAppointments(fromIso, toIso),
  })
}

// Invalidar `appointments.all` pega TODAS as leituras de consulta de uma vez:
// a grade (range), o gráfico (series) e os cartões do Dashboard (stats) —
// agendar tem de refletir em todos, sem lista para alguém esquecer de manter.

/** Cria uma consulta datada (modal da Agenda). */
export function useCreateScheduleAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EditScheduledAppointment) => addScheduleAppointment(payload),
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

/** Envia ou repete uma confirmação que ainda não tenha sido entregue. */
export function useSendAppointmentConfirmation() {
  return useMutation({
    mutationFn: (appointmentId: string) =>
      sendAppointmentConfirmation(appointmentId, true),
  })
}

/** Edita uma consulta existente (clique no card da grade). */
export function useUpdateScheduleAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EditScheduledAppointment }) => updateScheduleAppointment(id, payload),
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

/** Salva o prontuário SOAP da SESSÃO — ação própria, independente do resto do
 *  agendamento. `note` undefined apaga a evolução (coluna NULL). */
export function useUpdateClinicalNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ appointmentId, note }: { appointmentId: string; note: SoapNote | undefined; patientId: string }) =>
      updateClinicalNote(appointmentId, note),
    onSuccess: (_data, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.clinicalNotes.byPatient(patientId) })
    },
  })
}
