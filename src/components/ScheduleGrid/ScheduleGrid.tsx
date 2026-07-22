import { Fragment } from 'react'
import { ClassCard } from './ClassCard'
import { DAY_OF_WEEK_SHORT } from '@/constants'
import { toShortDate } from '@/utils/date'
import type { ScheduleSlot } from '@/types/domain'
import styles from './ScheduleGrid.module.scss'

// Ordem das colunas na visão semana: Seg…Sáb, Dom (índices do getDay, 0 = Dom).
const WEEK_COLS = [1, 2, 3, 4, 5, 6, 0]

export type ScheduleTurn = 'all' | 'morning' | 'afternoon' | 'night'
export type ScheduleView = 'week' | 'day'

interface ScheduleGridProps {
  slots: ScheduleSlot[]
  view: ScheduleView
  turn: ScheduleTurn
  /** Dia mostrado na visão "Dia" (índice do getDay, 0 = Dom). */
  referenceWeekday: number
  /** Data de referência da semana visível — calcula a data de cada coluna. */
  referenceDate?: Date
  onSelect?: (slot: ScheduleSlot) => void
  /** Mostra a setinha de hover nos cards clicáveis. */
  showArrow?: boolean
  /** Oculta a linha de sala nos cards. */
  hideArea?: boolean
}

function inTurn(turn: ScheduleTurn, startTime: string) {
  const h = Number(startTime.split(':')[0])
  if (turn === 'morning')   return h < 12
  if (turn === 'afternoon') return h >= 12 && h < 18
  if (turn === 'night')     return h >= 18
  return true
}

// Faixa de horário base exibida sempre (07:00 → 19:00); sessões fora dela criam linhas extras.
const HOUR_START = 7, HOUR_END = 19
const BASE_TIMES = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => `${String(HOUR_START + i).padStart(2, '0')}:00`)

function weekdayDate(ref: Date, weekday: number): string {
  const d = new Date(ref)
  d.setDate(d.getDate() + (weekday - d.getDay()))
  return toShortDate(d)
}

/** Grade de horários: colunas por dia, linhas por hora, cards na cor da atividade. */
export function ScheduleGrid({
  slots, view, turn, referenceWeekday, referenceDate,
  onSelect, showArrow, hideArea,
}: ScheduleGridProps) {
  const dayCols = view === 'day' ? [referenceWeekday] : WEEK_COLS
  const today = new Date().getDay()   // destaca a coluna do dia atual
  const visible = slots.filter(s => inTurn(turn, s.startTime) && dayCols.includes(s.weekday))
  // 07–19 fixo + qualquer horário de sessão fora da faixa, filtrado pelo turno.
  const times = [...new Set([...BASE_TIMES, ...visible.map(s => s.startTime)])]
    .filter(t => inTurn(turn, t))
    .sort()

  const at = (weekday: number, time: string) =>
    visible.filter(s => s.weekday === weekday && s.startTime === time)

  return (
    <div className={styles.scroll}>
      <div className={`${styles.grid} ${view === 'day' ? styles['grid--dia'] : ''}`}>
        <div className={styles.corner} />
        {dayCols.map(wd => (
          <div key={wd} className={`${styles.dayHead} ${wd === today ? styles.dayToday : ''}`}>
            <span className={styles.dayLabel}>{DAY_OF_WEEK_SHORT[wd]}</span>
            {referenceDate && <span className={styles.dayDate}>{weekdayDate(referenceDate, wd)}</span>}
          </div>
        ))}

        {times.map(time => (
          <Fragment key={time}>
            <div className={styles.timeCell}>{time}</div>
            {dayCols.map(wd => (
              <div key={`${wd}-${time}`} className={`${styles.cell} ${wd === today ? styles.cellToday : ''}`}>
                {at(wd, time).map(s => (
                  <ClassCard
                    key={s.id}
                    slot={s}
                    showArrow={showArrow}
                    onClick={onSelect ? () => onSelect(s) : undefined}
                    hideArea={hideArea}
                  />
                ))}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
