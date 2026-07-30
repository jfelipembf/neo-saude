import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import type { OdontoProcedure } from '@/types/domain'

type OdontoProcedureRow = { id: string; clinic_id: string; name: string; price: number }

/** Dados do formulário de novo serviço (id nasce no banco). */
export interface NewOdontoProcedure {
  name: string
  price: number
}

export async function listOdontoProcedures(): Promise<OdontoProcedure[]> {
  const { data, error } = await supabase
    .from('odonto_procedure')
    .select('id, clinic_id, name, price')
    .eq('clinic_id', getCurrentClinicId())
    .order('name')
  if (error) throw error
  return (data as OdontoProcedureRow[]).map(r => ({
    id: r.id,
    clinicId: r.clinic_id,
    name: r.name,
    price: Number(r.price),
  }))
}

export async function addOdontoProcedure(payload: NewOdontoProcedure): Promise<void> {
  const { error } = await supabase
    .from('odonto_procedure')
    .insert({ clinic_id: getCurrentClinicId(), name: payload.name, price: payload.price })
  if (error) throw error
}

export async function updateOdontoProcedure(id: string, payload: NewOdontoProcedure): Promise<void> {
  const { error } = await supabase
    .from('odonto_procedure')
    .update({ name: payload.name, price: payload.price })
    .eq('id', id)
  if (error) throw error
}
