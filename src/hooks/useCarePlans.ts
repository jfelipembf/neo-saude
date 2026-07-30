import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  createCarePlan, finishCarePlan, linkAppointmentToPlan, listCarePlans,
  setCarePlanPhoto,
} from '@/services/carePlansService'
import type { NovoCarePlan } from '@/services/carePlansService'

export function useCarePlans(patientId: string) {
  return useQuery({
    queryKey: queryKeys.carePlans.byPatient(patientId),
    queryFn: () => listCarePlans(patientId),
    enabled: Boolean(patientId),
  })
}

export function useCreateCarePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (p: NovoCarePlan) => createCarePlan(p),
    onSuccess: (_id, p) => queryClient.invalidateQueries({
      queryKey: queryKeys.carePlans.byPatient(p.patientId),
    }),
  })
}

export function useSetCarePlanPhoto(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ planId, url }: { planId: string; url: string | null }) =>
      setCarePlanPhoto(planId, url),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: queryKeys.carePlans.byPatient(patientId),
    }),
  })
}

export function useFinishCarePlan(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ planId, observacao }: { planId: string; observacao?: string }) =>
      finishCarePlan(planId, observacao),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: queryKeys.carePlans.byPatient(patientId),
    }),
  })
}

/**
 * Vincula a consulta ao plano. Invalida os planos E a agenda: a contagem de
 * sessões é derivada das consultas, então mexer numa muda a outra.
 */
export function useLinkAppointmentToPlan(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ appointmentId, planId }: { appointmentId: string; planId: string | null }) =>
      linkAppointmentToPlan(appointmentId, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.carePlans.byPatient(patientId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
    },
  })
}
