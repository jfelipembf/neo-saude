import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getConsultorio, updateConsultorio, getResponsavel, updateResponsavel } from '@/services/consultorioService'
import type { ClinicData, TechnicalManager } from '@/types/domain'

export function useConsultorio() {
  return useQuery({ queryKey: queryKeys.consultorio.dados, queryFn: getConsultorio })
}

/** Salva os dados do consultório (Administrativo → Inicial). */
export function useSalvarConsultorio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: ClinicData) => updateConsultorio(dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.consultorio.dados }),
  })
}

export function useResponsavel() {
  return useQuery({ queryKey: queryKeys.consultorio.responsavel, queryFn: getResponsavel })
}

/** Salva os dados do responsável técnico (Administrativo → Inicial). */
export function useSalvarResponsavel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: TechnicalManager) => updateResponsavel(dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.consultorio.responsavel }),
  })
}
