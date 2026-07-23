import type { LeadStatus } from '@/types/domain'

// ─────────────────────────────────────────────────────────────────────────────
// Rótulo pt de cada etapa do funil de leads — fonte única entre o Kanban
// (título da coluna), o Select "O que aconteceu" do painel do lead e as
// frases do histórico de mudanças.
// ─────────────────────────────────────────────────────────────────────────────
export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Novos contatos',
  negotiating: 'Em negociação',
  scheduling: 'Agendamento',
  converted: 'Converteu',
  lost: 'Perdeu',
}

const LEAD_STATUS_ORDER: LeadStatus[] = ['new', 'negotiating', 'scheduling', 'converted', 'lost']

export const LEAD_STATUS_OPTIONS = LEAD_STATUS_ORDER.map(value => ({
  value, label: LEAD_STATUS_LABEL[value],
}))
