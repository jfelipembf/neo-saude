import type { ReactNode } from 'react'
import styles from './SegmentedControl.module.scss'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  /** Ícone opcional exibido antes do rótulo. */
  icon?: ReactNode
}

export type SegmentedControlSize = 'sm' | 'md' | 'lg'

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[]
  value: T
  // NoInfer: T é inferido só de `options`/`value` (a união estreita), nunca do onChange —
  // evita que passar `setState` (Dispatch<SetStateAction<T>>) faça T cair no constraint `string`.
  onChange: (value: NoInfer<T>) => void
  /** Mesmos 3 portes de Button/Input/Select ($ctrl-h-sm/md/lg) — para alinhar
   *  com um Input/Button vizinho na mesma barra de filtros. */
  size?: SegmentedControlSize
  /**
   * QUEBRA EM VÁRIAS LINHAS quando não couber na largura disponível.
   *
   * Por padrão o grupo é uma fileira rígida (`flex-shrink: 0` + `nowrap`), que
   * é o certo numa barra de filtros: "Manhã/Tarde/Noite" nunca deve quebrar.
   * Mas rótulo longo em espaço estreito — "Controlada com medicamento" numa
   * coluna de 400px ou num celular — sai para fora do contêiner, e opção que
   * transborda é opção que o usuário não consegue marcar.
   */
  wrap?: boolean
}

/** Grupo de botões mutuamente exclusivos (ex.: Manhã / Tarde / Noite). */
export function SegmentedControl<T extends string>({
  options, value, onChange, size = 'md', wrap = false,
}: SegmentedControlProps<T>) {
  return (
    <div className={[styles.group, styles[`group--${size}`], wrap ? styles['group--wrap'] : '']
      .filter(Boolean).join(' ')}
    >
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
