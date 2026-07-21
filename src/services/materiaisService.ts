import { MOCK_MATERIAIS } from '@/mocks/materiais'
import type { Material } from '@/types/domain'

/** Dados do formulário de novo material (id nasce aqui). */
export interface NewMaterial {
  nome: string
  foto?: string
  emEstoque: number
  qtdMinima: number
  validade?: string      // dd/mm/aaaa
  observacao?: string
}

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('materiais')… mantendo a MESMA assinatura —
// páginas e hooks não mudam.
export async function listMateriais(): Promise<Material[]> {
  return MOCK_MATERIAIS
}

// Contador de id do mock — no Supabase o id virá do banco.
let proximoId = 100

/** Cadastra um material novo. */
export async function addMaterial(dados: NewMaterial): Promise<void> {
  MOCK_MATERIAIS.push({ id: `m${proximoId++}`, ...dados })
}

/** Atualiza um material (mock: muta o registro em memória). */
export async function updateMaterial(id: string, dados: NewMaterial): Promise<void> {
  const material = MOCK_MATERIAIS.find(m => m.id === id)
  if (material) Object.assign(material, dados)
}
