import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addVitalSign, listVitalSigns, removeVitalSign } from '@/services/vitalSignsService'
import type { NovoVitalSign } from '@/services/vitalSignsService'

export function useVitalSigns(patientId: string) {
  return useQuery({
    queryKey: queryKeys.vitalSigns.byPatient(patientId),
    queryFn: () => listVitalSigns(patientId),
    enabled: Boolean(patientId),
  })
}

export function useAddVitalSign(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (v: NovoVitalSign) => addVitalSign(v),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: queryKeys.vitalSigns.byPatient(patientId),
    }),
  })
}

export function useRemoveVitalSign(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeVitalSign,
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: queryKeys.vitalSigns.byPatient(patientId),
    }),
  })
}
