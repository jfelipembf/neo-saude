import { useState } from 'react'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { WeekNavigator } from '@/components/WeekNavigator/WeekNavigator'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { GradeGrid } from '@/components/GradeGrid/GradeGrid'
import type { GradeTurn, GradeView } from '@/components/GradeGrid/GradeGrid'
import { GRADE_TURN_OPTIONS, GRADE_VIEW_OPTIONS } from '@/components/GradeGrid/gradeOptions'
import { useGradeSessoes } from '@/hooks/useGrade'
import { useDebounce } from '@/hooks/useDebounce'
import { combinaBusca } from '@/utils/search'
import { IconBuscar } from '@/components/icons'
import type { ScheduleSlot } from '@/types/domain'
import styles from './GradeBoard.module.scss'

interface GradeBoardProps {
  /** Ação ao clicar num horário (opcional — sem ela os cards ficam só de leitura). */
  onSelect?: (sessao: ScheduleSlot) => void
}

/** Grade de horários autocontida (controles + grid), reaproveitável em qualquer página. */
export function GradeBoard({ onSelect }: GradeBoardProps) {
  const { data: sessoes = [], isLoading } = useGradeSessoes()
  const [turn, setTurn] = useState<GradeTurn>('all')
  const [view, setView] = useState<GradeView>('week')
  const [refDate, setRefDate] = useState(() => new Date())
  const [busca, setBusca] = useState('')

  // Busca por paciente: some com os demais cards e ficam só os agendamentos
  // dele na semana visível (nome normalizado — acento não atrapalha).
  const termo = useDebounce(busca)
  const visiveis = termo.trim()
    ? sessoes.filter(s => combinaBusca(s.paciente, termo))
    : sessoes

  if (isLoading) return <PageLoader />

  return (
    <div className={styles.board}>
      <div className={styles.controls}>
        <SegmentedControl options={GRADE_TURN_OPTIONS} value={turn} onChange={setTurn} />
        <div className={styles.controlsRight}>
          {/* Busca colada à frente do "20/07 – 26/07" — não quebra de linha. */}
          <div className={styles.buscaSemana}>
            <Input
              size="sm"
              iconLeft={<IconBuscar />}
              placeholder="Buscar paciente..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              aria-label="Buscar paciente na grade"
              className={styles.busca}
            />
            <WeekNavigator date={refDate} view={view} onChange={setRefDate} />
          </div>
          <Button variant="secondary" onClick={() => setRefDate(new Date())}>Hoje</Button>
          <SegmentedControl options={GRADE_VIEW_OPTIONS} value={view} onChange={setView} />
        </div>
      </div>

      <GradeGrid
        sessoes={visiveis}
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
