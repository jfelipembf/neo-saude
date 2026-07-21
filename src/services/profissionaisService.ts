import { MOCK_PROFISSIONAIS } from '@/mocks/profissionais'
import type { Profissional } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('profissionais')… mantendo a MESMA assinatura.
export async function listProfissionais(): Promise<Profissional[]> {
  return MOCK_PROFISSIONAIS
}
