// ─────────────────────────────────────────────────────────────────────────────
// Opções fixas de formulários (Selects) e rótulos de exibição — fonte única.
// ─────────────────────────────────────────────────────────────────────────────
import type { Gender } from '@/types/domain'

export const SEX_OPTIONS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female',  label: 'Feminino' },
]

export const SEX_LABEL: Record<Gender, string> = {
  male: 'Masculino',
  female:  'Feminino',
}

/** Opções de prioridade das tarefas (quadro de Tarefas e card do Dashboard). */
export const PRIORITY_OPTIONS = [
  { value: 'high',   label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low',    label: 'Baixa' },
]

