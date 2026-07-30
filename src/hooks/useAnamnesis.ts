import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useSession } from '@/context/SessionProvider'
import { archivePreviousAnamnesis, getPatientAnamnesis, saveAnamnesis } from '@/services/anamnesisService'
import type { EditAnamnesis } from '@/services/anamnesisService'

export function usePatientAnamnesis(patientId: string) {
  return useQuery({
    queryKey: queryKeys.anamnesis.byPatient(patientId),
    queryFn: () => getPatientAnamnesis(patientId),
  })
}

/** Salva a ficha (cria ou atualiza) e recarrega a do paciente. O ramo da clínica
 *  decide quais perguntas o payload leva (ver saveAnamnesis). */
export function useSaveAnamnesis(patientId: string) {
  const queryClient = useQueryClient()
  const { specialty } = useSession()
  return useMutation({
    mutationFn: (payload: EditAnamnesis) => saveAnamnesis(patientId, payload, specialty),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: queryKeys.anamnesis.byPatient(patientId),
    }),
  })
}

/** Fecha a ficha ativa do paciente — o passo que faz um tratamento novo
 *  começar com anamnese em branco (ver archivePreviousAnamnesis). */
export function useArchivePreviousAnamnesis(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => archivePreviousAnamnesis(patientId),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: queryKeys.anamnesis.byPatient(patientId),
    }),
  })
}
