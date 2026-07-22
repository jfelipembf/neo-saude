import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addQuote, approveQuote, listPatientQuotes } from '@/services/quotesService'
import type { NewQuote } from '@/services/quotesService'
import type { PaymentPlanEntry } from '@/types/domain'

export function usePatientQuotes(patientId: string) {
  return useQuery({
    queryKey: queryKeys.quotes.byPatient(patientId),
    queryFn: () => listPatientQuotes(patientId),
  })
}

export function useCreateQuote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NewQuote) => addQuote(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all }),
  })
}

/** Aprova um orçamento e gera as parcelas conforme o plano de pagamento
 *  definido no aceite — invalida também Contas a Receber. */
export function useApproveQuote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, plan }: { id: string; plan?: PaymentPlanEntry[] }) => approveQuote(id, plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.receivables })
    },
  })
}
