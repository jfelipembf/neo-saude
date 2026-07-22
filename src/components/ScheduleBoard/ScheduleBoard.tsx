import { useState } from 'react'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { WeekNavigator } from '@/components/WeekNavigator/WeekNavigator'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { ScheduleGrid } from '@/components/ScheduleGrid/ScheduleGrid'
import type { ScheduleTurn, ScheduleView } from '@/components/ScheduleGrid/ScheduleGrid'
import { SCHEDULE_TURN_OPTIONS, SCHEDULE_VIEW_OPTIONS } from '@/components/ScheduleGrid/scheduleOptions'
import { useAgendaAppointments } from '@/hooks/useSchedule'
import { useSetAppointmentStatus } from '@/hooks/useAppointments'
import { useDebounce } from '@/hooks/useDebounce'
import { usePatientName } from '@/hooks/useDisplayNames'
import { useToast } from '@/components/Toast/useToast'
import { matchesSearch } from '@/utils/search'
import { toIsoDate } from '@/utils/date'
import { IconSearch } from '@/components/icons'
import type { AgendaAppointment } from '@/types/domain'
import styles from './ScheduleBoard.module.scss'

/** Domingo da semana de `d` (a grade vai de Dom a Sáb; colunas começam na Seg). */
function weekStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay())
}

interface ScheduleBoardProps {
  /** Ação ao clicar num horário (opcional — sem ela os cards ficam só de leitura). */
  onSelect?: (appointment: AgendaAppointment) => void
}

/** Grade de horários autocontida (controles + grid), reaproveitável em qualquer página. */
export function ScheduleBoard({ onSelect }: ScheduleBoardProps) {
  const [turn, setTurn] = useState<ScheduleTurn>('all')
  const [view, setView] = useState<ScheduleView>('week')
  const [refDate, setRefDate] = useState(() => new Date())
  const [search, setSearch] = useState('')

  // Busca SÓ a semana visível — navegar de semana refaz a consulta (cacheada
  // por intervalo em queryKeys.appointments.range).
  const start = weekStart(refDate)
  const fromIso = toIsoDate(start)
  const toIso = toIsoDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6))
  const { data: appointments = [], isLoading } = useAgendaAppointments(fromIso, toIso)

  const toast = useToast()
  const { mutate: setStatus } = useSetAppointmentStatus()

  const patientName = usePatientName()

  // Busca por paciente: some com os demais cards e ficam só os agendamentos
  // dele na semana visível (nome normalizado — acento não atrapalha).
  const term = useDebounce(search)
  const visible = term.trim()
    ? appointments.filter(s => matchesSearch(patientName(s.patientId), term))
    : appointments

  if (isLoading) return <PageLoader />

  return (
    <div className={styles.board}>
      <div className={styles.controls}>
        <SegmentedControl options={SCHEDULE_TURN_OPTIONS} value={turn} onChange={setTurn} />
        <div className={styles.controlsRight}>
          {/* Busca colada à frente do "20/07 – 26/07" — não quebra de linha. */}
          <div className={styles.buscaSemana}>
            <Input
              size="sm"
              iconLeft={<IconSearch />}
              placeholder="Buscar paciente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Buscar paciente na grade"
              className={styles.busca}
            />
            <WeekNavigator date={refDate} view={view} onChange={setRefDate} />
          </div>
          <Button variant="secondary" onClick={() => setRefDate(new Date())}>Hoje</Button>
          <SegmentedControl options={SCHEDULE_VIEW_OPTIONS} value={view} onChange={setView} />
        </div>
      </div>

      <ScheduleGrid
        appointments={visible}
        view={view}
        turn={turn}
        referenceDate={refDate}
        onSelect={onSelect}
        onSetStatus={(a, status) => setStatus(
          { id: a.id, status },
          {
            onSuccess: () => toast.success({
              completed: 'Presença registrada!',
              no_show: 'Falta registrada.',
              canceled: 'Consulta cancelada.',
              scheduled: 'Marcação desfeita — consulta agendada.',
              confirmed: 'Consulta confirmada.',
              in_service: 'Consulta em atendimento.',
            }[status]),
            onError: () => toast.error('Não foi possível registrar. Tente novamente.'),
          },
        )}
        showArrow={!!onSelect}
      />
    </div>
  )
}
