import { supabase } from '@/lib/supabase'
import { getCurrentClinicId, type ClientPayload } from '@/lib/tenant'
import type { Service } from '@/types/domain'

const COLUMNS = 'id, clinic_id, name, modality, price, duration_qty, duration_unit, sessions, weekly_limit, max_installments, description, status'

type ServiceRow = {
  id: string
  clinic_id: string
  name: string
  modality: Service['modality']
  price: number
  duration_qty: number
  duration_unit: Service['durationUnit']
  sessions: number | null
  weekly_limit: number | null
  max_installments: number
  description: string | null
  status: Service['status']
}

function toService(row: ServiceRow): Service {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    modality: row.modality,
    price: Number(row.price),
    durationQty: Number(row.duration_qty),
    durationUnit: row.duration_unit,
    sessions: row.sessions != null ? Number(row.sessions) : undefined,
    weeklyLimit: row.weekly_limit != null ? Number(row.weekly_limit) : undefined,
    maxInstallments: Number(row.max_installments),
    description: row.description ?? undefined,
    status: row.status,
  }
}

export async function listServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('service')
    .select(COLUMNS)
    .eq('clinic_id', getCurrentClinicId())
    .order('name')
  if (error) throw error
  return (data as ServiceRow[]).map(toService)
}

/** Campos editáveis do serviço/contrato. */
export type EditService = ClientPayload<Service>

function toRow(payload: EditService) {
  return {
    name: payload.name,
    modality: payload.modality,
    price: payload.price,
    duration_qty: payload.durationQty,
    duration_unit: payload.durationUnit,
    sessions: payload.sessions ?? null,
    weekly_limit: payload.weeklyLimit ?? null,
    max_installments: payload.maxInstallments,
    description: payload.description ?? null,
    status: payload.status,
  }
}

export async function addService(payload: EditService): Promise<void> {
  const { error } = await supabase
    .from('service')
    .insert({ clinic_id: getCurrentClinicId(), ...toRow(payload) })
  if (error) throw error
}

export async function updateService(id: string, payload: EditService): Promise<void> {
  const { error } = await supabase.from('service').update(toRow(payload)).eq('id', id)
  if (error) throw error
}
