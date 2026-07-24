import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import type { Row } from '@/lib/db'
import type { ProfessionalBlockedSlot } from '@/types/domain'

type BlockedSlotRow = Pick<Row<'professional_blocked_slot'>, 'date' | 'hour' | 'reason'>

/** Horas bloqueadas do profissional numa janela de datas (Agenda geral). */
export async function listBlockedSlots(
  professionalId: string,
  fromIso: string,
  toIso: string,
): Promise<ProfessionalBlockedSlot[]> {
  const { data, error } = await supabase
    .from('professional_blocked_slot')
    .select('date, hour, reason')
    .eq('professional_id', professionalId)
    .gte('date', fromIso)
    .lte('date', toIso)
  if (error) throw error
  return (data as BlockedSlotRow[]).map(r => ({ date: r.date, hour: r.hour, reason: r.reason ?? undefined }))
}

/**
 * Substitui os bloqueios das datas informadas pelo conjunto novo — mesmo
 * padrão de setAvailabilityTemplate: apaga só as datas em jogo (não mexe em
 * bloqueios de outras datas) e reinsere o que ficou marcado. `reason` vale
 * para o lote inteiro — é o motivo único digitado no ConfirmDialog.
 */
export async function saveBlockedSlots(
  professionalId: string,
  dates: string[],
  blocks: { date: string; hour: number }[],
  reason?: string,
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('professional_blocked_slot')
    .delete()
    .eq('professional_id', professionalId)
    .in('date', dates)
  if (deleteError) throw deleteError

  if (blocks.length === 0) return

  const clinicId = getCurrentClinicId()
  const { error: insertError } = await supabase
    .from('professional_blocked_slot')
    .insert(blocks.map(b => ({
      clinic_id: clinicId,
      professional_id: professionalId,
      date: b.date,
      hour: b.hour,
      reason: reason?.trim() || null,
    })))
  if (insertError) throw insertError
}
