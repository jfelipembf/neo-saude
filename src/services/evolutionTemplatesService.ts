import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import type { Json } from '@/types/database.types'
import type { EvolutionTemplate, SoapNote } from '@/types/domain'

// `ActiveStatus` não é exportado de domain.ts — o status vem do próprio tipo
// do modelo, que é a fonte de verdade dele de qualquer forma.
type TemplateStatus = EvolutionTemplate['status']

// Catálogo de MODELOS de evolução (Administrativo → Modelos de evolução) — o
// "um clique" do prontuário: em vez de digitar os mesmos cabeçalhos a cada
// primeira consulta, o profissional escolhe um modelo e edita por cima.
//
// O modelo guarda uma nota no MESMO formato do prontuário (o banco valida os
// dois com a mesma private.is_soap_note), então aplicar é COPIAR `note` por
// cima das seções — sem conversão nenhuma no meio.

const COLUMNS = 'id, clinic_id, name, description, note, is_seed, status'

type TemplateRow = {
  id: string
  clinic_id: string
  name: string
  description: string | null
  // O CHECK `evolution_template_note_shape_ck` garante a forma no banco.
  note: SoapNote
  is_seed: boolean
  status: TemplateStatus
}

function toTemplate(row: TemplateRow): EvolutionTemplate {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    description: row.description ?? undefined,
    note: row.note,
    isSeed: row.is_seed,
    status: row.status,
  }
}

/** Catálogo inteiro (ativos e inativos), em ordem alfabética — a tela do
 *  Administrativo precisa dos inativos para reativá-los; quem só quer o menu
 *  do prontuário filtra por status na tela. */
export async function listEvolutionTemplates(): Promise<EvolutionTemplate[]> {
  const { data, error } = await supabase
    .from('evolution_template')
    .select(COLUMNS)
    .eq('clinic_id', getCurrentClinicId())
    .order('name')
  if (error) throw error
  return (data as TemplateRow[]).map(toTemplate)
}

/** O que o formulário do Administrativo pode mandar. `isSeed` fica FORA de
 *  propósito: a coluna não tem grant de update (senão o cliente desmarcaria a
 *  proteção antes de excluir um modelo de referência). */
export interface EditEvolutionTemplate {
  name: string
  description?: string
  note: SoapNote
  status: TemplateStatus
}

export async function addEvolutionTemplate(payload: EditEvolutionTemplate): Promise<string> {
  const { data, error } = await supabase
    .from('evolution_template')
    .insert({
      clinic_id: getCurrentClinicId(),
      name: payload.name,
      description: payload.description ?? null,
      note: payload.note as Json,
      status: payload.status,
    })
    .select('id')
    .single()
  if (error) {
    // Índice único por (clinic_id, lower(name)): dois "Avaliação inicial" na
    // mesma clínica é erro de digitação, não modelo novo.
    if (error.code === '23505') throw new Error('Já existe um modelo com esse nome.')
    throw error
  }
  return data.id as string
}

export async function updateEvolutionTemplate(id: string, payload: EditEvolutionTemplate): Promise<void> {
  const { error } = await supabase
    .from('evolution_template')
    .update({
      name: payload.name,
      description: payload.description ?? null,
      note: payload.note as Json,
      status: payload.status,
    })
    .eq('id', id)
  if (error) {
    if (error.code === '23505') throw new Error('Já existe um modelo com esse nome.')
    throw error
  }
}

/**
 * Exclui um modelo. A policy de delete exige `is_seed = false` — modelo de
 * referência não se apaga, se INATIVA (status='inactive'), e é a parede do
 * banco que garante isso, não o botão escondido na tela. Um delete que não
 * casa com a policy volta sem erro e sem linha afetada, daí o `count`.
 */
export async function deleteEvolutionTemplate(id: string): Promise<void> {
  const { error, count } = await supabase
    .from('evolution_template')
    .delete({ count: 'exact' })
    .eq('id', id)
  if (error) throw error
  if (!count) {
    throw new Error('Modelo padrão do sistema não pode ser excluído — deixe-o inativo para tirá-lo do menu.')
  }
}
