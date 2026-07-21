import { MOCK_GRADE_SESSOES } from '@/mocks/gradeSessoes'
import type { GradeSessao } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('grade_sessoes')… mantendo a MESMA assinatura.
export async function listGradeSessoes(): Promise<GradeSessao[]> {
  return MOCK_GRADE_SESSOES
}
