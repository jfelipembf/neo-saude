import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { signAssetUrls } from '@/lib/storage'
import { addDays, isoToBrDate, localDate, toIsoDate } from '@/utils/date'
import type { Json } from '@/types/database.types'
import type { ClassAttendanceStatus, ClassGroupRosterEntry, SoapNote } from '@/types/domain'

/**
 * Dias de tolerância após o pacote/plano vencer antes de a matrícula parar de
 * contar pra lotação/roster — a linha em class_group_enrollment CONTINUA
 * existindo (histórico); isto é só um cálculo na LEITURA (mesmo padrão do
 * "ativo" de patient_service_entitlement — ver comentário da tabela), não uma
 * exclusão de fato. Comprar um pacote/plano NOVO (renovação, de qualquer
 * serviço) entra na consulta natural em listPatientsWithValidCoverage, sem
 * precisar recriar a matrícula.
 */
const GRACE_DAYS = 5

function isCoverageValid(expiresAt: string | null): boolean {
  if (!expiresAt) return true   // sem validade — nunca vence
  const limitIso = toIsoDate(addDays(localDate(expiresAt), GRACE_DAYS))
  return limitIso >= toIsoDate(new Date())
}

type EntitlementCoverageRow = { patient_id: string; expires_at: string | null }

/** Pacientes com PELO MENOS UMA entitlement ainda dentro da tolerância. */
async function listPatientsWithValidCoverage(clinicId: string, patientIds: string[]): Promise<Set<string>> {
  if (patientIds.length === 0) return new Set()
  const { data, error } = await supabase
    .from('patient_service_entitlement')
    .select('patient_id, expires_at')
    .eq('clinic_id', clinicId)
    .in('patient_id', patientIds)
  if (error) throw error
  const covered = new Set<string>()
  for (const row of data as EntitlementCoverageRow[]) {
    if (isCoverageValid(row.expires_at)) covered.add(row.patient_id)
  }
  return covered
}

/** Nº de matriculados por turma (só quem ainda tem cobertura) — alimenta o
 *  badge de lotação (X/capacidade) no card da Agenda. */
export async function listClassGroupEnrollmentCounts(): Promise<Map<string, number>> {
  const clinicId = getCurrentClinicId()
  const { data, error } = await supabase
    .from('class_group_enrollment')
    .select('class_group_id, patient_id')
    .eq('clinic_id', clinicId)
  if (error) throw error
  const rows = data ?? []
  const covered = await listPatientsWithValidCoverage(clinicId, [...new Set(rows.map(r => r.patient_id))])
  const counts = new Map<string, number>()
  for (const row of rows) {
    if (!covered.has(row.patient_id)) continue
    counts.set(row.class_group_id, (counts.get(row.class_group_id) ?? 0) + 1)
  }
  return counts
}

export interface PatientClassGroupEnrollment {
  enrollmentId: string
  classGroupId: string
  classGroupName: string
  weekday: number
  startTime: string
  entitlementId: string
  /** Pacote/plano que justifica a matrícula — só exibição (aba Matrículas do perfil). */
  entitlementServiceName?: string
}

/** Turmas em que o paciente JÁ está matriculado (cobertura vigente) — aba
 *  "Matrículas" do perfil do paciente e o painel de referência no modo
 *  Matricular da Agenda. */
export async function listPatientClassGroupEnrollments(patientId: string): Promise<PatientClassGroupEnrollment[]> {
  const clinicId = getCurrentClinicId()
  const { data: enrollments, error } = await supabase
    .from('class_group_enrollment')
    .select('id, class_group_id, entitlement_id')
    .eq('patient_id', patientId)
    .eq('clinic_id', clinicId)
  if (error) throw error
  const rows = enrollments ?? []
  if (rows.length === 0) return []

  const covered = await listPatientsWithValidCoverage(clinicId, [patientId])
  if (!covered.has(patientId)) return []   // pacote/plano vencido há mais de GRACE_DAYS — nada "matriculado" de fato

  const groupIds = [...new Set(rows.map(r => r.class_group_id))]
  const entitlementIds = [...new Set(rows.map(r => r.entitlement_id))]

  const [
    { data: groups, error: groupsError },
    { data: entitlements, error: entitlementsError },
  ] = await Promise.all([
    supabase.from('class_group').select('id, name, weekday, start_time').in('id', groupIds),
    supabase.from('patient_service_entitlement').select('id, service_id').in('id', entitlementIds),
  ])
  if (groupsError) throw groupsError
  if (entitlementsError) throw entitlementsError

  const { data: services, error: servicesError } = await supabase
    .from('service')
    .select('id, name')
    .in('id', [...new Set((entitlements ?? []).map(e => e.service_id))])
  if (servicesError) throw servicesError

  const groupById = new Map((groups ?? []).map(g => [g.id, g]))
  const serviceNameByEntitlement = new Map(
    (entitlements ?? []).map(e => [e.id, (services ?? []).find(s => s.id === e.service_id)?.name]),
  )

  return rows.map(r => {
    const g = groupById.get(r.class_group_id)
    return {
      enrollmentId: r.id,
      classGroupId: r.class_group_id,
      classGroupName: g?.name ?? '—',
      weekday: g?.weekday ?? 0,
      startTime: g ? String(g.start_time).slice(0, 5) : '',
      entitlementId: r.entitlement_id,
      entitlementServiceName: serviceNameByEntitlement.get(r.entitlement_id) ?? undefined,
    }
  })
}

