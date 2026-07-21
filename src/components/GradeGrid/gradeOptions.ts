// Vive fora de GradeGrid.tsx (componente) p/ poder exportar consts sem quebrar
// o Fast Refresh (mesmo motivo de components/Badge/statusMap.ts).
import type { GradeTurn, GradeView } from './GradeGrid'

export const GRADE_TURN_OPTIONS: { value: GradeTurn; label: string }[] = [
  { value: 'all',       label: 'Todos' },
  { value: 'morning',   label: 'Manhã' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'night',     label: 'Noite' },
]

export const GRADE_VIEW_OPTIONS: { value: GradeView; label: string }[] = [
  { value: 'week', label: 'Semana' },
  { value: 'day',  label: 'Dia' },
]
