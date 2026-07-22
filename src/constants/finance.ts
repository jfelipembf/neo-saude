// ─────────────────────────────────────────────────────────────────────────────
// Opções fixas do módulo Financeiro (contas bancárias e adquirentes).
// ─────────────────────────────────────────────────────────────────────────────
import type { BankAccountType } from '@/types/domain'

export const ACCOUNT_TYPE_LABEL: Record<BankAccountType, string> = {
  checking: 'Conta corrente',
  savings: 'Poupança',
  cash:    'Caixa interno',
}

export const ACCOUNT_TYPE_OPTIONS = (Object.keys(ACCOUNT_TYPE_LABEL) as BankAccountType[])
  .map(tipo => ({ value: tipo, label: ACCOUNT_TYPE_LABEL[tipo] }))

/** Bandeiras sugeridas nos chips da adquirente (o usuário pode cadastrar outras). */
export const AVAILABLE_CARD_BRANDS = ['Visa', 'Mastercard', 'Elo', 'Amex', 'Hipercard', 'Diners']
