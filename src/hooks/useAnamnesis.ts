import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getPatientAnamnesis, saveAnamnesis } from '@/services/anamnesisService'
import type { EditAnamnesis } from '@/services/anamnesisService'

export function usePatientAnamnesis(patientId: string) {
  return useQuery({
    queryKey: queryKeys.anamnesis.byPatient(patientId),
    queryFn: () => getPatientAnamnesis(patientId),
  })
}

/** Salva a ficha (cria ou atualiza) e recarrega a do paciente. */
export function useSaveAnamnesis(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EditAnamnesis) => saveAnamnesis(patientId, payload),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: queryKeys.anamnesis.byPatient(patientId),
    }),
  })
}
