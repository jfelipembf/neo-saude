import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addSala, listSalas, updateSala } from '@/services/salasService'
import type { NewRoom } from '@/services/salasService'

export function useSalas() {
  return useQuery({ queryKey: queryKeys.salas.all, queryFn: listSalas })
}

/** Cadastra uma sala (modal "Nova sala") e atualiza a lista. */
export function useCriarSala() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: NewRoom) => addSala(dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.salas.all }),
  })
}

/** Salva a edição de uma sala e atualiza a lista. */
export function useAtualizarSala() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: NewRoom }) => updateSala(id, dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.salas.all }),
  })
}
