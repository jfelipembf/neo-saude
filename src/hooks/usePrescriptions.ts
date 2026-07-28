import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  addPrescription, listPatientPrescriptions, removePrescription,
  setPrescriptionDelivered, updatePrescription,
} from '@/services/prescriptionsService'
import type { EditPrescription, NewPrescription } from '@/services/prescriptionsService'

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

export function useUpdatePrescription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EditPrescription }) =>
      updatePrescription(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.all }),
  })
}

export function useDeletePrescription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => removePrescription(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.all }),
  })
}

/** Marca/desmarca o resultado do exame como entregue. */
export function useSetPrescriptionDelivered() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, entregue }: { id: string; entregue: boolean }) =>
      setPrescriptionDelivered(id, entregue),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.all }),
  })
}
