import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getNotesByDate, getPreviousSessionNote, listNoteDates } from '@/services/patientClinicalNotesService'

/** Dias com prontuário — marca o calendário da aba Prontuários (ou do
 *  seletor de data do Prontuário do Fisio, quando `carePlanId` recorta ao
 *  tratamento em curso). */
export function usePatientNoteDates(patientId: string, carePlanId?: string) {
  return useQuery({
    queryKey: queryKeys.clinicalNotes.dates(patientId, carePlanId),
    queryFn: () => listNoteDates(patientId, carePlanId),
  })
}

/** Prontuário(s) do dia selecionado no calendário. */
export function usePatientNotesByDate(patientId: string, dateIso: string | undefined, carePlanId?: string) {
  return useQuery({
    queryKey: queryKeys.clinicalNotes.byDate(patientId, dateIso ?? '', carePlanId),
    queryFn: () => getNotesByDate(patientId, dateIso as string, carePlanId),
    enabled: !!dateIso,
  })
}

/**
 * Evolução da sessão ANTERIOR do paciente (painel "Última sessão" do modal da
 * Agenda). A data/hora de referência é a da sessão aberta — sempre a SALVA, não
 * a que está sendo editada nos campos: a pergunta é "o que veio antes desta
 * sessão", não "o que viria antes se eu remarcasse".
 */
export function usePreviousSessionNote(
  patientId: string | undefined,
  beforeDateIso: string | undefined,
  beforeStartTime: string | undefined,
) {
  const enabled = Boolean(patientId && beforeDateIso && beforeStartTime)
  return useQuery({
    queryKey: queryKeys.clinicalNotes.previous(patientId ?? '', beforeDateIso ?? '', beforeStartTime ?? ''),
    queryFn: () => getPreviousSessionNote(patientId as string, beforeDateIso as string, beforeStartTime as string),
    enabled,
  })
}
