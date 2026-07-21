// ─────────────────────────────────────────────────────────────────────────────
// Opções fixas do módulo Financeiro (contas bancárias e adquirentes).
// ─────────────────────────────────────────────────────────────────────────────
import type { BankAccountType } from '@/types/domain'

export const TIPO_CONTA_LABEL: Record<BankAccountType, string> = {
  corrente: 'Conta corrente',
  poupanca: 'Poupança',
  caixa:    'Caixa interno',
}

export const OPCOES_TIPO_CONTA = (Object.keys(TIPO_CONTA_LABEL) as BankAccountType[])
  .map(tipo => ({ value: tipo, label: TIPO_CONTA_LABEL[tipo] }))

/** Bandeiras sugeridas nos chips da adquirente (o usuário pode cadastrar outras). */
export const BANDEIRAS_DISPONIVEIS = ['Visa', 'Mastercard', 'Elo', 'Amex', 'Hipercard', 'Diners']
