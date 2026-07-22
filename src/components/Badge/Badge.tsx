import styles from './Badge.module.scss'
import { STATUS_MAP } from './statusMap'

export type { BadgeVariant } from './statusMap'

interface BadgeProps {
  /** Status do domínio (ex.: 'scheduled', 'paid') — resolvido via STATUS_MAP. */
  status: string
  /** Rótulo custom (senão usa o do STATUS_MAP ou o próprio status). */
  label?: string
  className?: string
}

export function Badge({ status, label, className }: BadgeProps) {
  const entry = STATUS_MAP[status.toLowerCase()]
  const variant = entry?.variant ?? 'gray'
  const text    = label ?? entry?.label ?? status

  return (
    <span className={`${styles.badge} ${styles[`badge--${variant}`]} ${className ?? ''}`}>
      <span className={styles.dot} />
      {text}
    </span>
  )
}
