import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/AuthLayout/AuthLayout'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { useSession } from '@/context/SessionProvider'
import { AUTH_ROUTES } from '@/constants'
import { IconCheck } from '@/components/icons'
import styles from './ForgotPasswordPage.module.scss'

export function ForgotPasswordPage() {
  const { resetPassword } = useSession()

  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: resetError } = await resetPassword(email)
    setLoading(false)

    if (resetError) {
      setError(resetError)
      return
    }
    setSent(true)
  }

  return (
    <AuthLayout
      title="Esqueceu a senha?"
      subtitle="Informe seu e-mail e enviaremos um link para redefini-la"
    >
      {sent ? (
        <div className={styles.sucesso}>
          <span className={styles.sucessoIcone}><IconCheck /></span>
          <p className={styles.sucessoTexto}>
            Se existir uma conta para <strong>{email}</strong>, você receberá um
            e-mail com o link de recuperação em instantes.
          </p>
          <Link to={AUTH_ROUTES.LOGIN} className={styles.voltar}>
            Voltar para o login
          </Link>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="voce@clinica.com.br"
            autoComplete="email"
            required
            autoFocus
            error={error ?? undefined}
          />

          <Button type="submit" size="lg" loading={loading}>
            Enviar link de recuperação
          </Button>

          <Link to={AUTH_ROUTES.LOGIN} className={styles.voltar}>
            Voltar para o login
          </Link>
        </form>
      )}
    </AuthLayout>
  )
}
