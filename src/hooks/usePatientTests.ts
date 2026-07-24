import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  addPatientTestResult, deletePatientTestResult, listPatientTestResults,
  listPatientTests, setPatientTests, updatePatientTestResult,
} from '@/services/patientTestsService'
import type { GoniometryPoints } from '@/types/domain'

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

export function useAddPatientTestResult(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ testId, levelId, performedOnIso, measuredAngle, imageUrl, measuredPoints }: {
      testId: string; levelId: string; performedOnIso: string
      measuredAngle?: number; imageUrl?: string; measuredPoints?: GoniometryPoints
    }) => addPatientTestResult(patientId, testId, levelId, performedOnIso, measuredAngle, imageUrl, measuredPoints),
    onSuccess: (_data, { testId }) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.patientTests.results(patientId, testId) }),
  })
}

export function useUpdatePatientTestResult(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, levelId, performedOnIso, measuredAngle, imageUrl, measuredPoints }: {
      id: string; testId: string; levelId: string; performedOnIso: string
      measuredAngle?: number; imageUrl?: string; measuredPoints?: GoniometryPoints
    }) => updatePatientTestResult(id, levelId, performedOnIso, measuredAngle, imageUrl, measuredPoints),
    onSuccess: (_data, { testId }) =>
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
