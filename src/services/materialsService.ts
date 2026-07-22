import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { brToIsoDate, isoToBrDate } from '@/utils/date'
import type { Material } from '@/types/domain'

const COLUMNS = 'id, clinic_id, name, photo_url, in_stock, min_quantity, expiry_date, notes'

type MaterialRow = {
  id: string
  clinic_id: string
  name: string
  photo_url: string | null
  in_stock: number
  min_quantity: number
  expiry_date: string | null
  notes: string | null
}

function toMaterial(row: MaterialRow): Material {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    photo: row.photo_url ?? undefined,
    inStock: Number(row.in_stock),
    minQuantity: Number(row.min_quantity),
    expiryDate: isoToBrDate(row.expiry_date),
    notes: row.notes ?? undefined,
  }
}

/** Dados do formulário de novo material (id nasce aqui). */
export interface NewMaterial {
  name: string
  photo?: string
  inStock: number
  minQuantity: number
  expiryDate?: string      // dd/mm/aaaa
  notes?: string
}

function toRow(payload: NewMaterial) {
  return {
    name: payload.name,
    photo_url: payload.photo ?? null,
    in_stock: payload.inStock,
    min_quantity: payload.minQuantity,
    expiry_date: brToIsoDate(payload.expiryDate),
    notes: payload.notes ?? null,
  }
}

export async function listMaterials(): Promise<Material[]> {
  const { data, error } = await supabase
    .from('material')
    .select(COLUMNS)
    .eq('clinic_id', getCurrentClinicId())
    .order('name')
  if (error) throw error
  return (data as MaterialRow[]).map(toMaterial)
}

/** Cadastra um material novo. */
export async function addMaterial(payload: NewMaterial): Promise<void> {
  const { error } = await supabase
    .from('material')
    .insert({ clinic_id: getCurrentClinicId(), ...toRow(payload) })
  if (error) throw error
}

/** Atualiza um material. */
export async function updateMaterial(id: string, payload: NewMaterial): Promise<void> {
  const { error } = await supabase.from('material').update(toRow(payload)).eq('id', id)
  if (error) throw error
}
