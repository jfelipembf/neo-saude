import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addReminder, closeReminder, listOpenReminders } from '@/services/patientRemindersService'

/**
 * Lembretes abertos do paciente — carregados assim que ele é escolhido, para
 * aparecerem no começo do atendimento, que é quando servem.
 */
export function usePatientReminders(patientId: string | null) {
  return useQuery({
    queryKey: queryKeys.reminders.byPatient(patientId ?? ''),
    queryFn: () => listOpenReminders(patientId ?? ''),
    enabled: Boolean(patientId),
  })
}

export function useAddReminder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ patientId, texto }: { patientId: string; texto: string }) =>
      addReminder(patientId, texto),
    onSuccess: (_d, { patientId }) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.reminders.byPatient(patientId) }),
  })
}

export function useCloseReminder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; patientId: string }) => closeReminder(id),
    onSuccess: (_d, { patientId }) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.reminders.byPatient(patientId) }),
  })
}
