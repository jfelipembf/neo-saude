import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addClassGroups, deleteClassGroup, listClassGroups, updateClassGroup } from '@/services/classGroupsService'
import type { ClassGroupFields, EditClassGroup } from '@/services/classGroupsService'

export function useClassGroups() {
  return useQuery({ queryKey: queryKeys.classGroups.all, queryFn: listClassGroups })
}

/** Cria uma sessão por dia da semana selecionado (ver addClassGroups). */
export function useCreateClassGroups() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fields, weekdays }: { fields: ClassGroupFields; weekdays: number[] }) => addClassGroups(fields, weekdays),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.classGroups.all }),
  })
}

export function useUpdateClassGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EditClassGroup }) => updateClassGroup(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.classGroups.all }),
  })
}

export function useDeleteClassGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteClassGroup(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.classGroups.all }),
  })
}
