import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addService, listServices, updateService } from '@/services/servicesService'
import type { EditService } from '@/services/servicesService'
import {
  listServiceInsurancePrices, saveServiceInsurancePrices,
} from '@/services/insuranceServicePricesService'

export function useServices() {
  return useQuery({ queryKey: queryKeys.services.all, queryFn: listServices })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EditService) => addService(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.services.all }),
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EditService }) => updateService(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.services.all }),
  })
}

/** Preços negociados deste serviço, um por convênio (TISS). */
export function useServiceInsurancePrices(serviceId: string | null) {
  return useQuery({
    queryKey: queryKeys.services.insurancePrices(serviceId ?? ''),
    queryFn: () => listServiceInsurancePrices(serviceId ?? ''),
    enabled: Boolean(serviceId),
  })
}

export function useSaveServiceInsurancePrices() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ serviceId, precos }: {
      serviceId: string
      precos: { insuranceId: string; price: number | null }[]
    }) => saveServiceInsurancePrices(serviceId, precos),
    onSuccess: (_data, variables) => queryClient.invalidateQueries({
      queryKey: queryKeys.services.insurancePrices(variables.serviceId),
    }),
  })
}
