import type { ReactNode } from 'react'
import styles from './SegmentedControl.module.scss'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  /** Ícone opcional exibido antes do rótulo. */
  icon?: ReactNode
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[]
  value: T
  // NoInfer: T é inferido só de `options`/`value` (a união estreita), nunca do onChange —
  // evita que passar `setState` (Dispatch<SetStateAction<T>>) faça T cair no constraint `string`.
  onChange: (value: NoInfer<T>) => void
}

/** Grupo de botões mutuamente exclusivos (ex.: Manhã / Tarde / Noite). */
export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div className={styles.group}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`${styles.segment} ${value === opt.value ? styles['segment--active'] : ''}`}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  )
}
