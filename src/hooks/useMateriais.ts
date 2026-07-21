import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addMaterial, listMateriais, updateMaterial } from '@/services/materiaisService'
import type { NewMaterial } from '@/services/materiaisService'

export function useMateriais() {
  return useQuery({ queryKey: queryKeys.materiais.all, queryFn: listMateriais })
}

/** Cadastra um material (modal "Novo material") e atualiza a lista. */
export function useCriarMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: NewMaterial) => addMaterial(dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.materiais.all }),
  })
}

/** Salva a edição de um material e atualiza a lista. */
export function useAtualizarMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: NewMaterial }) => updateMaterial(id, dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.materiais.all }),
  })
}
