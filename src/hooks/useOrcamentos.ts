import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addOrcamento, aprovarOrcamento, listOrcamentosDoPaciente } from '@/services/orcamentosService'
import type { NewQuote } from '@/services/orcamentosService'

export function useOrcamentosDoPaciente(pacienteId: string) {
  return useQuery({
    queryKey: queryKeys.orcamentos.byPaciente(pacienteId),
    queryFn: () => listOrcamentosDoPaciente(pacienteId),
  })
}

export function useCriarOrcamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: NewQuote) => addOrcamento(dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.orcamentos.all }),
  })
}

/** Aprova um orçamento aguardando e atualiza a lista. */
export function useAprovarOrcamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => aprovarOrcamento(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.orcamentos.all }),
  })
}
