import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  getMedicalRecord, listPatientConsultations, saveMedicalRecord,
} from '@/services/medicalRecordService'

export function useMedicalRecord(appointmentId: string | null) {
  return useQuery({
    queryKey: queryKeys.appointments.medicalRecord(appointmentId ?? ''),
    queryFn: () => getMedicalRecord(appointmentId ?? ''),
    enabled: Boolean(appointmentId),
  })
}

export function useSaveMedicalRecord() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ appointmentId, html }: { appointmentId: string; html: string }) =>
      saveMedicalRecord(appointmentId, html),
    onSuccess: (_d, v) => queryClient.invalidateQueries({
      queryKey: queryKeys.appointments.medicalRecord(v.appointmentId),
    }),
  })
}

/** Consultas anteriores do paciente — a timeline da coluna esquerda. */
export function usePatientConsultations(patientId: string | null, excetoAppointmentId?: string) {
  return useQuery({
    queryKey: [...queryKeys.appointments.all, 'historico', patientId ?? '', excetoAppointmentId ?? ''],
    queryFn: () => listPatientConsultations(patientId ?? '', excetoAppointmentId),
    enabled: Boolean(patientId),
  })
}
