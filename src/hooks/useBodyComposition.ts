import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  addBodyComposition, listBodyCompositions, removeBodyComposition,
} from '@/services/bodyCompositionService'
import type { NovaAvaliacaoFisica } from '@/services/bodyCompositionService'

export function useBodyCompositions(patientId: string) {
  return useQuery({
    queryKey: queryKeys.bodyCompositions.byPatient(patientId),
    queryFn: () => listBodyCompositions(patientId),
    enabled: Boolean(patientId),
  })
}

/**
 * Invalida também o PACIENTE: um gatilho do banco copia o peso e a altura da
 * leitura mais recente para o cadastro. Sem esta segunda invalidação o perfil
 * continuaria mostrando o peso antigo até alguém recarregar a página — que é
 * exatamente a divergência que o gatilho existe para não deixar acontecer.
 */
export function useAddBodyComposition(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (a: NovaAvaliacaoFisica) => addBodyComposition(a),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bodyCompositions.byPatient(patientId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all })
    },
  })
}

export function useRemoveBodyComposition(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeBodyComposition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bodyCompositions.byPatient(patientId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all })
    },
  })
}
