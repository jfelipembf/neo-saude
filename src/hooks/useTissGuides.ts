import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  addTissGuide, cancelTissGuide, deleteTissGuideDraft, issueTissGuide, listTissGuides,
  type DadosCongelados, type NovaGuia,
} from '@/services/tissGuidesService'

export function useTissGuides() {
  return useQuery({ queryKey: queryKeys.tissGuides.all, queryFn: listTissGuides })
}

export function useCreateTissGuide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (nova: NovaGuia) => addTissGuide(nova),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tissGuides.all }),
  })
}

export function useIssueTissGuide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: DadosCongelados }) => issueTissGuide(id, dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tissGuides.all }),
  })
}

export function useCancelTissGuide() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelTissGuide(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tissGuides.all }),
  })
}

export function useDeleteTissGuideDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTissGuideDraft(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tissGuides.all }),
  })
}
