import { Fragment } from 'react'
import type { CSSProperties } from 'react'
import { ClassCard } from './ClassCard'
import { ClassGroupCard } from './ClassGroupCard'
import { DAY_OF_WEEK_SHORT } from '@/constants'
import { IconPlus } from '@/components/icons'
import { toIsoDate, toShortDate } from '@/utils/date'
import type { ScheduledAppointment, ClassGroupOccurrence, ProfessionalAvailabilitySlot } from '@/types/domain'
import styles from './ScheduleGrid.module.scss'

// Ordem das colunas na visão semana: Seg…Sáb, Dom (índices do getDay, 0 = Dom).
const WEEK_COLS = [1, 2, 3, 4, 5, 6, 0]

export type ScheduleView = 'week' | 'day'

interface ScheduleGridProps {
  appointments: ScheduledAppointment[]
  /** Ocorrências de turmas coletivas na semana visível (ver
   *  utils/classGroupOccurrences) — desenhadas na cor do profissional
   *  responsável, junto com as consultas de paciente na mesma célula. */
  classOccurrences?: ClassGroupOccurrence[]
  /** Clique num card de turma — abre a chamada OU (modo Matricular) alterna a
   *  seleção da turma. Sem isto, o card não é clicável (ver gate de
   *  especialidade/modo em ScheduleBoard). */
  onSelectClass?: (occurrence: ClassGroupOccurrence) => void
  /** Modo "Matricular": ids de class_group já escolhidos nesta rodada — os
   *  cards dessas turmas ganham a sombra/selo de "selecionada" (ver
   *  ClassGroupCard). */
  selectedClassGroupIds?: Set<string>
  view: ScheduleView
  /** Data de referência: define a semana visível (e o dia, na visão "Dia"). */
  referenceDate: Date
  onSelect?: (appointment: ScheduledAppointment) => void
  /** Mostra a setinha de hover nos cards clicáveis. */
  showArrow?: boolean
  /** Oculta a linha de sala nos cards. */
  hideArea?: boolean
  /** Dias da semana (0=Dom…6=Sáb) escondidos da grade — a data das demais
   *  colunas continua calculada normalmente, só a coluna some da visão. */
  hiddenWeekdays?: Set<number>
  /** Grade de disponibilidade do profissional filtrado (aba Agenda do perfil)
   *  — desenha uma listra na cor dele nas células dentro do horário dele.
   *  `blockedSlots`/`absentDates` VENCEM a grade recorrente: uma célula com
   *  hora bloqueada ou num dia de ausência não conta como disponível, mesmo
   *  que a regra semanal diga que sim. */
  availability?: {
    slots: ProfessionalAvailabilitySlot[]
    color?: string
    blockedSlots?: Set<string>   // `${dateIso}-${hour}`
    absentDates?: Set<string>     // dateIso — dia inteiro fora (viagem/férias)
  }
  /** Clique no "+" de uma célula vazia dentro da disponibilidade — abre o
   *  modal de nova consulta pré-preenchido para aquele dia/horário. Só
   *  aparece quando `availability` está definida (profissional filtrado). */
  onQuickAdd?: (dateIso: string, time: string) => void
  /** Modo "bloquear agendamento" ativo: troca o "+" por um checkbox de
   *  seleção nas células DENTRO DA DISPONIBILIDADE do profissional (qualquer
   *  dia da semana em que ele atende, não só Sáb/Dom) — a seleção é salva à
   *  parte, pelo botão que liga este modo (ver ScheduleBoard.tsx). */
  blockEditing?: {
    selected: Set<string>   // `${dateIso}-${hour}`, seleção AINDA NÃO salva
    onToggle: (dateIso: string, hour: number) => void
  }
}

// Faixa de horário base exibida sempre (07:00 → 19:00); consultas fora dela criam linhas extras.
const HOUR_START = 7, HOUR_END = 19
const BASE_TIMES = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => `${String(HOUR_START + i).padStart(2, '0')}:00`)

/** A data (Date) da coluna `weekday` dentro da semana de `ref`. */
function dateOfWeekday(ref: Date, weekday: number): Date {
  return new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + (weekday - ref.getDay()))
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Início da hora cheia que CONTÉM `time` ("10:30" → "10:00", "10:00" → "10:00"). */
function floorHourBoundary(time: string) {
  return `${String(Number(time.split(':')[0])).padStart(2, '0')}:00`
}

/** Hora cheia seguinte ("09:00" → "10:00", "10:30" → "11:00") — o fim do
 *  bloco que a linha representa, mesmo quando ela própria não começa em
 *  hora cheia (a linha "10:30" representa o restante até "11:00"). */
