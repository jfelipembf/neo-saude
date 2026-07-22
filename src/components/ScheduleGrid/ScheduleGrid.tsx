import { Fragment } from 'react'
import { ClassCard } from './ClassCard'
import { DAY_OF_WEEK_SHORT } from '@/constants'
import { toIsoDate, toShortDate } from '@/utils/date'
import type { AgendaAppointment, AppointmentStatus } from '@/types/domain'
import styles from './ScheduleGrid.module.scss'

// Ordem das colunas na visão semana: Seg…Sáb, Dom (índices do getDay, 0 = Dom).
const WEEK_COLS = [1, 2, 3, 4, 5, 6, 0]

export type ScheduleTurn = 'all' | 'morning' | 'afternoon' | 'night'
export type ScheduleView = 'week' | 'day'

interface ScheduleGridProps {
  appointments: AgendaAppointment[]
  view: ScheduleView
  turn: ScheduleTurn
  /** Data de referência: define a semana visível (e o dia, na visão "Dia"). */
  referenceDate: Date
  onSelect?: (appointment: AgendaAppointment) => void
  /** Registra o desfecho (compareceu/faltou/cancelou) pelos botões do card. */
  onSetStatus?: (appointment: AgendaAppointment, status: AppointmentStatus) => void
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

// Faixa de horário base exibida sempre (07:00 → 19:00); consultas fora dela criam linhas extras.
const HOUR_START = 7, HOUR_END = 19
const BASE_TIMES = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => `${String(HOUR_START + i).padStart(2, '0')}:00`)

/** A data (Date) da coluna `weekday` dentro da semana de `ref`. */
function dateOfWeekday(ref: Date, weekday: number): Date {
  return new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + (weekday - ref.getDay()))
}

/** Grade de horários: colunas por dia (datas reais), linhas por hora, cards na cor da atividade. */
export function ScheduleGrid({
  appointments, view, turn, referenceDate,
  onSelect, onSetStatus, showArrow, hideArea,
}: ScheduleGridProps) {
  const dayCols = view === 'day' ? [referenceDate.getDay()] : WEEK_COLS
  const todayIso = toIsoDate(new Date())   // destaca a coluna do dia atual (só na semana dele)

  // Cada coluna é uma DATA concreta da semana visível — consulta entra na
  // coluna cujo dia é o dela, não em "toda segunda-feira".
  const isoOfCol = new Map(dayCols.map(wd => [wd, toIsoDate(dateOfWeekday(referenceDate, wd))]))
  const colDates = new Set(isoOfCol.values())
  const visible = appointments.filter(s => inTurn(turn, s.startTime) && colDates.has(s.date))

  // 07–19 fixo + qualquer horário de consulta fora da faixa, filtrado pelo turno.
  const times = [...new Set([...BASE_TIMES, ...visible.map(s => s.startTime)])]
    .filter(t => inTurn(turn, t))
    .sort()

  const at = (weekday: number, time: string) =>
    visible.filter(s => s.date === isoOfCol.get(weekday) && s.startTime === time)

  return (
    <div className={styles.scroll}>
      <div className={`${styles.grid} ${view === 'day' ? styles['grid--dia'] : ''}`}>
        <div className={styles.corner} />
        {dayCols.map(wd => (
          <div key={wd} className={`${styles.dayHead} ${isoOfCol.get(wd) === todayIso ? styles.dayToday : ''}`}>
            <span className={styles.dayLabel}>{DAY_OF_WEEK_SHORT[wd]}</span>
            <span className={styles.dayDate}>{toShortDate(dateOfWeekday(referenceDate, wd))}</span>
          </div>
        ))}

        {times.map(time => (
          <Fragment key={time}>
            <div className={styles.timeCell}>{time}</div>
            {dayCols.map(wd => (
              <div key={`${wd}-${time}`} className={`${styles.cell} ${isoOfCol.get(wd) === todayIso ? styles.cellToday : ''}`}>
                {at(wd, time).map(s => (
                  <ClassCard
                    key={s.id}
                    appointment={s}
                    showArrow={showArrow}
                    onClick={onSelect ? () => onSelect(s) : undefined}
                    onSetStatus={onSetStatus ? status => onSetStatus(s, status) : undefined}
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
