import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addTratamento, listTratamentosDoPaciente } from '@/services/tratamentosService'
import type { NovoTratamento } from '@/services/tratamentosService'

export function useTratamentosDoPaciente(pacienteId: string) {
  return useQuery({
    queryKey: queryKeys.tratamentos.byPaciente(pacienteId),
    queryFn: () => listTratamentosDoPaciente(pacienteId),
    enabled: Boolean(pacienteId),
  })
}

/** Registra um tratamento no dente (modal do odontograma) e atualiza o histórico. */
export function useCriarTratamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: NovoTratamento) => addTratamento(dados),
    onSuccess: (_dados, variaveis) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.tratamentos.byPaciente(variaveis.pacienteId) }),
  })
}
