import type { ReactNode } from 'react'
import styles from './StatsCard.module.scss'

interface StatsCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  /** Texto auxiliar (ex.: "+12% vs. mês anterior"). */
  hint?: string
  /** Tom do hint: positivo (verde), negativo (vermelho) ou neutro. */
  trend?: 'up' | 'down' | 'neutral'
  /** Meta do período (ex.: 20 ou "R$ 15.000") — exibe barra de progresso na base. */
  meta?: string | number
  /** Progresso da meta em % (0–100). Se omitido e value/meta forem numéricos, é calculado. */
  progresso?: number
}

export function StatsCard({ label, value, icon, hint, trend = 'neutral', meta, progresso }: StatsCardProps) {
  const pctAuto = typeof value === 'number' && typeof meta === 'number' && meta > 0
    ? Math.round((value / meta) * 100)
    : 0
  const pct = Math.min(100, Math.max(0, progresso ?? pctAuto))

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        {icon && <div className={styles.icon}>{icon}</div>}
      </div>
      <span className={styles.value}>{value}</span>
      {hint && <span className={`${styles.hint} ${styles[`hint--${trend}`]}`}>{hint}</span>}
      {meta !== undefined && (
        <div className={styles.meta}>
          <div className={styles.metaRow}>
            <span>Meta: {meta}</span>
            <span className={styles.metaPct}>{pct}%</span>
          </div>
          <div
            className={styles.bar}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progresso da meta de ${label}`}
          >
            <span className={styles.barFill} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}