/** Limite semanal (nº de dias/semana) do serviço por trás de uma entitlement
 *  — undefined = sem limite. Usado pra travar a multi-seleção de turmas no
 *  modo Matricular da Agenda (ScheduleBoard). */
export async function getEntitlementWeeklyLimit(entitlementId: string): Promise<number | undefined> {
  const { data: entitlement, error } = await supabase
    .from('patient_service_entitlement')
    .select('service_id')
    .eq('id', entitlementId)
    .single()
  if (error) throw error
  const { data: service, error: serviceError } = await supabase
    .from('service')
    .select('weekly_limit')
    .eq('id', entitlement.service_id)
    .single()
  if (serviceError) throw serviceError
  return service.weekly_limit ?? undefined
}

type EnrollmentRow = { id: string; patient_id: string; entitlement_id: string }
type PatientRow = { id: string; name: string; photo_url: string | null }
type AttendanceRow = {
  patient_id: string
  status: ClassAttendanceStatus
  justification: string | null
  // O CHECK `class_group_attendance_clinical_note_shape_ck` garante a forma no
  // banco (as quatro chaves do SOAP, valor string) — a linha já chega como
  // SoapNote, sem revalidação na leitura.
  clinical_note: SoapNote | null
}
type EntitlementDisplayRow = { id: string; service_id: string; expires_at: string | null }

/** Roster de UMA ocorrência (turma + data): matrícula (permanente, filtrada
 *  pela cobertura vigente) com a presença/falta/prontuário JÁ REGISTRADOS
 *  nessa data, se houver — sem registro ainda, cai no padrão status='present'
 *  sem justificativa/nota. Paciente cujo pacote/plano venceu há mais de
 *  GRACE_DAYS sem renovar simplesmente não aparece mais aqui — a vaga liberou. */
export async function listClassGroupRoster(classGroupId: string, dateIso: string): Promise<ClassGroupRosterEntry[]> {
  const clinicId = getCurrentClinicId()
  const { data: enrollments, error: enrollError } = await supabase
    .from('class_group_enrollment')
    .select('id, patient_id, entitlement_id')
    .eq('class_group_id', classGroupId)
    .eq('clinic_id', clinicId)
  if (enrollError) throw enrollError

  const rows = (enrollments ?? []) as EnrollmentRow[]
  if (rows.length === 0) return []

  const patientIds = [...new Set(rows.map(r => r.patient_id))]
  const entitlementIds = [...new Set(rows.map(r => r.entitlement_id))]

  const [
    { data: patients, error: patientsError },
    { data: attendance, error: attendanceError },
    { data: entitlements, error: entitlementsError },
    covered,
  ] = await Promise.all([
    supabase.from('patient').select('id, name, photo_url').in('id', patientIds),
    supabase
      .from('class_group_attendance')
      .select('patient_id, status, justification, clinical_note')
      .eq('class_group_id', classGroupId)
      .eq('clinic_id', clinicId)
      .eq('occurred_on', dateIso),
    supabase.from('patient_service_entitlement').select('id, service_id, expires_at').in('id', entitlementIds),
    listPatientsWithValidCoverage(clinicId, patientIds),
  ])
  if (patientsError) throw patientsError
  if (attendanceError) throw attendanceError
  if (entitlementsError) throw entitlementsError

  const entitlementRows = entitlements as EntitlementDisplayRow[]
  const { data: services, error: servicesError } = await supabase
    .from('service')
    .select('id, name')
    .in('id', [...new Set(entitlementRows.map(e => e.service_id))])
  if (servicesError) throw servicesError

  const serviceNameById = new Map((services ?? []).map(s => [s.id, s.name as string]))
  const entitlementById = new Map(entitlementRows.map(e => [e.id, e]))
  const patientsById = new Map((patients as PatientRow[]).map(p => [p.id, p]))
  const signed = await signAssetUrls((patients as PatientRow[]).map(p => p.photo_url))
  const attendanceByPatient = new Map((attendance as AttendanceRow[]).map(a => [a.patient_id, a]))

  const entries: ClassGroupRosterEntry[] = []
  for (const row of rows) {
    if (!covered.has(row.patient_id)) continue   // pacote/plano vencido há mais de GRACE_DAYS — vaga já livre
    const patient = patientsById.get(row.patient_id)
    if (!patient) continue   // paciente removido/sem acesso — não quebra o roster
    const att = attendanceByPatient.get(row.patient_id)
    const entitlement = entitlementById.get(row.entitlement_id)
    entries.push({
      enrollmentId: row.id,
      patientId: row.patient_id,
      patientName: patient.name,
      patientPhoto: patient.photo_url ? signed.get(patient.photo_url) : undefined,
      status: att?.status ?? 'present',
      justification: att?.justification ?? undefined,
      clinicalNote: att?.clinical_note ?? undefined,
      entitlementServiceName: entitlement ? serviceNameById.get(entitlement.service_id) : undefined,
      entitlementExpiresAt: entitlement ? isoToBrDate(entitlement.expires_at) : undefined,
    })
  }
  return entries.sort((a, b) => a.patientName.localeCompare(b.patientName))
}

