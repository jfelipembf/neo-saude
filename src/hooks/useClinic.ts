import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getClinic, updateClinic, getTechnicalManager, setTechnicalManager } from '@/services/clinicService'
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

/** O profissional marcado como responsável técnico — `null` enquanto a clínica
 *  não designar um (é o estado de quem ainda não cadastrou profissionais). */
export function useTechnicalManager() {
  return useQuery({ queryKey: queryKeys.clinic.manager, queryFn: getTechnicalManager })
}

/** Designa qual profissional responde tecnicamente pela clínica. */
export function useSetTechnicalManager() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (professionalId: string) => setTechnicalManager(professionalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clinic.manager })
      // A troca reescreve `is_technical_manager` de DOIS profissionais.
      queryClient.invalidateQueries({ queryKey: queryKeys.professionals.all })
    },
  })
}
