import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  addClinicalEntry, listClinicalEntries, removeClinicalEntry, updateClinicalEntry,
  type NewClinicalEntry,
} from '@/services/clinicalEntriesService'

export function useClinicalEntries(patientId: string | null) {
  return useQuery({
    queryKey: queryKeys.clinicalEntries.byPatient(patientId ?? ''),
    queryFn: () => listClinicalEntries(patientId ?? ''),
    enabled: Boolean(patientId),
  })
}

export function useAddClinicalEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (nova: NewClinicalEntry) => addClinicalEntry(nova),
    onSuccess: (_d, v) => queryClient.invalidateQueries({
      queryKey: queryKeys.clinicalEntries.byPatient(v.patientId),
    }),
  })
}

export function useRemoveClinicalEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; patientId: string }) => removeClinicalEntry(id),
    onSuccess: (_d, v) => queryClient.invalidateQueries({
      queryKey: queryKeys.clinicalEntries.byPatient(v.patientId),
    }),
  })
}

export function useUpdateClinicalEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, content, eventDateIso, relation }: {
      id: string; patientId: string; content: string; eventDateIso?: string; relation?: string
    }) => updateClinicalEntry(id, content, eventDateIso, relation),
    onSuccess: (_d, v) => queryClient.invalidateQueries({
      queryKey: queryKeys.clinicalEntries.byPatient(v.patientId),
    }),
  })
}