/** Matricula um paciente na turma — exige um pacote/plano (entitlement) que
 *  justifique a matrícula (auditoria/exibição; a vigência de fato é
 *  recalculada sobre TODAS as entitlements do paciente, ver topo do arquivo). */
export async function enrollPatient(classGroupId: string, patientId: string, entitlementId: string): Promise<void> {
  const { error } = await supabase.from('class_group_enrollment').insert({
    clinic_id: getCurrentClinicId(),
    class_group_id: classGroupId,
    patient_id: patientId,
    entitlement_id: entitlementId,
  })
  if (error) {
    if (error.code === '23505') throw new Error('Este paciente já está matriculado nesta turma.')
    throw error
  }
}

/** Remove a matrícula (não apaga a frequência já registrada — fica no histórico). */
export async function unenrollPatient(enrollmentId: string): Promise<void> {
  const { error } = await supabase.from('class_group_enrollment').delete().eq('id', enrollmentId)
  if (error) throw error
}

export interface AttendanceEntry {
  patientId: string
  status: ClassAttendanceStatus
  justification?: string
}

/**
 * class_group_attendance só concede UPDATE em (status, justification,
 * clinical_note) — de propósito, mesmo motivo documentado em
 * goalsService.ts: `.upsert()` do supabase-js monta o ON CONFLICT DO UPDATE
 * atribuindo TODAS as colunas do payload (inclusive as de identidade), e o
 * Postgres confere privilégio de coluna do SET no PLANO da instrução — um
 * upsert aqui estouraria 42501 já na primeira gravação. Por isso: acha a
 * linha existente (se houver) e faz UPDATE ou INSERT explícito, nunca upsert.
 */
async function findExistingAttendance(classGroupId: string, dateIso: string, patientIds: string[]) {
  const { data, error } = await supabase
    .from('class_group_attendance')
    .select('id, patient_id')
    .eq('class_group_id', classGroupId)
    .eq('occurred_on', dateIso)
    .in('patient_id', patientIds)
  if (error) throw error
  return new Map((data ?? []).map(row => [row.patient_id as string, row.id as string]))
}

/** Grava a presença/falta (+ justificativa) da turma nesta data — não mexe no
 *  prontuário (coluna separada, ver saveAttendanceNote), só nos campos de presença. */
export async function saveAttendance(classGroupId: string, dateIso: string, entries: AttendanceEntry[]): Promise<void> {
  if (entries.length === 0) return
  const clinicId = getCurrentClinicId()
  const existing = await findExistingAttendance(classGroupId, dateIso, entries.map(e => e.patientId))

  await Promise.all(entries.map(e => {
    const justification = e.status === 'absent' ? (e.justification?.trim() || null) : null
    const existingId = existing.get(e.patientId)
    return existingId
      ? supabase.from('class_group_attendance').update({ status: e.status, justification }).eq('id', existingId)
      : supabase.from('class_group_attendance').insert({
          clinic_id: clinicId, class_group_id: classGroupId, patient_id: e.patientId,
          occurred_on: dateIso, status: e.status, justification,
        })
  }).map(p => p.then(({ error }) => { if (error) throw error })))
}

/** Grava só o prontuário SOAP da sessão de UM paciente — ação separada do
 *  "Salvar presença" (mesmo desenho do "Salvar prontuário" da consulta).
 *  `note` já chega normalizado: undefined grava NULL (nota apagada), seção em
 *  branco não vira chave — é o que o CHECK do banco exige. */
export async function saveAttendanceNote(
  classGroupId: string,
  patientId: string,
  dateIso: string,
  note: SoapNote | undefined,
): Promise<void> {
  const existing = await findExistingAttendance(classGroupId, dateIso, [patientId])
  const existingId = existing.get(patientId)
  const clinicalNote = (note ?? null) as Json
  const { error } = existingId
    ? await supabase.from('class_group_attendance').update({ clinical_note: clinicalNote }).eq('id', existingId)
    : await supabase.from('class_group_attendance').insert({
        clinic_id: getCurrentClinicId(), class_group_id: classGroupId, patient_id: patientId,
        occurred_on: dateIso, clinical_note: clinicalNote,
      })
  if (error) throw error
}
