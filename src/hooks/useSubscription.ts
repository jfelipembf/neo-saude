import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getSubscription, listInvoices } from '@/services/subscriptionService'

export function useSubscription() {
  return useQuery({ queryKey: queryKeys.subscription.plan, queryFn: getSubscription })
}

export function useInvoices() {
  return useQuery({ queryKey: queryKeys.subscription.invoices, queryFn: listInvoices })
}
