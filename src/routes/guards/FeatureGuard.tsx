import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '@/context/SessionProvider'
import { SYSTEM_ROUTES } from '@/constants'
import type { AppPage } from '@/types/domain'

/**
 * Bloqueia uma rota quando o cargo não pode VER a feature. Redireciona para a
 * página "sem acesso" — que fica dentro do AppLayout, mas é a única rota do
 * bloco SEM FeatureGuard, então não há loop de redirect.
 * Roda depois do AuthGuard, então aqui já há sessão.
 */
export function FeatureGuard({ feature, children }: { feature: AppPage; children: ReactNode }) {
  const { canView } = useSession()
  if (!canView(feature)) {
    return <Navigate to={SYSTEM_ROUTES.UNAUTHORIZED} replace />
  }
  return <>{children}</>
}
