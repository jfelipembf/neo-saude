import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addService, listServices, updateService } from '@/services/servicesService'
import type { EditService } from '@/services/servicesService'

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
