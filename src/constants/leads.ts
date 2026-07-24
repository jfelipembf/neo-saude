import type { LeadStatus } from '@/types/domain'

// ─────────────────────────────────────────────────────────────────────────────
// Rótulo pt de cada etapa do funil de leads — fonte única entre o Kanban
// (título da coluna), o Select "O que aconteceu" do painel do lead e as
// frases do histórico de mudanças.
// ─────────────────────────────────────────────────────────────────────────────
export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Novos contatos',
  qualifying: 'Em qualificação',
  qualified: 'Qualificado',
  scheduling: 'Agendamento',
  attended: 'Compareceu',
  negotiating: 'Em negociação',
  converted: 'Converteu',
  lost: 'Perdeu',
}

const LEAD_STATUS_ORDER: LeadStatus[] = [
  'new', 'qualifying', 'qualified', 'scheduling', 'attended', 'negotiating', 'converted', 'lost',
]

export const LEAD_STATUS_OPTIONS = LEAD_STATUS_ORDER.map(value => ({
  value, label: LEAD_STATUS_LABEL[value],
}))

// ─────────────────────────────────────────────────────────────────────────────
// Quantos dias um lead pode ficar parado numa etapa antes do Kanban acender o
// alerta de "parado" no card. Etapas terminais (converted/lost) não alertam.
// Limiares inspirados nas referências pesquisadas (Triagefy, Kommo).
// ─────────────────────────────────────────────────────────────────────────────
export const LEAD_STAGE_SLA_DAYS: Record<LeadStatus, number> = {
  new: 1,
  qualifying: 2,
  qualified: 5,
  scheduling: 7,
  attended: 3,
  negotiating: 7,
  converted: 0,
  lost: 0,
}
