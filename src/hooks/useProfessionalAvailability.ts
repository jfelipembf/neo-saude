import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listAvailabilityTemplate, setAvailabilityTemplate } from '@/services/professionalAvailabilityService'
import { listBlockedSlots, saveBlockedSlots } from '@/services/professionalBlockedSlotService'
import { listAbsences, addAbsence, removeAbsence } from '@/services/professionalAbsenceService'
import type { NewAbsence } from '@/services/professionalAbsenceService'
import type { ProfessionalAvailabilitySlot } from '@/types/domain'

/** Grade recorrente de disponibilidade do profissional. */
export function useAvailabilityTemplate(professionalId: string) {
  return useQuery({
    queryKey: queryKeys.professionals.availabilityTemplate(professionalId),
    queryFn: () => listAvailabilityTemplate(professionalId),
    enabled: !!professionalId,
  })
}

export function useSetAvailabilityTemplate(professionalId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (slots: ProfessionalAvailabilitySlot[]) => setAvailabilityTemplate(professionalId, slots),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.professionals.availabilityTemplate(professionalId) }),
  })
}

/** Horas bloqueadas do profissional na janela de datas visível na Agenda geral. */
export function useBlockedSlots(professionalId: string, fromIso: string, toIso: string) {
  return useQuery({
    queryKey: queryKeys.professionals.blockedSlots(professionalId, fromIso, toIso),
    queryFn: () => listBlockedSlots(professionalId, fromIso, toIso),
    enabled: !!professionalId,
  })
}

export function useSaveBlockedSlots(professionalId: string, fromIso: string, toIso: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ dates, blocks, reason }: { dates: string[]; blocks: { date: string; hour: number }[]; reason?: string }) =>
      saveBlockedSlots(professionalId, dates, blocks, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.professionals.blockedSlots(professionalId, fromIso, toIso) }),
  })
}

/** Períodos de ausência do profissional (viagem, férias, atestado). */
export function useAbsences(professionalId: string) {
  return useQuery({
    queryKey: queryKeys.professionals.absences(professionalId),
    queryFn: () => listAbsences(professionalId),
    enabled: !!professionalId,
  })
}

export function useAddAbsence(professionalId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NewAbsence) => addAbsence(professionalId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.professionals.absences(professionalId) }),
  })
}

export function useRemoveAbsence(professionalId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => removeAbsence(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.professionals.absences(professionalId) }),
  })
}
