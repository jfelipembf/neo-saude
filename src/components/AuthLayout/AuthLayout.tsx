import type { ReactNode } from 'react'
import { IconLogo } from '@/components/icons'
import styles from './AuthLayout.module.scss'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  /** Conteúdo do painel direito (formulário da página). */
  children: ReactNode
}

/** Casca das telas de autenticação: imagem à esquerda + painel com logo à direita. */
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className={styles.page}>
      {/* Painel visual à esquerda: só a imagem (some no mobile). */}
      <aside className={styles.hero} aria-hidden="true" />

      <main className={styles.painel}>
        <div className={styles.conteudo}>
          <div className={styles.brand}>
            <span className={styles.logo}><IconLogo /></span>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>

          {children}
        </div>
      </main>
    </div>
  )
}
