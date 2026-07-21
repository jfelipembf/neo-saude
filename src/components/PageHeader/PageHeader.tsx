import type { ReactNode } from 'react'
import styles from './PageHeader.module.scss'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Ícone exibido na frente do título (de `@/components/icons`). */
  icon?: ReactNode
  /** Ações à direita (botões, filtros). */
  actions?: ReactNode
}

/** Cabeçalho discreto de página (estilo breadcrumb): ícone + título + subtítulo. */
export function PageHeader({ title, subtitle, icon, actions }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.heading}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <div className={styles.texts}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}
