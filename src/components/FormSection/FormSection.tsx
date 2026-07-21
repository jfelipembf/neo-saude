import type { ReactNode } from 'react'
import styles from './FormSection.module.scss'

interface FormSectionProps {
  title: string
  description?: string
  /** Ações no canto do cabeçalho (ex.: Toggle de status). */
  actions?: ReactNode
  children: ReactNode
}

/** Cartão de seção de formulário com título, descrição e ações opcionais. */
export function FormSection({ title, description, actions, children }: FormSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <div>
          <h3 className={styles.title}>{title}</h3>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      <div className={styles.body}>{children}</div>
    </section>
  )
}
