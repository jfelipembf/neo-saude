import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addTreatmentSession, addTreatment, listPatientTreatments } from '@/services/treatmentsService'
import type { NewTreatmentSession, NewTreatment } from '@/services/treatmentsService'

export function usePatientTreatments(patientId: string) {
  return useQuery({
    queryKey: queryKeys.treatments.byPatient(patientId),
    queryFn: () => listPatientTreatments(patientId),
    enabled: Boolean(patientId),
  })
}

/** Cria um tratamento novo (com a 1ª sessão) e atualiza o histórico. */
export function useCreateTreatment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NewTreatment) => addTreatment(payload),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.treatments.byPatient(variables.patientId) }),
  })
}

/** Adiciona uma sessão a um tratamento em aberto e atualiza o histórico. */
export function useAddTreatmentSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ treatmentId, slot: session }: { treatmentId: string; patientId: string; slot: NewTreatmentSession }) =>
      addTreatmentSession(treatmentId, session),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.treatments.byPatient(variables.patientId) }),
  })
}
