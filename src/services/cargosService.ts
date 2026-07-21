import { MOCK_CARGOS } from '@/mocks/cargos'
import type { Role } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// vira a tabela `cargos` (paginas como array/jsonb) com as MESMAS assinaturas.
export async function listCargos(): Promise<Role[]> {
  return MOCK_CARGOS
}

/** Campos editáveis do cargo. */
export type EditRole = Omit<Role, 'id'>

let proximoId = 100

/** Cria (id null) ou atualiza um cargo. */
export async function saveCargo(id: string | null, dados: EditRole): Promise<void> {
  if (id) {
    const cargo = MOCK_CARGOS.find(c => c.id === id)
    if (cargo) Object.assign(cargo, dados)
    return
  }
  MOCK_CARGOS.push({ id: `c${proximoId++}`, ...dados })
}
