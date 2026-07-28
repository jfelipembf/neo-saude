import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { checkoutSale, findSaleByAppointment, listSales } from '@/services/salesService'
import type { CheckoutSalePayload } from '@/services/salesService'
import type { DashboardRange } from '@/utils/period'

/** Vendas (recebíveis quitados) do período escolhido na aba Vendas do Financeiro.
 *  A janela [from, to] entra na key para que trocar de período refaça a busca;
 *  o prefixo ['finance','sales'] segue valendo p/ as invalidações do módulo.
 *  Mantém a lista anterior no ar durante a troca (sem piscar a tela). */
export function useSales(range: DashboardRange) {
  return useQuery({
    queryKey: [...queryKeys.finance.sales, range.from, range.to],
    queryFn: () => listSales(range),
    placeholderData: keepPreviousData,
  })
}

/** Fecha uma venda do PDV (checkout_sale). Invalida o prefixo 'finance'
 *  inteiro (novo recebível pendente) e os pacotes do paciente vendido. */
/**
 * A venda desta consulta, se já existir — é o que acende o selo "Pago" e trava
 * a segunda cobrança. `staleTime: 0` porque a pergunta é sobre o AGORA: a
 * recepção pode ter cobrado noutra aba com o modal aberto.
 */
export function useSaleByAppointment(appointmentId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.finance.sales, 'by-appointment', appointmentId ?? ''],
    queryFn: () => findSaleByAppointment(appointmentId ?? ''),
    enabled: Boolean(appointmentId),
    staleTime: 0,
  })
}

export function useCheckoutSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CheckoutSalePayload) => checkoutSale(payload),
    onSuccess: (_saleId, payload) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.entitlements.byPatient(payload.patientId) })
    },
  })
}
