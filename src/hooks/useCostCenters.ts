import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  addCostCenter,
  deleteCostCenter,
  listCostCenters,
  setCostCenterStatus,
  updateCostCenter,
  type CostCenterInput,
} from '@/services/costCenterService'

/** Invalida só os centros de custo — renomear um não altera lançamento algum
 *  (o vínculo é por id), então derrubar o prefixo ['finance'] inteiro seria
 *  refetch caro para não mudar um pixel. Mesma decisão de useFinanceCategories. */
function invalidateCostCenters(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.finance.costCenters })
}

/** Centros de custo (ativos E inativos — ver o service). */
export function useCostCenters() {
  return useQuery({
    queryKey: queryKeys.finance.costCenters,
    queryFn: listCostCenters,
  })
}

export function useAddCostCenter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CostCenterInput) => addCostCenter(input),
    onSuccess: () => invalidateCostCenters(queryClient),
  })
}

export function useUpdateCostCenter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CostCenterInput }) => updateCostCenter(id, input),
    onSuccess: () => invalidateCostCenters(queryClient),
  })
}

export function useSetCostCenterStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      setCostCenterStatus(id, status),
    onSuccess: () => invalidateCostCenters(queryClient),
  })
}

export function useDeleteCostCenter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCostCenter(id),
    onSuccess: () => invalidateCostCenters(queryClient),
  })
}