function nextHourBoundary(time: string) {
  return `${String(Number(time.split(':')[0]) + 1).padStart(2, '0')}:00`
}

/**
 * Primeira janela livre dentro de [hourStart, hourEnd) naquele dia, olhando
 * TODA consulta que toque o intervalo — não só as que começam exatamente
 * nele. Uma consulta das 8:30 às 10:30 cobre a linha das 9h inteira (janela
 * nenhuma ali) e deixa a janela [10:30, 11:00) livre na linha das 10h.
 * `null` = a hora inteira está ocupada.
 */
function freeWindow(appointments: ScheduledAppointment[], dateIso: string, hourStart: string, hourEnd: string) {
  // Cancelada e falta NÃO ocupam o horário (mesmo recorte que o banco usa nas
  // travas de sala — ver appointment_room_overlap_ex na migration de Agenda).
  const overlapping = appointments
    .filter(s => s.date === dateIso && s.status !== 'canceled' && s.status !== 'no_show' && s.startTime < hourEnd && s.endTime > hourStart)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  let cursor = hourStart
  for (const s of overlapping) {
    const start = s.startTime < hourStart ? hourStart : s.startTime
    if (start > cursor) return { start: cursor, end: start }
    if (s.endTime > cursor) cursor = s.endTime > hourEnd ? hourEnd : s.endTime
  }
  return cursor < hourEnd ? { start: cursor, end: hourEnd } : null
}

