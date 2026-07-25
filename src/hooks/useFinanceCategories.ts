import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  addFinanceCategory,
  deleteFinanceCategories,
  listFinanceCategories,
  renameFinanceCategory,
  setFinanceCategoryStatus,
  type NewFinanceCategory,
} from '@/services/financeCategoryService'

/**
 * Invalida SÓ o plano de contas, e não o prefixo ['finance'] inteiro como as
 * mutations de dinheiro fazem.
 *
 * O motivo é o rótulo congelado: renomear "Marketing" não altera nenhum
 * lançamento já feito (o título guarda o texto do dia em que nasceu), então
 * fluxo de caixa, contas a pagar e gráficos continuam válidos. Derrubar o
 * módulo todo aqui seria refetch caro para não mudar um pixel.
 */
function invalidateCategories(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.finance.categories })
}

/** Plano de contas em árvore (ativas E inativas — ver o service). */
export function useFinanceCategories() {
  return useQuery({
    queryKey: queryKeys.finance.categories,
    queryFn: listFinanceCategories,
  })
}

export function useAddFinanceCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewFinanceCategory) => addFinanceCategory(input),
    onSuccess: () => invalidateCategories(queryClient),
  })
}

export function useRenameFinanceCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameFinanceCategory(id, name),
    onSuccess: () => invalidateCategories(queryClient),
  })
}

/** Aceita uma ou várias — a tela tem seleção em massa. */
export function useSetFinanceCategoryStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: 'active' | 'inactive' }) =>
      setFinanceCategoryStatus(ids, status),
    onSuccess: () => invalidateCategories(queryClient),
  })
}

/** Devolve quantas saíram e quantas o banco recusou — ver DeleteOutcome. */
export function useDeleteFinanceCategories() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => deleteFinanceCategories(ids),
    onSuccess: () => invalidateCategories(queryClient),
  })
}
