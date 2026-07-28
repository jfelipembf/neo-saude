import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'

/**
 * A FICHA ESTRUTURADA DA CONSULTA.
 *
 * Seis seções nomeadas (`appointment.medical_note`, jsonb) mais peso e altura,
 * que o banco transforma em IMC por coluna gerada. É o centro da tela de
 * atendimento médico.
 *
 * Separado de `medicalRecordService`, que cuida da coluna antiga de texto livre
 * (`medical_record`): as consultas já registradas por ela continuam legíveis, e
 * misturar as duas num service só faria toda leitura ter de perguntar de qual
 * das formas o registro veio.
 */

/** As seções, na ordem em que a consulta acontece. */
export const MEDICAL_NOTE_SECTIONS = [
  { key: 'queixa',       label: 'Queixa principal',            rico: false },
  { key: 'hma',          label: 'História da moléstia atual',  rico: true },
  { key: 'antecedentes', label: 'Histórico e antecedentes',    rico: true },
  { key: 'exame_fisico', label: 'Exame físico',                rico: true },
  { key: 'diagnostico',  label: 'Diagnóstico',                 rico: false },
  { key: 'condutas',     label: 'Condutas',                    rico: true },
] as const

export type MedicalNoteSection = (typeof MEDICAL_NOTE_SECTIONS)[number]['key']

/** Cada seção guarda HTML (as ricas) ou texto simples (queixa e diagnóstico). */
export type MedicalNote = Partial<Record<MedicalNoteSection, string>>

export interface ConsultationChart {
  note: MedicalNote
  weightKg?: number
  heightCm?: number
  /** Calculado pelo BANCO — nunca recalculado aqui. */
  bmi?: number
}

export async function getConsultationChart(appointmentId: string): Promise<ConsultationChart> {
  const { data, error } = await supabase
    .from('appointment')
    .select('medical_note, weight_kg, height_cm, bmi')
    .eq('clinic_id', getCurrentClinicId())
    .eq('id', appointmentId)
    .maybeSingle()
  if (error) throw error
  return {
    note: (data?.medical_note as MedicalNote | null) ?? {},
    weightKg: data?.weight_kg != null ? Number(data.weight_kg) : undefined,
    heightCm: data?.height_cm != null ? Number(data.height_cm) : undefined,
    bmi: data?.bmi != null ? Number(data.bmi) : undefined,
  }
}

export async function saveConsultationChart(
  appointmentId: string,
  chart: { note: MedicalNote; weightKg?: number; heightCm?: number },
): Promise<void> {
  // Seção vazia sai do objeto: `{hma: ""}` gravado faria a tela de leitura
  // desenhar um cabeçalho "História da moléstia atual" com nada embaixo.
  const limpo: MedicalNote = {}
  for (const [k, v] of Object.entries(chart.note)) {
    if (v && v.trim() && v.trim() !== '<p></p>') limpo[k as MedicalNoteSection] = v
  }

  const { data, error } = await supabase
    .from('appointment')
    .update({
      medical_note: Object.keys(limpo).length ? limpo : null,
      weight_kg: chart.weightKg ?? null,
      height_cm: chart.heightCm ?? null,
      // `bmi` NÃO entra: é coluna gerada. Mandá-la seria erro do Postgres, e é
      // essa recusa que garante que nunca exista IMC divergente do peso.
    })
    .eq('id', appointmentId)
    .select('id')
  if (error) throw error
  // Zero linhas = a RLS recusou. Sem isto a tela diria "salvo" sobre uma
  // escrita que não aconteceu.
  if (!data?.length) throw new Error('Não foi possível gravar a ficha desta consulta.')
}

// ── Modelos por seção ────────────────────────────────────────────────────────

export interface NoteTemplate {
  id: string
  section: MedicalNoteSection
  name: string
  body: string
}

export async function listNoteTemplates(): Promise<NoteTemplate[]> {
  const { data, error } = await supabase
    .from('medical_note_template')
    .select('id, section, name, body')
    .order('name')
  if (error) throw error
  return (data ?? []) as NoteTemplate[]
}

export async function createNoteTemplate(
  payload: { section: MedicalNoteSection; name: string; body: string },
): Promise<void> {
  const { error } = await supabase.from('medical_note_template').insert({
    clinic_id: getCurrentClinicId(),
    section: payload.section,
    name: payload.name.trim(),
    body: payload.body,
  })
  if (error) {
    if (error.code === '23505') throw new Error('Já existe um modelo com esse nome nesta seção.')
    throw error
  }
}

export async function deleteNoteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('medical_note_template').delete().eq('id', id)
  if (error) throw error
}
