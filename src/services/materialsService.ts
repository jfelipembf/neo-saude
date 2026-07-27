import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { signAssetUrls } from '@/lib/storage'
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
    supplierIds: [],
  }
}

/** Fornecedores de CADA material do lote, num round-trip só (material_supplier). */
async function supplierIdsByMaterial(clinicId: string): Promise<Map<string, string[]>> {
  const { data, error } = await supabase
    .from('material_supplier')
    .select('material_id, supplier_id')
    .eq('clinic_id', clinicId)
  if (error) throw error
  const byMaterial = new Map<string, string[]>()
  for (const row of (data ?? [])) {
    const list = byMaterial.get(row.material_id) ?? []
    list.push(row.supplier_id)
    byMaterial.set(row.material_id, list)
  }
  return byMaterial
}

/**
 * Regrava o conjunto de fornecedores de UM material (delete-then-insert, mesmo
 * desenho de setPatientTests) — cobre marcar e desmarcar fornecedor num só salvamento.
 */
async function setMaterialSuppliers(materialId: string, supplierIds: string[]): Promise<void> {
  const clinicId = getCurrentClinicId()
  const { error: delError } = await supabase
    .from('material_supplier')
    .delete()
    .eq('material_id', materialId)
    .eq('clinic_id', clinicId)
  if (delError) throw delError
  if (supplierIds.length === 0) return
  const rows = supplierIds.map(supplierId => ({ clinic_id: clinicId, material_id: materialId, supplier_id: supplierId }))
  const { error } = await supabase.from('material_supplier').insert(rows)
  if (error) throw error
}

/** Dados do formulário de novo material (id nasce aqui). */
export interface NewMaterial {
  name: string
  photo?: string
  inStock: number
  minQuantity: number
  expiryDate?: string      // dd/mm/aaaa
  notes?: string
  /** Fornecedores deste material — pode ter mais de um. */
  supplierIds?: string[]
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
  const clinicId = getCurrentClinicId()
  const [{ data, error }, supplierIds] = await Promise.all([
    supabase.from('material').select(COLUMNS).eq('clinic_id', clinicId).order('name'),
    supplierIdsByMaterial(clinicId),
  ])
  if (error) throw error
  const rows = data as MaterialRow[]
  // photo_url guarda o PATH do bucket privado — assina o lote de uma vez.
  const signed = await signAssetUrls(rows.map(r => r.photo_url))
  return rows.map(row => {
    const m = toMaterial(row)
    m.photo = row.photo_url ? signed.get(row.photo_url) : undefined
    m.supplierIds = supplierIds.get(row.id) ?? []
    return m
  })
}

/** Cadastra um material novo. */
export async function addMaterial(payload: NewMaterial): Promise<void> {
  const { data, error } = await supabase
    .from('material')
    .insert({ clinic_id: getCurrentClinicId(), ...toRow(payload) })
    .select('id')
    .single()
  if (error) throw error
  await setMaterialSuppliers(data.id, payload.supplierIds ?? [])
}

/** Atualiza um material. */
export async function updateMaterial(id: string, payload: NewMaterial): Promise<void> {
  const { error } = await supabase.from('material').update(toRow(payload)).eq('id', id)
  if (error) throw error
  await setMaterialSuppliers(id, payload.supplierIds ?? [])
}

/** Fornecedor de um material, com o contato que a Cibelly usa para orçamento. */
export interface MaterialSupplierContact {
  id: string
  nome: string
  email?: string
  whatsapp?: string
  telefone?: string
}

/** Material com estoque e fornecedores — o que a assistente de voz consulta. */
export interface MaterialWithSuppliers {
  id: string
  nome: string
  estoque: number
  minimo: number
  /** Já calculado no banco: estoque <= mínimo. */
  acabando: boolean
  observacoes?: string
  fornecedores: MaterialSupplierContact[]
}

/**
 * Materiais com estoque e fornecedores, numa leitura só.
 *
 * Via RPC, e não três consultas encadeadas (material → vínculo → fornecedor),
 * porque a resposta é FALADA pela Cibelly: três idas ao banco colocariam
 * latência no meio da frase dela. O `acabando` vem pronto do banco pelo mesmo
 * motivo — ela não precisa comparar número enquanto fala.
 */
export async function listMaterialsWithSuppliers(): Promise<MaterialWithSuppliers[]> {
  const { data, error } = await supabase.rpc('materials_with_suppliers')
  if (error) throw error
  return (data ?? []) as unknown as MaterialWithSuppliers[]
}
