import type { PaymentMethod } from '@/types/domain'

// Fonte única dos rótulos das formas de pagamento (tabela, modal, recibo).
export const TIPO_PAGAMENTO_LABEL: Record<PaymentMethod, string> = {
  dinheiro: 'Dinheiro',
  credito:  'Crédito',
  debito:   'Débito',
  boleto:   'Boleto',
  cheque:   'Cheque',
  pix:      'Pix',
  ted:      'TED',
}

/** Opções do Select "Forma de pagamento" (derivadas dos rótulos acima). */
export const OPCOES_FORMA_PAGAMENTO = (Object.keys(TIPO_PAGAMENTO_LABEL) as PaymentMethod[])
  .map(tipo => ({ value: tipo, label: TIPO_PAGAMENTO_LABEL[tipo] }))
