import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addPrescription, listPatientPrescriptions } from '@/services/prescriptionsService'
import type { NewPrescription } from '@/services/prescriptionsService'

export function usePatientPrescriptions(patientId: string) {
  return useQuery({
    queryKey: queryKeys.prescriptions.byPatient(patientId),
    queryFn: () => listPatientPrescriptions(patientId),
  })
}

/** Emite uma prescrição/documento (modal "Nova prescrição") e atualiza a lista. */
export function useCreatePrescription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NewPrescription) => addPrescription(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.all }),
  })
}
