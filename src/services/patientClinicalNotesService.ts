import { supabase } from '@/lib/supabase'
import { isBlankSoap } from '@/utils/soap'
import type { SoapNote } from '@/types/domain'

// Prontuário por SESSÃO (aba "Prontuários" do perfil + painel "Última sessão"
// da Agenda). São DUAS fontes, porque uma sessão de fisioterapia acontece de
// duas formas e cada uma grava num lugar:
//   • individual → appointment.clinical_note            (AppointmentModal)
//   • em turma   → class_group_attendance.clinical_note (ClassAttendanceModal)
// Ler só a primeira escondia do histórico do paciente TODA evolução escrita
// numa turma. Aqui as duas viram uma lista só.
//
// Nota vazia não é nota: o CHECK do banco recusa seção em branco, mas nada
// impede uma linha antiga/torta de chegar sem nenhuma seção preenchida — e aí
// o dia ficava marcado no calendário e abria em branco. Por isso todo
// carregamento passa por isBlankSoap (o `not(...)` continua só como pré-filtro
// barato no banco).

export type ClinicalNoteSource = 'appointment' | 'classGroup'

export interface SessionClinicalNote {
  /** id da linha de origem (consulta OU frequência de turma) — chave de lista. */
  id: string
  source: ClinicalNoteSource
  /** Só quando vem de uma consulta: anexo pendura no appointment_id. */
  appointmentId?: string
  /** aaaa-mm-dd */
  date: string
  /** 'HH:MM' — da consulta ou do horário da turma. */
  startTime: string
  /** Serviço da consulta ou nome da turma. */
  activity: string
  /** Quem atendeu — o NOME é resolvido na tela (useProfessionalName). */
  professionalId?: string
  /** A evolução em si, já nas quatro seções (ver appointment.clinical_note).
   *  Quem precisa dela num HTML só (impressão, leitura corrida) usa
   *  soapToHtml — a fonte continua sendo a nota estruturada. */
  note: SoapNote
}

/** Janela de busca comum às duas fontes (dia exato, "até tal dia", teto de linhas). */
interface NoteWindow {
  fromIso?: string
  toIso?: string
  limit?: number
}

/** Mais recente primeiro — ordem natural de histórico clínico. */
function byMostRecent(a: SessionClinicalNote, b: SessionClinicalNote) {
  return `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`)
}

/** Sessões individuais com evolução escrita. */
async function listAppointmentNotes(patientId: string, window: NoteWindow): Promise<SessionClinicalNote[]> {
  let query = supabase
    .from('appointment')
    .select('id, date, start_time, service, professional_id, clinical_note')
    .eq('patient_id', patientId)
    .not('clinical_note', 'is', null)
  if (window.fromIso) query = query.gte('date', window.fromIso)
  if (window.toIso) query = query.lte('date', window.toIso)

  const ordered = query.order('date', { ascending: false }).order('start_time', { ascending: false })
  const { data, error } = await (window.limit ? ordered.limit(window.limit) : ordered)
  if (error) throw error

  return (data ?? [])
    .filter(row => !isBlankSoap(row.clinical_note as SoapNote | null))
    .map(row => ({
      id: row.id as string,
      source: 'appointment' as const,
      appointmentId: row.id as string,
      date: row.date as string,
      startTime: (row.start_time as string).slice(0, 5),
      activity: row.service as string,
      professionalId: (row.professional_id as string | null) ?? undefined,
      note: row.clinical_note as SoapNote,
    }))
}

/** Sessões de TURMA com evolução escrita (chamada do ClassAttendanceModal).
 *  Horário, nome e profissional vêm da turma — a frequência só guarda a data. */
async function listClassGroupNotes(patientId: string, window: NoteWindow): Promise<SessionClinicalNote[]> {
  let query = supabase
    .from('class_group_attendance')
    .select('id, occurred_on, class_group_id, clinical_note')
    .eq('patient_id', patientId)
    .not('clinical_note', 'is', null)
  if (window.fromIso) query = query.gte('occurred_on', window.fromIso)
  if (window.toIso) query = query.lte('occurred_on', window.toIso)

  const ordered = query.order('occurred_on', { ascending: false })
  const { data, error } = await (window.limit ? ordered.limit(window.limit) : ordered)
  if (error) throw error

  const rows = (data ?? []).filter(row => !isBlankSoap(row.clinical_note as SoapNote | null))
  if (rows.length === 0) return []

  // Join manual (mesmo padrão do classGroupRosterService): a turma dá o nome, o
  // horário e o profissional que a evolução não guarda.
  const { data: groups, error: groupsError } = await supabase
    .from('class_group')
    .select('id, name, start_time, professional_id')
    .in('id', [...new Set(rows.map(row => row.class_group_id as string))])
  if (groupsError) throw groupsError
  const groupById = new Map((groups ?? []).map(group => [group.id as string, group]))

  return rows.map(row => {
    const group = groupById.get(row.class_group_id as string)
    return {
      id: row.id as string,
      source: 'classGroup' as const,
      date: row.occurred_on as string,
      startTime: group ? String(group.start_time).slice(0, 5) : '',
      activity: group?.name ?? 'Turma',
      professionalId: (group?.professional_id as string | null) ?? undefined,
      note: row.clinical_note as SoapNote,
    }
  })
}

/** As duas fontes numa lista só, mais recente primeiro. */
async function listSessionNotes(patientId: string, window: NoteWindow): Promise<SessionClinicalNote[]> {
  const [individual, group] = await Promise.all([
    listAppointmentNotes(patientId, window),
    listClassGroupNotes(patientId, window),
  ])
  return [...individual, ...group].sort(byMostRecent)
}

/** Dias (aaaa-mm-dd) com prontuário não-vazio — alimenta o `markedDates` do Calendar. */
export async function listNoteDates(patientId: string): Promise<string[]> {
  const notes = await listSessionNotes(patientId, {})
  return Array.from(new Set(notes.map(note => note.date)))
}

/** Prontuário(s) do dia selecionado no calendário, na ordem do dia. */
export async function getNotesByDate(patientId: string, dateIso: string): Promise<SessionClinicalNote[]> {
  const notes = await listSessionNotes(patientId, { fromIso: dateIso, toIso: dateIso })
  return notes.reverse()   // já vem do mais recente: inverter dá a ordem do dia
}

/** Teto de linhas lidas por fonte na busca da sessão anterior — com a janela
 *  `toIso` e a ordem decrescente, a anterior está sempre nas primeiras. */
const PREVIOUS_LOOKUP_LIMIT = 20

/**
 * Última sessão com prontuário ANTES deste ponto no tempo — de QUALQUER
 * profissional e serviço (appointment.service é texto livre e não há FK para
 * service: filtrar por serviço deixaria de fora justamente a sessão anterior
 * cadastrada com outro nome).
 *
 * Alimenta o painel "Última sessão" do AppointmentModal, para o profissional
 * consultar a evolução anterior SEM sair da tela (sair perdia o que já tinha
 * digitado).
 */
export async function getPreviousSessionNote(
  patientId: string,
  beforeDateIso: string,
  beforeStartTime: string,
): Promise<SessionClinicalNote | null> {
  const notes = await listSessionNotes(patientId, { toIso: beforeDateIso, limit: PREVIOUS_LOOKUP_LIMIT })
  const earlier = notes.filter(note =>
    note.date < beforeDateIso || (note.date === beforeDateIso && note.startTime < beforeStartTime),
  )
  return earlier[0] ?? null   // já ordenado do mais recente para o mais antigo
}
