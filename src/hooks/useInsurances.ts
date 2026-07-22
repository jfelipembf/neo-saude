import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addInsurance, listInsurances, updateInsurance } from '@/services/insurancesService'
import type { EditInsurance } from '@/services/insurancesService'

export function useInsurances() {
  return useQuery({ queryKey: queryKeys.insurances.all, queryFn: listInsurances })
}

/** Opções dos Selects de convênio: "Particular" + os convênios ATIVOS do cadastro. */
export function useInsuranceOptions() {
  const { data } = useInsurances()
  return [
    { value: 'Particular', label: 'Particular' },
    ...(data ?? []).filter(c => c.status === 'active').map(c => ({ value: c.name, label: c.name })),
  ]
}

export function useCreateInsurance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EditInsurance) => addInsurance(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.insurances.all }),
  })
}

export function useUpdateInsurance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EditInsurance }) => updateInsurance(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.insurances.all }),
  })
}
