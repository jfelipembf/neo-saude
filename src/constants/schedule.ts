// ─────────────────────────────────────────────────────────────────────────────
// Etiquetas da agenda: tipo de atendimento + cor do card na grade.
// Fonte única da paleta: grade da agenda e modal de agendamento leem daqui.
// ─────────────────────────────────────────────────────────────────────────────
import type { ScheduleView } from '@/components/ScheduleGrid/ScheduleGrid'

export const SCHEDULE_TAGS: { label: string; color: string }[] = [
  { label: 'Consulta clínica',      color: '#3B82F6' },
  { label: 'Odontologia',           color: '#14B8A6' },
  { label: 'Fisioterapia',          color: '#10B981' },
  { label: 'Pilates clínico',       color: '#8B5CF6' },
  { label: 'Avaliação nutricional', color: '#F59E0B' },
  { label: 'Psicologia',            color: '#EC4899' },
  { label: 'Retorno',               color: '#64748B' },
]

/** Modos de exibição da grade (SegmentedControl do topo da Agenda). O tipo
 *  `ScheduleView` é prop do componente e continua morando em ScheduleGrid.tsx. */
export const SCHEDULE_VIEW_OPTIONS: { value: ScheduleView; label: string }[] = [
  { value: 'week', label: 'Semana' },
  { value: 'day',  label: 'Dia' },
]
