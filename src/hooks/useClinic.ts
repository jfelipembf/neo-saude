import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getClinic, updateClinic } from '@/services/clinicService'
import type { ClinicData } from '@/types/domain'

export function useClinic() {
  return useQuery({ queryKey: queryKeys.clinic.data, queryFn: getClinic })
}

/** Salva os dados do consultório (Administrativo → Inicial). */
export function useSaveClinic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClinicData) => updateClinic(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.clinic.data }),
  })
}
