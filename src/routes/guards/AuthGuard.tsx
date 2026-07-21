import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '@/context/SessionProvider'
import { AUTH_ROUTES } from '@/constants'
import { PageLoader } from '@/components/PageLoader/PageLoader'

/**
 * Bloqueia rotas autenticadas: sem sessão → redireciona para o login,
 * guardando a rota de origem para voltar após autenticar.
 */
export function AuthGuard() {
  const { session, loading } = useSession()
  const location = useLocation()

  // Sessão persistida ainda resolvendo — não decide nada antes disso,
  // senão usuário logado veria um flash da tela de login a cada reload.
  if (loading) return <PageLoader />

  if (!session) {
    return <Navigate to={AUTH_ROUTES.LOGIN} state={{ from: location }} replace />
  }

  return <Outlet />
}
