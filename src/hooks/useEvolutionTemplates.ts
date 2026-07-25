import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  addEvolutionTemplate,
  deleteEvolutionTemplate,
  listEvolutionTemplates,
  updateEvolutionTemplate,
} from '@/services/evolutionTemplatesService'
import type { EditEvolutionTemplate } from '@/services/evolutionTemplatesService'

/** Catálogo de modelos de evolução (Administrativo → Modelos de evolução e o
 *  seletor "usar modelo" do prontuário). */
export function useEvolutionTemplates() {
  return useQuery({ queryKey: queryKeys.evolutionTemplates.all, queryFn: listEvolutionTemplates })
}

export function useCreateEvolutionTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EditEvolutionTemplate) => addEvolutionTemplate(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.evolutionTemplates.all }),
  })
}

export function useUpdateEvolutionTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EditEvolutionTemplate }) => updateEvolutionTemplate(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.evolutionTemplates.all }),
  })
}

export function useDeleteEvolutionTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteEvolutionTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.evolutionTemplates.all }),
  })
}
