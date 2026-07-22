import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getClinic, updateClinic, getTechnicalManager, updateTechnicalManager } from '@/services/clinicService'
import type { ClinicData, TechnicalManager } from '@/types/domain'

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

export function useTechnicalManager() {
  return useQuery({ queryKey: queryKeys.clinic.manager, queryFn: getTechnicalManager })
}

/** Salva os dados do responsável técnico (Administrativo → Inicial). */
export function useSaveTechnicalManager() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: TechnicalManager) => updateTechnicalManager(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.clinic.manager }),
  })
}
