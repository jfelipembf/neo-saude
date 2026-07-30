import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useSession } from '@/context/SessionProvider'
import { AUTH_ROUTES, resolveLandingRoute } from '@/constants'
import { AuthLayout } from '@/components/AuthLayout/AuthLayout'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import styles from './LoginPage.module.scss'

export function LoginPage() {
  const { session, loading: sessionLoading, signIn, canView } = useSession()
  const location = useLocation()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  // Rota que o AuthGuard barrou, quando houve uma.
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname

  const destino = from ?? resolveLandingRoute(canView)

  // Único ponto que decide o destino — inclusive depois do submit. `signIn()`
  // devolve assim que o Supabase autentica, ANTES do my_session() responder;
  // navegar ali decidiria com `canView` ainda vazio e mandaria todo mundo para
  // /sem-acesso. Esperar `sessionLoading` cair é o que garante que o destino é
  // calculado com as permissões já em mãos.
  if (session && !sessionLoading) return <Navigate to={destino} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = await signIn(email, password)

    if (authError) {
      setError(authError)
      setLoading(false)
      return
    }
    // Sem `setLoading(false)` no sucesso de propósito: o botão fica ocupado até
    // o redirect acontecer, em vez de piscar "pronto" numa tela que vai sumir.
  }

  return (
    <AuthLayout title="Bem-vindo de volta" subtitle="Acesse sua conta para continuar">
      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          label="E-mail"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="voce@clinica.com.br"
          autoComplete="email"
          required
        />
        <Input
          label="Senha"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          error={error ?? undefined}
        />

        <div className={styles.acoesLinha}>
          <Link to={AUTH_ROUTES.FORGOT_PASSWORD} className={styles.esqueci}>
            Esqueci minha senha
          </Link>
        </div>

        <Button type="submit" size="lg" loading={loading}>
          Entrar
        </Button>
      </form>
    </AuthLayout>
  )
}
