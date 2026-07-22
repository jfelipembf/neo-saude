import { MOCK_MATERIALS } from '@/mocks/materials'
import type { Material } from '@/types/domain'
import { CURRENT_CLINIC } from '@/lib/tenant'

/** Dados do formulário de novo material (id nasce aqui). */
export interface NewMaterial {
  name: string
  photo?: string
  inStock: number
  minQuantity: number
  expiryDate?: string      // dd/mm/aaaa
  notes?: string
}

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('materials')… mantendo a MESMA assinatura —
// páginas e hooks não mudam.
export async function listMaterials(): Promise<Material[]> {
  return MOCK_MATERIALS
}

// Contador de id do mock — no Supabase o id virá do banco.
let nextId = 100

/** Cadastra um material novo. */
export async function addMaterial(payload: NewMaterial): Promise<void> {
  MOCK_MATERIALS.push({ id: `m${nextId++}`, clinicId: CURRENT_CLINIC, ...payload })
}

/** Atualiza um material (mock: muta o registro em memória). */
export async function updateMaterial(id: string, payload: NewMaterial): Promise<void> {
  const material = MOCK_MATERIALS.find(m => m.id === id)
  if (material) Object.assign(material, payload)
}
