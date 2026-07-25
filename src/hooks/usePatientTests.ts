import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  deletePatientTestResult, listPatientTestResults,
  listPatientTests, savePatientTestResult, setPatientTests,
} from '@/services/patientTestsService'
import type { SaveTestResultInput } from '@/services/patientTestsService'

export function usePatientTests(patientId: string) {
  return useQuery({
    queryKey: queryKeys.patientTests.byPatient(patientId),
    queryFn: () => listPatientTests(patientId),
    enabled: Boolean(patientId),
  })
}

export function useSetPatientTests(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (testIds: string[]) => setPatientTests(patientId, testIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.patientTests.byPatient(patientId) }),
  })
}

export function usePatientTestResults(patientId: string, testId: string | null) {
  return useQuery({
    queryKey: queryKeys.patientTests.results(patientId, testId ?? ''),
    queryFn: () => listPatientTestResults(patientId, testId!),
    enabled: Boolean(patientId) && Boolean(testId),
  })
}

/**
 * Grava uma aplicação — nova ou correção — pela RPC transacional. UM hook para
 * os dois casos porque é UMA chamada só: `resultId` ausente insere, presente
 * corrige. Separar em dois só duplicaria a invalidação da mesma query.
 */
export function useSavePatientTestResult(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<SaveTestResultInput, 'patientId'>) =>
      savePatientTestResult({ patientId, ...input }),
    onSuccess: (_id, { testId }) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.patientTests.results(patientId, testId) }),
  })
}

export function useDeletePatientTestResult(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; testId: string }) => deletePatientTestResult(id),
    onSuccess: (_data, { testId }) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.patientTests.results(patientId, testId) }),
  })
}
