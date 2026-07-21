import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listComissoes, saveComissao } from '@/services/comissoesService'
import type { EditCommission } from '@/services/comissoesService'

export function useComissoes() {
  return useQuery({ queryKey: queryKeys.comissoes.all, queryFn: listComissoes })
}

/** Salva (upsert) a regra de comissão de um profissional e atualiza a lista. */
export function useSalvarComissao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ profissionalId, dados }: { profissionalId: string; dados: EditCommission }) =>
      saveComissao(profissionalId, dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.comissoes.all }),
  })
}
