import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listRoles, saveRole } from '@/services/rolesService'
import type { EditRole } from '@/services/rolesService'

export function useRoles() {
  return useQuery({ queryKey: queryKeys.roles.all, queryFn: listRoles })
}

/** Salva um cargo (id null = novo) e atualiza a lista. */
export function useSaveRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | null; payload: EditRole }) => saveRole(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.roles.all }),
  })
}