/** Grade de horários: colunas por dia (datas reais), linhas por hora, cards na cor da atividade. */
export function ScheduleGrid({
  appointments, classOccurrences, onSelectClass, selectedClassGroupIds, view, referenceDate,
  onSelect, showArrow, hideArea, hiddenWeekdays, availability, onQuickAdd, blockEditing,
}: ScheduleGridProps) {
  // weekday-hora → disponível, só quando um profissional está filtrado.
  // Bloqueio pontual e ausência VENCEM a regra recorrente (ver o comentário
  // na prop `availability`).
  const availableSet = new Set((availability?.slots ?? []).map(s => `${s.weekday}-${s.hour}`))
  // Só a regra RECORRENTE, sem descontar bloqueio/ausência — usada no modo de
  // bloqueio, onde uma célula já bloqueada também precisa aparecer (é assim
  // que dá pra desmarcar o checkbox e desbloquear).
  const isRecurring = (weekday: number, hour: number) => availableSet.has(`${weekday}-${hour}`)
  // Checagem completa (recorrente E não bloqueada E não em dia de ausência) —
  // usada no contorno colorido e no "+" de agendar.
  const isAvailable = (weekday: number, time: string, dateIso: string) => {
    if (availability?.absentDates?.has(dateIso)) return false
    const hour = Number(time.split(':')[0])
    if (availability?.blockedSlots?.has(`${dateIso}-${hour}`)) return false
    return isRecurring(weekday, hour)
  }
  // Cada coluna calcula a própria data a partir do weekday (dateOfWeekday),
  // então tirar Sáb/Dom daqui não desloca a data das colunas que sobram.
  const dayCols = view === 'day'
    ? [referenceDate.getDay()]
    : WEEK_COLS.filter(wd => !hiddenWeekdays?.has(wd))
  const todayIso = toIsoDate(new Date())   // destaca a coluna do dia atual (só na semana dele)

  // Cada coluna é uma DATA concreta da semana visível — consulta entra na
  // coluna cujo dia é o dela, não em "toda segunda-feira".
  const isoOfCol = new Map(dayCols.map(wd => [wd, toIsoDate(dateOfWeekday(referenceDate, wd))]))
  const colDates = new Set(isoOfCol.values())
  const visible = appointments.filter(s => colDates.has(s.date))
  const visibleClasses = (classOccurrences ?? []).filter(o => colDates.has(o.date))

  // 07–19 fixo + início E FIM de qualquer consulta ou turma fora da faixa —
  // é o fim que faz sobrar uma linha própria pro restante da hora (ex.: uma
  // consulta até 10:30 cria a linha "10:30", o resto até 11h livre pra o "+").
  const times = [...new Set([
    ...BASE_TIMES,
    ...visible.map(s => s.startTime), ...visible.map(s => s.endTime),
    ...visibleClasses.map(o => o.startTime), ...visibleClasses.map(o => o.endTime),
  ])].sort()

  const at = (weekday: number, time: string) =>
    visible.filter(s => s.date === isoOfCol.get(weekday) && s.startTime === time)
  const atClasses = (weekday: number, time: string) =>
    visibleClasses.filter(o => o.date === isoOfCol.get(weekday) && o.startTime === time)

  // Nº de faixas do grid tem que bater com o nº de colunas renderizadas
  // (ver comentário em ScheduleGrid.module.scss) — senão as células desalinham.
  const gridVariant = view === 'day' ? 'grid--dia' : `grid--cols-${dayCols.length}`

  const availabilityStyle = availability?.color
    ? ({ '--availability-color': availability.color } as CSSProperties)
    : undefined

  return (
    <div className={styles.scroll}>
      <div className={`${styles.grid} ${styles[gridVariant]}`} style={availabilityStyle}>
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
              <div
                key={`${wd}-${time}`}
                className={[
                  styles.cell,
                  isoOfCol.get(wd) === todayIso ? styles.cellToday : '',
                  availability && isAvailable(wd, time, isoOfCol.get(wd)!) ? styles['cell--available'] : '',
                ].filter(Boolean).join(' ')}
              >
                {at(wd, time).map(s => (
                  <ClassCard
                    key={s.id}
                    appointment={s}
                    showArrow={showArrow}
                    onClick={onSelect ? () => onSelect(s) : undefined}
                    hideArea={hideArea}
                  />
                ))}

                {atClasses(wd, time).map(o => (
                  <ClassGroupCard
                    key={o.id}
                    occurrence={o}
                    hideArea={hideArea}
                    onClick={onSelectClass ? () => onSelectClass(o) : undefined}
                    selected={selectedClassGroupIds?.has(o.classGroupId)}
                  />
                ))}

                {(() => {
                  const dateIso = isoOfCol.get(wd)!

                  // Modo "bloquear agendamento": checkbox no lugar do "+",
                  // em QUALQUER dia dentro da disponibilidade RECORRENTE do
                  // profissional (não só Sáb/Dom — se ele atende terça, terça
                  // também pode ser bloqueada numa semana específica). Usa
                  // isRecurring (não isAvailable) de propósito: uma célula já
                  // bloqueada também precisa aparecer aqui, marcada — é assim
                  // que dá pra desmarcar o checkbox e desbloquear. Ausência do
                  // dia inteiro continua fora (bloquear hora avulsa não faz
                  // sentido se o dia já está todo de folga). Só em hora cheia.
                  // Turma OU consulta ATIVA no horário: sem checkbox (não faz
                  // sentido bloquear em cima de um card que já ocupa a hora).
                  // Exceção: consulta CANCELADA — o horário voltou a ficar
                  // livre (o card continua ali, cinza, mas o checkbox aparece
                  // junto pra poder fechar aquela hora pra novo agendamento.
                  if (blockEditing) {
                    const hour = Number(time.split(':')[0])
                    const hasActiveAppointment = at(wd, time).some(s => s.status !== 'canceled')
                    if (!availability || availability.absentDates?.has(dateIso) || !isRecurring(wd, hour) || !BASE_TIMES.includes(time) || hasActiveAppointment || atClasses(wd, time).length > 0) return null
                    const key = `${dateIso}-${hour}`
                    return (
                      <label className={styles.blockCheckbox} aria-label={`Bloquear ${time}`}>
                        <input
                          type="checkbox"
                          checked={blockEditing.selected.has(key)}
                          onChange={() => blockEditing.onToggle(dateIso, hour)}
                        />
                      </label>
                    )
                  }

                  // "+" só aparece na linha onde a janela livre REALMENTE
                  // começa: uma consulta de 8:30–10:30 bloqueia a linha das 9h
                  // inteira (nenhuma janela ali) e deixa só a linha das 10:30
                  // com o restante até 11h — outro agendamento não pode cair
                  // em cima do que já está ocupado. A janela é sempre calculada
                  // a partir do início da HORA CHEIA que contém a linha (não da
                  // própria linha) — senão, num dia sem nada marcado, a linha
                  // "10:30" (que só existe por causa de OUTRO dia) repetiria a
                  // mesma janela livre da linha "10:00" e duplicaria o "+".
                  if (!onQuickAdd || !availability || !isAvailable(wd, time, dateIso) || at(wd, time).length > 0 || atClasses(wd, time).length > 0) return null
                  const hourFloor = floorHourBoundary(time)
                  const gap = freeWindow(visible, dateIso, hourFloor, nextHourBoundary(hourFloor))
                  if (!gap || gap.start !== time) return null
                  const remaining = toMinutes(gap.end) - toMinutes(gap.start)
                  return (
                    <button
                      type="button"
                      className={styles.quickAdd}
                      aria-label={`Agendar consulta às ${time}${remaining < 60 ? ` (restam ${remaining} min até a próxima hora)` : ''}`}
                      onClick={() => onQuickAdd(dateIso, time)}
                    >
                      <IconPlus />
                      {remaining < 60 && <span className={styles.quickAddHint}>{remaining}min</span>}
                    </button>
                  )
                })()}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
