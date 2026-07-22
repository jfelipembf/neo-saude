import { MOCK_USER } from '@/mocks/user'
import type { UserProfile } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('perfis')… mantendo a MESMA assinatura.
// O e-mail vem da sessão (auth) e sobrepõe o do mock quando existir.
export async function getCurrentUser(email?: string): Promise<UserProfile> {
  return email ? { ...MOCK_USER, email } : MOCK_USER
}
