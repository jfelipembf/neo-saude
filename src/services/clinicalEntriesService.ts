import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { isoToBrDate } from '@/utils/date'

/**
 * OS ACHADOS QUE SE ACUMULAM NO PACIENTE.
 *
 * Antecedente cirúrgico, histórico familiar, medicação em uso e fator de risco
 * são a história da pessoa, não o atendimento do dia — por isso vivem aqui e
 * não em `appointment.medical_record`.
 *
 * Cada anotação é uma LINHA NOVA, nunca sobrescrita: o que o paciente disse em
 * março continua registrado mesmo que em julho ele diga outra coisa. É a versão
 * anterior que sustenta a conduta anterior.
 */

export type ClinicalEntryKind =
  | 'problems'
  | 'diagnosis'
  | 'surgical_history'
  | 'family_history'
  | 'anamnesis'
  | 'medications'
  | 'risks'

export interface ClinicalEntry {
  id: string
  kind: ClinicalEntryKind
  content: string
  /** dd/mm/aaaa — quando foi ANOTADO. */
  date: string
  /** dd/mm/aaaa — quando ACONTECEU (cirurgia, diagnóstico). Ausente quando o
   *  paciente não sabe precisar. */
  eventDate?: string
  /** Parentesco — só no histórico familiar. */
  relation?: string
  professionalId?: string
  /** Só em `kind: 'problems'`: a qual diagnóstico este achado pertence.
   *  Ausente = achado sem diagnóstico (lançado antes deste vínculo existir). */
  diagnosisId?: string
  /** A qual tratamento esta anotação pertence — carimbado pelo banco na
   *  gravação, só em `diagnosis` e `problems`. Ausente nos tipos compartilhados
   *  (antecedente, histórico familiar, medicação, risco), que valem além do
   *  episódio, e nos registros anteriores ao vínculo existir. */
  carePlanId?: string
}

/** Os tipos que pertencem a UM tratamento. Espelha a regra do gatilho
 *  `private.tg_carimba_plano` — se divergir, a tela esconde o que o banco
 *  carimbou (ou mostra o que ele deixou solto). */
export const KINDS_DO_TRATAMENTO: readonly ClinicalEntryKind[] = ['diagnosis', 'problems']

const COLUMNS = 'id, kind, content, event_date, relation, created_at, professional_id, diagnosis_id, care_plan_id'

/** Todas as anotações do paciente, mais recentes primeiro. Uma busca só para as
 *  cinco seções — cinco chamadas separadas seriam cinco idas ao banco por
 *  paciente aberto. */
export async function listClinicalEntries(patientId: string): Promise<ClinicalEntry[]> {
  const { data, error } = await supabase
    .from('patient_clinical_entry')
    .select(COLUMNS)
    .eq('clinic_id', getCurrentClinicId())
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  if (error) throw error

  return (data ?? []).map(r => ({
    id: r.id as string,
    kind: r.kind as ClinicalEntryKind,
    content: r.content as string,
    // Sem `.slice(0, 10)`: cortar o timestamp deixava a data em UTC, e a
    // anotação feita às 22h no Brasil aparecia com a data de amanhã.
    date: isoToBrDate(r.created_at as string) ?? '',
    eventDate: isoToBrDate(r.event_date as string | null),
    relation: (r.relation as string | null) ?? undefined,
    professionalId: (r.professional_id as string | null) ?? undefined,
    diagnosisId: (r.diagnosis_id as string | null) ?? undefined,
    carePlanId: (r.care_plan_id as string | null) ?? undefined,
  }))
}

export interface NewClinicalEntry {
  patientId: string
  appointmentId?: string
  kind: ClinicalEntryKind
  content: string
  /** aaaa-mm-dd — quando aconteceu. */
  eventDateIso?: string
  relation?: string
  professionalId?: string
  /** Só para kind: 'problems' — o diagnóstico (outra entrada, kind:
   *  'diagnosis') ao qual este achado pertence. */
  diagnosisId?: string
}

/**
 * Devolve o ID do registro criado — a tela usa para abrir o cartão do
 * diagnóstico recém-criado já no modo de edição, com o campo de achado à vista.
 */
export async function addClinicalEntry(nova: NewClinicalEntry): Promise<string> {
  const { data, error } = await supabase.from('patient_clinical_entry').insert({
    clinic_id: getCurrentClinicId(),
    patient_id: nova.patientId,
    appointment_id: nova.appointmentId ?? null,
    kind: nova.kind,
    content: nova.content.trim(),
    event_date: nova.eventDateIso || null,
    relation: nova.relation?.trim() || null,
    professional_id: nova.professionalId ?? null,
    diagnosis_id: nova.diagnosisId ?? null,
  }).select('id').single()
  if (error) throw error
  // Zero linhas = a RLS recusou em silêncio (o PostgREST devolve sucesso).
  // Sem esta checagem a tela dizia "registrado" sobre gravação que não houve.
  if (!data?.id) throw new Error('Sem permissão para registrar no prontuário.')
  return data.id
}

export async function removeClinicalEntry(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('patient_clinical_entry')
    .delete()
    .eq('id', id)
    .select('id')
  if (error) throw error
  // Zero linhas = a RLS recusou; sem conferir, a tela diria "excluído" e a
  // anotação continuaria no prontuário.
  if (!data?.length) throw new Error('Não foi possível excluir esta anotação.')
}

/** Corrige o texto e a data do FATO. O tipo, a autoria e o `created_at` não
 *  se reescrevem — são o registro do ato, não o conteúdo dele. */
export async function updateClinicalEntry(
  id: string, content: string, eventDateIso?: string, relation?: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('patient_clinical_entry')
    .update({
      content: content.trim(),
      event_date: eventDateIso || null,
      relation: relation?.trim() || null,
    })
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Não foi possível alterar esta anotação.')
}
