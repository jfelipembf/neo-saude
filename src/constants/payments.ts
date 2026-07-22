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
