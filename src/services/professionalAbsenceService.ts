import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import type { Row } from '@/lib/db'
import type { ProfessionalAbsence } from '@/types/domain'

type AbsenceRow = Pick<Row<'professional_absence'>, 'id' | 'professional_id' | 'start_date' | 'end_date' | 'reason'>

function toAbsence(row: AbsenceRow): ProfessionalAbsence {
  return {
    id: row.id,
    professionalId: row.professional_id,
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason ?? undefined,
  }
}

export interface NewAbsence {
  startDate: string
  endDate: string
  reason?: string
}

/** Períodos de ausência do profissional (viagem, férias, atestado) — aba
 *  Agenda > Disponibilidade do perfil. */
export async function listAbsences(professionalId: string): Promise<ProfessionalAbsence[]> {
  const { data, error } = await supabase
    .from('professional_absence')
    .select('id, professional_id, start_date, end_date, reason')
    .eq('professional_id', professionalId)
    .order('start_date', { ascending: false })
  if (error) throw error
  return (data as AbsenceRow[]).map(toAbsence)
}

export async function addAbsence(professionalId: string, payload: NewAbsence): Promise<void> {
  const { error } = await supabase
    .from('professional_absence')
    .insert({
      clinic_id: getCurrentClinicId(),
      professional_id: professionalId,
      start_date: payload.startDate,
      end_date: payload.endDate,
      reason: payload.reason || null,
    })
  if (error) throw error
}

export async function removeAbsence(id: string): Promise<void> {
  const { error } = await supabase.from('professional_absence').delete().eq('id', id)
  if (error) throw error
}
