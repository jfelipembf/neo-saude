import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addSessaoTratamento, addTratamento, listTratamentosDoPaciente } from '@/services/tratamentosService'
import type { NewTreatmentSession, NewTreatment } from '@/services/tratamentosService'

export function useTratamentosDoPaciente(pacienteId: string) {
  return useQuery({
    queryKey: queryKeys.tratamentos.byPaciente(pacienteId),
    queryFn: () => listTratamentosDoPaciente(pacienteId),
    enabled: Boolean(pacienteId),
  })
}

/** Cria um tratamento novo (com a 1ª sessão) e atualiza o histórico. */
export function useCriarTratamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: NewTreatment) => addTratamento(dados),
    onSuccess: (_dados, variaveis) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.tratamentos.byPaciente(variaveis.pacienteId) }),
  })
}

/** Adiciona uma sessão a um tratamento em aberto e atualiza o histórico. */
export function useAdicionarSessao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tratamentoId, sessao }: { tratamentoId: string; pacienteId: string; sessao: NewTreatmentSession }) =>
      addSessaoTratamento(tratamentoId, sessao),
    onSuccess: (_dados, variaveis) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.tratamentos.byPaciente(variaveis.pacienteId) }),
  })
}
