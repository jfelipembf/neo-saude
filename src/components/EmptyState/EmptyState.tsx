import type { ReactNode } from 'react'
import styles from './EmptyState.module.scss'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  /** Ação sugerida (ex.: botão "Novo paciente"). */
  action?: ReactNode
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
