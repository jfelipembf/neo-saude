import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getProfissional, listProfissionais, updateProfissional } from '@/services/profissionaisService'
import type { EditProfessional } from '@/services/profissionaisService'

export function useProfissionais() {
  return useQuery({ queryKey: queryKeys.profissionais.all, queryFn: listProfissionais })
}

export function useProfissional(id: string) {
  return useQuery({
    queryKey: queryKeys.profissionais.detail(id),
    queryFn: () => getProfissional(id),
    enabled: Boolean(id),
  })
}

export function useAtualizarProfissional() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: EditProfessional }) => updateProfissional(id, dados),
    // A key de detalhe é prefixada por ['profissionais'] — uma invalidação cobre as duas.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.profissionais.all }),
  })
}
