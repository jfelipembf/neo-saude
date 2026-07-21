import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useSession } from '@/context/SessionProvider'
import { getUsuarioLogado } from '@/services/usuarioService'

export function useUsuarioLogado() {
  const { session } = useSession()
  const email = session?.user.email
  return useQuery({ queryKey: queryKeys.usuario.me, queryFn: () => getUsuarioLogado(email) })
}
