import { useState } from 'react'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { WeekNavigator } from '@/components/WeekNavigator/WeekNavigator'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { ScheduleGrid } from '@/components/ScheduleGrid/ScheduleGrid'
import type { ScheduleTurn, ScheduleView } from '@/components/ScheduleGrid/ScheduleGrid'
import { SCHEDULE_TURN_OPTIONS, SCHEDULE_VIEW_OPTIONS } from '@/components/ScheduleGrid/scheduleOptions'
import { useScheduleSlots } from '@/hooks/useSchedule'
import { useDebounce } from '@/hooks/useDebounce'
import { usePatientName } from '@/hooks/useDisplayNames'
import { matchesSearch } from '@/utils/search'
import { IconSearch } from '@/components/icons'
import type { ScheduleSlot } from '@/types/domain'
import styles from './ScheduleBoard.module.scss'

interface ScheduleBoardProps {
  /** Ação ao clicar num horário (opcional — sem ela os cards ficam só de leitura). */
  onSelect?: (slot: ScheduleSlot) => void
}

/** Grade de horários autocontida (controles + grid), reaproveitável em qualquer página. */
export function ScheduleBoard({ onSelect }: ScheduleBoardProps) {
  const { data: slots = [], isLoading } = useScheduleSlots()
  const patientName = usePatientName()
  const [turn, setTurn] = useState<ScheduleTurn>('all')
  const [view, setView] = useState<ScheduleView>('week')
  const [refDate, setRefDate] = useState(() => new Date())
  const [search, setSearch] = useState('')

  // Busca por paciente: some com os demais cards e ficam só os agendamentos
  // dele na semana visível (nome normalizado — acento não atrapalha).
  const term = useDebounce(search)
  const visible = term.trim()
    ? slots.filter(s => matchesSearch(patientName(s.patientId), term))
    : slots

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
        slots={visible}
        view={view}
        turn={turn}
        referenceWeekday={refDate.getDay()}
        referenceDate={refDate}
        onSelect={onSelect}
        showArrow={!!onSelect}
      />
    </div>
  )
}
