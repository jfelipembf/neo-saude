import type { PaymentMethod } from '@/types/domain'

// Fonte única dos rótulos das formas de pagamento (tabela, modal, recibo).
export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Dinheiro',
  credit:  'Crédito',
  debit:   'Débito',
  boleto:   'Boleto',
  check:   'Cheque',
  pix:      'Pix',
  wire:      'TED',
}

/** Opções do Select "Forma de pagamento" (derivadas dos rótulos acima). */
export const PAYMENT_METHOD_OPTIONS = (Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[])
  .map(tipo => ({ value: tipo, label: PAYMENT_METHOD_LABEL[tipo] }))

/**
 * Formas em que a venda é GARANTIDA pela adquirente: quem passa a dever as
 * parcelas é ela, não o paciente. Toda tela que oferece uma destas TEM que
 * exigir a adquirente junto — é o `acquirer_id` que faz `receivable.debtor`
 * virar 'acquirer' e mantém o título fora da Inadimplência.
 */
export function isCardMethod(method?: PaymentMethod | null): boolean {
  return method === 'credit' || method === 'debit'
}
