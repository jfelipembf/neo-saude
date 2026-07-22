import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listPayments, listPatientPayments, receivePayment } from '@/services/paymentsService'
import type { ReceivePaymentInput } from '@/services/paymentsService'

export function usePatientPayments(patientId: string) {
  return useQuery({
    queryKey: queryKeys.payments.byPatient(patientId),
    queryFn: () => listPatientPayments(patientId),
  })
}

export function usePayments() {
  return useQuery({ queryKey: queryKeys.payments.all, queryFn: listPayments })
}

/** Registra o recebimento (modal "Realizar pagamento") e atualiza a lista. */
export function useReceivePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReceivePaymentInput }) => receivePayment(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.payments.all }),
  })
}
