import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  createNoteTemplate, deleteNoteTemplate, getConsultationChart,
  listNoteTemplates, saveConsultationChart,
} from '@/services/medicalNoteService'
import type { MedicalNote, MedicalNoteSection } from '@/services/medicalNoteService'

export function useConsultationChart(appointmentId: string | null) {
  return useQuery({
    queryKey: queryKeys.consultationChart(appointmentId ?? ''),
    queryFn: () => getConsultationChart(appointmentId as string),
    enabled: !!appointmentId,
  })
}

export function useSaveConsultationChart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ appointmentId, ...chart }: {
      appointmentId: string
      note: MedicalNote
      weightKg?: number
      heightCm?: number
    }) => saveConsultationChart(appointmentId, chart),
    onSuccess: (_, { appointmentId }) => {
      // A ficha e o histórico do paciente mudam juntos: o que foi escrito aqui
      // aparece na timeline da esquerda e na aba Prontuários do perfil.
      queryClient.invalidateQueries({ queryKey: queryKeys.consultationChart(appointmentId) })
      queryClient.invalidateQueries({ queryKey: ['medicalRecord'] })
      queryClient.invalidateQueries({ queryKey: ['clinicalNotes'] })
    },
  })
}

export function useNoteTemplates() {
  return useQuery({ queryKey: queryKeys.noteTemplates, queryFn: listNoteTemplates })
}

export function useCreateNoteTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (p: { section: MedicalNoteSection; name: string; body: string }) => createNoteTemplate(p),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.noteTemplates }),
  })
}

export function useDeleteNoteTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteNoteTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.noteTemplates }),
  })
}
