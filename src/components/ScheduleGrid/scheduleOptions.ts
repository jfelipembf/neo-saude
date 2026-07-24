// Vive fora de GradeGrid.tsx (componente) p/ poder exportar consts sem quebrar
// o Fast Refresh (mesmo motivo de components/Badge/statusMap.ts).
import type { ScheduleView } from './ScheduleGrid'

export const SCHEDULE_VIEW_OPTIONS: { value: ScheduleView; label: string }[] = [
  { value: 'week', label: 'Semana' },
  { value: 'day',  label: 'Dia' },
]
