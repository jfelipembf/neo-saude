import { useState } from 'react'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { WeekNavigator } from '@/components/WeekNavigator/WeekNavigator'
import { Button } from '@/components/Button/Button'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { GradeGrid } from '@/components/GradeGrid/GradeGrid'
import type { GradeTurn, GradeView } from '@/components/GradeGrid/GradeGrid'
import { GRADE_TURN_OPTIONS, GRADE_VIEW_OPTIONS } from '@/components/GradeGrid/gradeOptions'
import { useGradeSessoes } from '@/hooks/useGrade'
import type { GradeSessao } from '@/types/domain'
import styles from './GradeBoard.module.scss'

interface GradeBoardProps {
  /** Ação ao clicar num horário (opcional — sem ela os cards ficam só de leitura). */
  onSelect?: (sessao: GradeSessao) => void
}

/** Grade de horários autocontida (controles + grid), reaproveitável em qualquer página. */
export function GradeBoard({ onSelect }: GradeBoardProps) {
  const { data: sessoes = [], isLoading } = useGradeSessoes()
  const [turn, setTurn] = useState<GradeTurn>('all')
  const [view, setView] = useState<GradeView>('week')
  const [refDate, setRefDate] = useState(() => new Date())

  if (isLoading) return <PageLoader />

  return (
    <div className={styles.board}>
      <div className={styles.controls}>
        <SegmentedControl options={GRADE_TURN_OPTIONS} value={turn} onChange={setTurn} />
        <div className={styles.controlsRight}>
          <WeekNavigator date={refDate} view={view} onChange={setRefDate} />
          <Button variant="secondary" onClick={() => setRefDate(new Date())}>Hoje</Button>
          <SegmentedControl options={GRADE_VIEW_OPTIONS} value={view} onChange={setView} />
        </div>
      </div>

      <GradeGrid
        sessoes={sessoes}
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
