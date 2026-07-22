import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getProfessional, listProfessionals, updateProfessional } from '@/services/professionalsService'
import type { EditProfessional } from '@/services/professionalsService'

export function useProfessionals() {
  return useQuery({ queryKey: queryKeys.professionals.all, queryFn: listProfessionals })
}

export function useProfessional(id: string) {
  return useQuery({
    queryKey: queryKeys.professionals.detail(id),
    queryFn: () => getProfessional(id),
    enabled: Boolean(id),
  })
}

export function useUpdateProfessional() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EditProfessional }) => updateProfessional(id, payload),
    // A key de detalhe é prefixada por ['professionals'] — uma invalidação cobre as duas.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.professionals.all }),
  })
}
