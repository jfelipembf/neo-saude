import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  addMedication, listPatientMedications, removeMedication, replaceMedication,
  suspendMedication, type NewMedication,
} from '@/services/medicationsService'

export function usePatientMedications(patientId: string | null) {
  return useQuery({
    queryKey: queryKeys.medications.byPatient(patientId ?? ''),
    queryFn: () => listPatientMedications(patientId ?? ''),
    enabled: Boolean(patientId),
  })
}

function useInvalidar() {
  const queryClient = useQueryClient()
  return (patientId: string) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.medications.byPatient(patientId) })
}

export function useAddMedication() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: (nova: NewMedication) => addMedication(nova),
    onSuccess: (_d, v) => invalidar(v.patientId),
  })
}

export function useSuspendMedication() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; patientId: string; motivo?: string }) =>
      suspendMedication(id, motivo),
    onSuccess: (_d, v) => invalidar(v.patientId),
  })
}

export function useReplaceMedication() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: (p: Parameters<typeof replaceMedication>[0]) => replaceMedication(p),
    onSuccess: (_d, v) => invalidar(v.patientId),
  })
}

export function useRemoveMedication() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ id }: { id: string; patientId: string }) => removeMedication(id),
    onSuccess: (_d, v) => invalidar(v.patientId),
  })
}
