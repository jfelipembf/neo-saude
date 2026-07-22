import { supabase } from '@/lib/supabase'
import { getCurrentClinicId, type ClientPayload } from '@/lib/tenant'
import type { ProfessionalCommission } from '@/types/domain'

const COLUMNS = 'clinic_id, professional_id, type, amount, base, payout, payout_day, status, notes'

type CommissionRow = {
  clinic_id: string
  professional_id: string
  type: ProfessionalCommission['type']
  amount: number
  base: ProfessionalCommission['base']
  payout: ProfessionalCommission['payout']
  payout_day: number | null
  status: ProfessionalCommission['status']
  notes: string | null
}

function toCommission(row: CommissionRow): ProfessionalCommission {
  return {
    clinicId: row.clinic_id,
    professionalId: row.professional_id,
    type: row.type,
    amount: Number(row.amount),
    base: row.base,
    payout: row.payout,
    payoutDay: row.payout_day ?? undefined,
    status: row.status,
    notes: row.notes ?? undefined,
  }
}

export async function listCommissions(): Promise<ProfessionalCommission[]> {
  const { data, error } = await supabase
    .from('professional_commission')
    .select(COLUMNS)
    .eq('clinic_id', getCurrentClinicId())
  if (error) throw error
  return (data as CommissionRow[]).map(toCommission)
}

/** Campos editáveis da regra de comissão (o id do profissional é a chave). */
export type EditCommission = Omit<ClientPayload<ProfessionalCommission>, 'professionalId'>

function toRow(payload: EditCommission) {
  return {
    type: payload.type,
    amount: payload.amount,
    base: payload.base,
    payout: payload.payout,
    payout_day: payload.payoutDay ?? null,
    status: payload.status,
    notes: payload.notes ?? null,
  }
}

/** Cria ou atualiza a regra de comissão do profissional (upsert por profissional). */
export async function saveCommission(professionalId: string, payload: EditCommission): Promise<void> {
  const { data: existing, error: findError } = await supabase
    .from('professional_commission')
    .select('id')
    .eq('professional_id', professionalId)
    .maybeSingle()
  if (findError) throw findError

  if (existing) {
    const { error } = await supabase.from('professional_commission').update(toRow(payload)).eq('id', existing.id)
    if (error) throw error
    return
  }
  const { error } = await supabase
    .from('professional_commission')
    .insert({ clinic_id: getCurrentClinicId(), professional_id: professionalId, ...toRow(payload) })
  if (error) throw error
}
