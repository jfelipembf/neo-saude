import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listSales } from '@/services/salesService'
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
