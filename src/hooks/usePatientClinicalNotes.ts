import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getNotesByDate, listNoteDates } from '@/services/patientClinicalNotesService'

/** Dias com prontuário — marca o calendário da aba Prontuários. */
export function usePatientNoteDates(patientId: string) {
  return useQuery({
    queryKey: queryKeys.clinicalNotes.dates(patientId),
    queryFn: () => listNoteDates(patientId),
  })
}

/** Prontuário(s) do dia selecionado no calendário. */
export function usePatientNotesByDate(patientId: string, dateIso: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clinicalNotes.byDate(patientId, dateIso ?? ''),
    queryFn: () => getNotesByDate(patientId, dateIso as string),
    enabled: !!dateIso,
  })
}
