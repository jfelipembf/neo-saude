import { supabase } from '@/lib/supabase'
import { getCurrentClinicId, type ClientPayload } from '@/lib/tenant'
import type { Insurance } from '@/types/domain'

const COLUMNS = 'id, clinic_id, name, ans, phone, email, payout_days, notes, status'

type InsuranceRow = {
  id: string
  clinic_id: string
  name: string
  ans: string | null
  phone: string | null
  email: string | null
  payout_days: number | null
  notes: string | null
  status: Insurance['status']
}

function toInsurance(row: InsuranceRow): Insurance {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    ans: row.ans ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    payoutDays: row.payout_days ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status,
  }
}

export async function listInsurances(): Promise<Insurance[]> {
  const { data, error } = await supabase
    .from('insurance')
    .select(COLUMNS)
    .eq('clinic_id', getCurrentClinicId())
    .order('name')
  if (error) throw error
  return (data as InsuranceRow[]).map(toInsurance)
}

/** Campos editáveis do convênio. */
export type EditInsurance = ClientPayload<Insurance>

function toRow(payload: EditInsurance) {
  return {
    name: payload.name,
    ans: payload.ans ?? null,
    phone: payload.phone ?? null,
    email: payload.email ?? null,
    payout_days: payload.payoutDays ?? null,
    notes: payload.notes ?? null,
    status: payload.status,
  }
}

export async function addInsurance(payload: EditInsurance): Promise<void> {
  const { error } = await supabase
    .from('insurance')
    .insert({ clinic_id: getCurrentClinicId(), ...toRow(payload) })
  if (error) throw error
}

export async function updateInsurance(id: string, payload: EditInsurance): Promise<void> {
  const { error } = await supabase.from('insurance').update(toRow(payload)).eq('id', id)
  if (error) throw error
}
