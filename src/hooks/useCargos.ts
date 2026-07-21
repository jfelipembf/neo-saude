import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listCargos, saveCargo } from '@/services/cargosService'
import type { EditRole } from '@/services/cargosService'

export function useCargos() {
  return useQuery({ queryKey: queryKeys.cargos.all, queryFn: listCargos })
}

/** Salva um cargo (id null = novo) e atualiza a lista. */
export function useSalvarCargo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dados }: { id: string | null; dados: EditRole }) => saveCargo(id, dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cargos.all }),
  })
}
