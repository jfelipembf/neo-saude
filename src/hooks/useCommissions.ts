import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listCommissions, saveCommission } from '@/services/commissionsService'
import type { EditCommission } from '@/services/commissionsService'

export function useCommissions() {
  return useQuery({ queryKey: queryKeys.commissions.all, queryFn: listCommissions })
}

/** Salva (upsert) a regra de comissão de um profissional e atualiza a lista. */
export function useSaveCommission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ professionalId, payload }: { professionalId: string; payload: EditCommission }) =>
      saveCommission(professionalId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.commissions.all }),
  })
}
