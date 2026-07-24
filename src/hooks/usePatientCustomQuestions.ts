import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  listPatientCustomQuestions, addPatientCustomQuestion, updatePatientCustomQuestion, deletePatientCustomQuestion,
} from '@/services/patientCustomQuestionsService'

export function usePatientCustomQuestions(patientId: string) {
  return useQuery({
    queryKey: queryKeys.customQuestions.byPatient(patientId),
    queryFn: () => listPatientCustomQuestions(patientId),
  })
}

export function useAddPatientCustomQuestion(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ question, answer }: { question: string; answer?: string }) =>
      addPatientCustomQuestion(patientId, question, answer),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.customQuestions.byPatient(patientId) }),
  })
}

export function useUpdatePatientCustomQuestion(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, question, answer }: { id: string; question: string; answer?: string }) =>
      updatePatientCustomQuestion(id, question, answer),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.customQuestions.byPatient(patientId) }),
  })
}

export function useDeletePatientCustomQuestion(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePatientCustomQuestion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.customQuestions.byPatient(patientId) }),
  })
}
