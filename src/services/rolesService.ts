import { MOCK_ROLES } from '@/mocks/roles'
import type { Role } from '@/types/domain'
import { CURRENT_CLINIC, type ClientPayload } from '@/lib/tenant'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// vira a tabela `roles` (paginas como array/jsonb) com as MESMAS assinaturas.
export async function listRoles(): Promise<Role[]> {
  return MOCK_ROLES
}

/** Campos editáveis do cargo. */
export type EditRole = ClientPayload<Role>

let nextId = 100

/** Cria (id null) ou atualiza um cargo. */
export async function saveRole(id: string | null, payload: EditRole): Promise<void> {
  if (id) {
    const role = MOCK_ROLES.find(c => c.id === id)
    if (role) Object.assign(role, payload)
    return
  }
  MOCK_ROLES.push({ id: `c${nextId++}`, clinicId: CURRENT_CLINIC, ...payload })
}
