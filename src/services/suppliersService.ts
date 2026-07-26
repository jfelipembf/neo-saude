import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { signAssetUrls } from '@/lib/storage'
import { cnpjToDb, phoneToDb, cepToDb, ufToDb } from '@/utils/text'
import type { Supplier } from '@/types/domain'

const COLUMNS = 'id, clinic_id, name, photo_url, cnpj, phone, email, whatsapp, cep, state, city, neighborhood, street, number'

type SupplierRow = {
  id: string
  clinic_id: string
  name: string
  photo_url: string | null
  cnpj: string | null
  phone: string | null
  email: string | null
  whatsapp: string | null
  cep: string | null
  state: string | null
  city: string | null
  neighborhood: string | null
  street: string | null
  number: string | null
}

function toSupplier(row: SupplierRow): Supplier {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    photo: row.photo_url ?? undefined,
    cnpj: row.cnpj ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    cep: row.cep ?? undefined,
    state: row.state ?? undefined,
    city: row.city ?? undefined,
    neighborhood: row.neighborhood ?? undefined,
    street: row.street ?? undefined,
    number: row.number ?? undefined,
  }
}

/** Dados do formulário de novo fornecedor (id nasce no banco). */
export interface NewSupplier {
  name: string
  photo?: string
  cnpj?: string
  phone?: string
  /** Para onde vai o pedido de orçamento quando um material está acabando. */
  email?: string
  whatsapp?: string
  cep?: string
  state?: string
  city?: string
  neighborhood?: string
  street?: string
  number?: string
}

function toRow(payload: NewSupplier) {
  return {
    name: payload.name,
    photo_url: payload.photo ?? null,
    cnpj: cnpjToDb(payload.cnpj),
    phone: phoneToDb(payload.phone),
    email: payload.email?.trim() || null,
    whatsapp: phoneToDb(payload.whatsapp),
    cep: cepToDb(payload.cep),
    state: ufToDb(payload.state),
    city: payload.city ?? null,
    neighborhood: payload.neighborhood ?? null,
    street: payload.street ?? null,
    number: payload.number ?? null,
  }
}

export async function listSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('supplier')
    .select(COLUMNS)
    .eq('clinic_id', getCurrentClinicId())
    .order('name')
  if (error) throw error
  const rows = data as SupplierRow[]
  // photo_url guarda o PATH do bucket privado — assina o lote de uma vez.
  const signed = await signAssetUrls(rows.map(r => r.photo_url))
  return rows.map(row => {
    const s = toSupplier(row)
    s.photo = row.photo_url ? signed.get(row.photo_url) : undefined
    return s
  })
}

/** Cadastra um fornecedor novo. */
export async function addSupplier(payload: NewSupplier): Promise<void> {
  const { error } = await supabase
    .from('supplier')
    .insert({ clinic_id: getCurrentClinicId(), ...toRow(payload) })
  if (error) throw error
}

/** Atualiza um fornecedor. */
export async function updateSupplier(id: string, payload: NewSupplier): Promise<void> {
  const { error } = await supabase.from('supplier').update(toRow(payload)).eq('id', id)
  if (error) throw error
}
