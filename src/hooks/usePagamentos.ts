import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listPagamentos, listPagamentosDoPaciente, receberPagamento } from '@/services/pagamentosService'
import type { ReceivePaymentInput } from '@/services/pagamentosService'

export function usePagamentosDoPaciente(pacienteId: string) {
  return useQuery({
    queryKey: queryKeys.pagamentos.byPaciente(pacienteId),
    queryFn: () => listPagamentosDoPaciente(pacienteId),
  })
}

export function usePagamentos() {
  return useQuery({ queryKey: queryKeys.pagamentos.all, queryFn: listPagamentos })
}

/** Registra o recebimento (modal "Realizar pagamento") e atualiza a lista. */
export function useReceberPagamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: ReceivePaymentInput }) => receberPagamento(id, dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pagamentos.all }),
  })
}
