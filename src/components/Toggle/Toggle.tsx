import styles from './Toggle.module.scss'

interface ToggleProps {
  /** Rótulo exibido antes do interruptor. */
  label?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

/** Interruptor liga/desliga (ex.: status ativo de um cadastro). */
export function Toggle({ label, checked, onChange, disabled }: ToggleProps) {
  return (
    <span className={styles.wrap}>
      {label && <span className={styles.label}>{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`${styles.track} ${checked ? styles['track--on'] : ''}`}
        onClick={() => onChange(!checked)}
        disabled={disabled}
      >
        <span className={styles.thumb} />
      </button>
    </span>
  )
}
