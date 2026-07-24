import { DAY_OF_WEEK_SHORT } from '@/constants/dates'
import styles from './DayPicker.module.scss'

interface DayPickerProps {
  /** Dias selecionados — índices de Date.getDay() (0=Dom … 6=Sáb). */
  value: number[]
  onChange: (days: number[]) => void
  label?: string
  /** false = seleção única (clicar num dia TROCA o selecionado, não acumula)
   *  — usado ao editar uma sessão já existente (Turmas: 1 dia = 1 sessão). */
  multiple?: boolean
}

const DAYS = [0, 1, 2, 3, 4, 5, 6]

/** Seleção de dias da semana em chips (Turmas: dia(s) em que a sessão acontece). */
export function DayPicker({ value, onChange, label, multiple = true }: DayPickerProps) {
  function toggle(day: number) {
    if (!multiple) { onChange([day]); return }
    onChange(
      value.includes(day)
        ? value.filter(d => d !== day)
        : [...value, day].sort((a, b) => a - b),
    )
  }

  return (
    <div className={styles.wrap}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.days}>
        {DAYS.map(day => (
          <button
            key={day}
            type="button"
            className={`${styles.day} ${value.includes(day) ? styles['day--on'] : ''}`}
            onClick={() => toggle(day)}
            aria-pressed={value.includes(day)}
          >
            {DAY_OF_WEEK_SHORT[day]}
          </button>
        ))}
      </div>
    </div>
  )
}
