import type { TipoPagamento } from '@/types/domain'

// Fonte única dos rótulos das formas de pagamento (tabela, modal, recibo).
export const TIPO_PAGAMENTO_LABEL: Record<TipoPagamento, string> = {
  dinheiro: 'Dinheiro',
  credito:  'Crédito',
  debito:   'Débito',
  boleto:   'Boleto',
  cheque:   'Cheque',
  pix:      'Pix',
  ted:      'TED',
}
