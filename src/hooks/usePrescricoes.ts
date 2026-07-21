import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addPrescricao, listPrescricoesDoPaciente } from '@/services/prescricoesService'
import type { NewPrescription } from '@/services/prescricoesService'

export function usePrescricoesDoPaciente(pacienteId: string) {
  return useQuery({
    queryKey: queryKeys.prescricoes.byPaciente(pacienteId),
    queryFn: () => listPrescricoesDoPaciente(pacienteId),
  })
}

/** Emite uma prescrição/documento (modal "Nova prescrição") e atualiza a lista. */
export function useCriarPrescricao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: NewPrescription) => addPrescricao(dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.prescricoes.all }),
  })
}
