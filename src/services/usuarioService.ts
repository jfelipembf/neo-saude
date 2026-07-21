import { MOCK_USUARIO } from '@/mocks/usuario'
import type { UsuarioPerfil } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('perfis')… mantendo a MESMA assinatura.
// O e-mail vem da sessão (auth) e sobrepõe o do mock quando existir.
export async function getUsuarioLogado(email?: string): Promise<UsuarioPerfil> {
  return email ? { ...MOCK_USUARIO, email } : MOCK_USUARIO
}
