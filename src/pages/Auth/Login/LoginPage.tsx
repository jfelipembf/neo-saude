import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '@/context/SessionProvider'
import { AUTH_ROUTES, resolveLandingRoute } from '@/constants'
import { AuthLayout } from '@/components/AuthLayout/AuthLayout'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import styles from './LoginPage.module.scss'

export function LoginPage() {
  const { session, signIn, canView } = useSession()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  // Já logado → não mostra o login (ex.: usuário digitou /login na mão).
  // Manda pra primeira página que o cargo consegue ver, não direto pro
  // Dashboard — um cargo sem Dashboard cairia num loop de /sem-acesso.
  if (session) return <Navigate to={resolveLandingRoute(canView)} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = await signIn(email, password)
    setLoading(false)

    if (authError) {
      setError(authError)
      return
    }

    // Volta para a rota que o AuthGuard barrou (ou a primeira que o cargo vê).
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
    navigate(from ?? resolveLandingRoute(canView), { replace: true })
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
