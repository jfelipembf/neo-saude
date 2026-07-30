import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addOdontoProcedure, listOdontoProcedures, updateOdontoProcedure } from '@/services/odontoProceduresService'
import type { NewOdontoProcedure } from '@/services/odontoProceduresService'

export function useOdontoProcedures() {
  return useQuery({ queryKey: queryKeys.odontoProcedures.all, queryFn: listOdontoProcedures })
}

/** Cadastra um serviço (aba Serviços da odontologia) e atualiza a lista. */
export function useCreateOdontoProcedure() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NewOdontoProcedure) => addOdontoProcedure(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.odontoProcedures.all }),
  })
}

/** Salva a edição de um serviço e atualiza a lista. */
export function useUpdateOdontoProcedure() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: NewOdontoProcedure }) => updateOdontoProcedure(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.odontoProcedures.all }),
  })
}
