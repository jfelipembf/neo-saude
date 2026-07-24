import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import type { Row } from '@/lib/db'
import type { ProfessionalAvailabilitySlot } from '@/types/domain'

type AvailabilityRow = Pick<Row<'professional_availability'>, 'weekday' | 'hour'>

/** Grade recorrente do profissional: cada linha é uma célula disponível
 *  (Seg-Sáb, hora cheia) — ausência de linha já é indisponível. Vale igual
 *  toda semana (sem exceção por semana). */
export async function listAvailabilityTemplate(professionalId: string): Promise<ProfessionalAvailabilitySlot[]> {
  const { data, error } = await supabase
    .from('professional_availability')
    .select('weekday, hour')
    .eq('professional_id', professionalId)
  if (error) throw error
  return (data as AvailabilityRow[]).map(r => ({ weekday: r.weekday, hour: r.hour }))
}

/**
 * Substitui a grade inteira pelo conjunto informado — a UI edita em rascunho
 * local (vários cliques) e só chama isto quando o usuário aperta "Salvar"
 * (mesmo padrão de replaceEducation/replaceExperiences em
 * professionalsService.ts: apaga tudo e reinsere o conjunto novo).
 */
export async function setAvailabilityTemplate(
  professionalId: string,
  slots: ProfessionalAvailabilitySlot[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('professional_availability')
    .delete()
    .eq('professional_id', professionalId)
  if (deleteError) throw deleteError

  if (slots.length === 0) return

  const clinicId = getCurrentClinicId()
  const { error: insertError } = await supabase
    .from('professional_availability')
    .insert(slots.map(s => ({ clinic_id: clinicId, professional_id: professionalId, weekday: s.weekday, hour: s.hour })))
  if (insertError) throw insertError
}
