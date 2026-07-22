// ─────────────────────────────────────────────────────────────────────────────
// Opções fixas de formulários (Selects) e rótulos de exibição — fonte única.
// ─────────────────────────────────────────────────────────────────────────────
import type { Gender } from '@/types/domain'

export const OPCOES_SEXO = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino',  label: 'Feminino' },
]

export const SEXO_LABEL: Record<Gender, string> = {
  masculino: 'Masculino',
  feminino:  'Feminino',
}

/** Opções de prioridade das tarefas (quadro de Tarefas e card do Dashboard). */
export const OPCOES_PRIORIDADE = [
  { value: 'alta',  label: 'Alta' },
  { value: 'media', label: 'Média' },
  { value: 'baixa', label: 'Baixa' },
]
