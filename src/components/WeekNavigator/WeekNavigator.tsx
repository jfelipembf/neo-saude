import { IconChevronEsquerda, IconChevronDireita } from '@/components/icons'
import { DAY_OF_WEEK_SHORT } from '@/constants'
import { toShortDate } from '@/utils/date'
import styles from './WeekNavigator.module.scss'

function startOfWeek(d: Date) {
  const x = new Date(d)
  const day = x.getDay()
  x.setDate(x.getDate() + (day === 0 ? -6 : 1 - day))   // segunda-feira
  x.setHours(0, 0, 0, 0)
  return x
}

interface WeekNavigatorProps {
  date: Date
  view: 'week' | 'day'
  onChange: (date: Date) => void
}

/** Navegação ‹ período › (semana ou dia). */
export function WeekNavigator({ date, view, onChange }: WeekNavigatorProps) {
  const step = view === 'day' ? 1 : 7

  function shift(dir: number) {
    const x = new Date(date)
    x.setDate(x.getDate() + dir * step)
    onChange(x)
  }

  let label: string
  if (view === 'day') {
    label = `${DAY_OF_WEEK_SHORT[date.getDay()]}, ${toShortDate(date)}`
  } else {
    const inicio = startOfWeek(date)
    const fim = new Date(inicio)
    fim.setDate(inicio.getDate() + 6)
    label = `${toShortDate(inicio)} – ${toShortDate(fim)}`
  }

  return (
    <div className={styles.nav}>
      <button type="button" className={styles.btn} onClick={() => shift(-1)} aria-label="Anterior">
        <IconChevronEsquerda />
      </button>
      <span className={styles.label}>{label}</span>
      <button type="button" className={styles.btn} onClick={() => shift(1)} aria-label="Próximo">
        <IconChevronDireita />
      </button>
    </div>
  )
}
