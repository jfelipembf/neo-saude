import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addConvenio, listConvenios, updateConvenio } from '@/services/conveniosService'
import type { EditInsurance } from '@/services/conveniosService'

export function useConvenios() {
  return useQuery({ queryKey: queryKeys.convenios.all, queryFn: listConvenios })
}

/** Opções dos Selects de convênio: "Particular" + os convênios ATIVOS do cadastro. */
export function useOpcoesConvenio() {
  const { data } = useConvenios()
  return [
    { value: 'Particular', label: 'Particular' },
    ...(data ?? []).filter(c => c.status === 'ativo').map(c => ({ value: c.nome, label: c.nome })),
  ]
}

export function useCriarConvenio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: EditInsurance) => addConvenio(dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.convenios.all }),
  })
}

export function useAtualizarConvenio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: EditInsurance }) => updateConvenio(id, dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.convenios.all }),
  })
}
