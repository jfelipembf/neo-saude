// ─────────────────────────────────────────────────────────────────────────────
// Opções fixas de formulários (Selects) e rótulos de exibição — fonte única.
// ─────────────────────────────────────────────────────────────────────────────
import type { ClinicSpecialty, Gender } from '@/types/domain'

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

/** Ramo de atuação da clínica — define as telas específicas do prontuário
 *  (exibido em Configurações → Conta, SOMENTE LEITURA: é uma condição do
 *  plano contratado, não uma preferência que a própria clínica troca —
 *  quem define/muda o ramo é o backoffice do SaaS). Ramo novo? Adicione
 *  aqui E no tipo ClinicSpecialty. */
export const CLINIC_SPECIALTY_LABEL: Record<ClinicSpecialty, string> = {
  dentistry: 'Odontologia',
  physiotherapy: 'Fisioterapia',
  nutrition: 'Nutrição',
  psychology: 'Psicologia',
  personal_training: 'Personal Trainer',
}
