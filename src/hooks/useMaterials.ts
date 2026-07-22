import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addMaterial, listMaterials, updateMaterial } from '@/services/materialsService'
import type { NewMaterial } from '@/services/materialsService'

export function useMaterials() {
  return useQuery({ queryKey: queryKeys.materials.all, queryFn: listMaterials })
}

/** Cadastra um material (modal "Novo material") e atualiza a lista. */
export function useCreateMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NewMaterial) => addMaterial(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.materials.all }),
  })
}

/** Salva a edição de um material e atualiza a lista. */
export function useUpdateMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: NewMaterial }) => updateMaterial(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.materials.all }),
  })
}
