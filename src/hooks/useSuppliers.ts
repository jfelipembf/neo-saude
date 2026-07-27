import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addSupplier, listSuppliers, updateSupplier } from '@/services/suppliersService'
import type { NewSupplier } from '@/services/suppliersService'

export function useSuppliers() {
  return useQuery({ queryKey: queryKeys.suppliers.all, queryFn: listSuppliers })
}

/** Cadastra um fornecedor (aba Fornecedores) e atualiza a lista. */
export function useCreateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NewSupplier) => addSupplier(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all }),
  })
}

/** Salva a edição de um fornecedor e atualiza a lista. */
export function useUpdateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: NewSupplier }) => updateSupplier(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all }),
  })
}
