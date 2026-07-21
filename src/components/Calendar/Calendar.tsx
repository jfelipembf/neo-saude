import { useState } from 'react'
import { IconChevronEsquerda, IconChevronDireita } from '@/components/icons'
import { toIsoDate } from '@/utils/date'
import styles from './Calendar.module.scss'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface CalendarProps {
  /** Datas (aaaa-mm-dd) que ganham um ponto de marcação (ex.: dias com consulta). */
  markedDates?: string[]
  /** Dia selecionado (aaaa-mm-dd). Hoje é sempre destacado, independente disto. */
  selected?: string
  onSelect?: (isoDate: string) => void
}

/** Calendário mensal (pt-BR): navegação entre meses, hoje destacado, dias marcáveis. */
export function Calendar({ markedDates = [], selected, onSelect }: CalendarProps) {
  const today = new Date()
  const todayIso = toIsoDate(today)

  // Primeiro dia do mês exibido (navegação muda só a "janela", não o hoje).
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const rawLabel = view.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const monthLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)

  // Grade fixa de 6 semanas: começa no domingo da semana do dia 1.
  const start = new Date(view.getFullYear(), view.getMonth(), 1 - view.getDay())
  const cells = Array.from({ length: 42 }, (_, i) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
  )

  function changeMonth(delta: number) {
    setView(v => new Date(v.getFullYear(), v.getMonth() + delta, 1))
  }

  return (
    <div className={styles.calendar}>
      <header className={styles.header}>
        <button type="button" className={styles.navBtn} onClick={() => changeMonth(-1)} aria-label="Mês anterior">
          <IconChevronEsquerda />
        </button>
        <span className={styles.month}>{monthLabel}</span>
        <button type="button" className={styles.navBtn} onClick={() => changeMonth(1)} aria-label="Próximo mês">
          <IconChevronDireita />
        </button>
      </header>

      <div className={styles.weekdays}>
        {WEEKDAYS.map(w => <span key={w}>{w}</span>)}
      </div>

      <div className={styles.grid}>
        {cells.map(d => {
          const iso = toIsoDate(d)
          const classes = [
            styles.day,
            d.getMonth() !== view.getMonth() ? styles['day--outside'] : '',
            iso === todayIso ? styles['day--today'] : '',
            selected === iso && iso !== todayIso ? styles['day--selected'] : '',
          ].filter(Boolean).join(' ')

          return (
            <button key={iso} type="button" className={classes} onClick={() => onSelect?.(iso)}>
              {d.getDate()}
              {markedDates.includes(iso) && <span className={styles.dot} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
