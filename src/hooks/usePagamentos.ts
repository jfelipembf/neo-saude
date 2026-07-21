import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listPagamentosDoPaciente, receberPagamento } from '@/services/pagamentosService'
import type { RecebimentoInput } from '@/services/pagamentosService'

export function usePagamentosDoPaciente(pacienteId: string) {
  return useQuery({
    queryKey: queryKeys.pagamentos.byPaciente(pacienteId),
    queryFn: () => listPagamentosDoPaciente(pacienteId),
  })
}

/** Registra o recebimento (modal "Realizar pagamento") e atualiza a lista. */
export function useReceberPagamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: RecebimentoInput }) => receberPagamento(id, dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pagamentos.all }),
  })
}
