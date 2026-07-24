import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  enrollPatient, getEntitlementWeeklyLimit, listClassGroupEnrollmentCounts, listClassGroupRoster,
  listPatientClassGroupEnrollments, saveAttendance, saveAttendanceNote, unenrollPatient,
} from '@/services/classGroupRosterService'
import type { AttendanceEntry } from '@/services/classGroupRosterService'

/** Nº de matriculados por turma — o badge de lotação da Agenda. */
export function useClassGroupEnrollmentCounts() {
  return useQuery({ queryKey: queryKeys.classGroupRoster.enrollmentCounts, queryFn: listClassGroupEnrollmentCounts })
}

/** Roster (matrícula + presença do dia) de UMA ocorrência — só busca com o
 *  modal de chamada aberto (classGroupId/dateIso vazios = query desligada). */
export function useClassGroupRoster(classGroupId: string, dateIso: string) {
  return useQuery({
    queryKey: queryKeys.classGroupRoster.byOccurrence(classGroupId, dateIso),
    queryFn: () => listClassGroupRoster(classGroupId, dateIso),
    enabled: Boolean(classGroupId) && Boolean(dateIso),
  })
}

/** Turmas em que UM paciente já está matriculado — painel "Turmas
 *  matriculadas" do modo Matricular da Agenda. */
export function usePatientClassGroupEnrollments(patientId: string) {
  return useQuery({
    queryKey: queryKeys.classGroupRoster.byPatient(patientId),
    queryFn: () => listPatientClassGroupEnrollments(patientId),
    enabled: Boolean(patientId),
  })
}

/** Limite semanal (dias/semana) do contrato por trás de uma entitlement —
 *  trava a multi-seleção de turmas no modo Matricular. */
export function useEntitlementWeeklyLimit(entitlementId: string) {
  return useQuery({
    queryKey: queryKeys.classGroupRoster.weeklyLimit(entitlementId),
    queryFn: () => getEntitlementWeeklyLimit(entitlementId),
    enabled: Boolean(entitlementId),
  })
}

function invalidateRoster(queryClient: ReturnType<typeof useQueryClient>, classGroupId: string, dateIso: string, patientId?: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.classGroupRoster.byOccurrence(classGroupId, dateIso) })
  queryClient.invalidateQueries({ queryKey: queryKeys.classGroupRoster.enrollmentCounts })
  if (patientId) queryClient.invalidateQueries({ queryKey: queryKeys.classGroupRoster.byPatient(patientId) })
}

/**
 * Sem classGroupId/dateIso de hook — diferente das outras mutations daqui,
 * matricular acontece em DOIS contextos com uma turma+data só conhecida na
 * hora do clique: dentro do ClassAttendanceModal (turma fixa) e no modo
 * "Matricular" da Agenda (usuário ainda vai ESCOLHER a turma clicando num
 * card). Por isso classGroupId/dateIso entram nas variáveis da mutation, não
 * no hook.
 */
export function useEnrollPatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { classGroupId: string; dateIso: string; patientId: string; entitlementId: string }) =>
      enrollPatient(vars.classGroupId, vars.patientId, vars.entitlementId),
    onSuccess: (_data, vars) => invalidateRoster(queryClient, vars.classGroupId, vars.dateIso, vars.patientId),
  })
}

/** Remover matrícula fora do contexto de uma ocorrência específica — usada
 *  pela aba "Matrículas" do perfil do paciente (não há classGroupId/dateIso
 *  fixos aqui, só invalida o que faz sentido: as turmas do paciente e a
 *  contagem de lotação). */
export function useUnenrollPatientGlobal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ enrollmentId }: { enrollmentId: string; patientId: string }) => unenrollPatient(enrollmentId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classGroupRoster.byPatient(vars.patientId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.classGroupRoster.enrollmentCounts })
    },
  })
}

export function useSaveAttendance(classGroupId: string, dateIso: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entries: AttendanceEntry[]) => saveAttendance(classGroupId, dateIso, entries),
    onSuccess: () => invalidateRoster(queryClient, classGroupId, dateIso),
  })
}

export function useSaveAttendanceNote(classGroupId: string, dateIso: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ patientId, html }: { patientId: string; html: string }) => saveAttendanceNote(classGroupId, patientId, dateIso, html),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.classGroupRoster.byOccurrence(classGroupId, dateIso) }),
  })
}
