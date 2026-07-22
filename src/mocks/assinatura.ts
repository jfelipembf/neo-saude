import type { Subscription, SubscriptionInvoice } from '@/types/domain'

export const MOCK_ASSINATURA: Subscription = {
  plano: 'Profissional',
  valor: 249.9,
  ciclo: 'mensal',
  status: 'ativa',
  desde: '12/03/2024',
  proximaCobranca: '12/08/2026',
  formaPagamento: 'Cartão Visa •••• 4242',
  profissionaisIncluidos: 10,
  profissionaisEmUso: 6,
}

// Histórico do que a clínica já pagou pelo acesso — mais recente primeiro.
export const MOCK_FATURAS: SubscriptionInvoice[] = [
  { id: 'f2026-07', competencia: 'Julho de 2026',    vencimento: '12/07/2026', pagamento: '12/07/2026', valor: 249.9, status: 'pago',     formaPagamento: 'Cartão Visa •••• 4242' },
  { id: 'f2026-06', competencia: 'Junho de 2026',    vencimento: '12/06/2026', pagamento: '12/06/2026', valor: 249.9, status: 'pago',     formaPagamento: 'Cartão Visa •••• 4242' },
  { id: 'f2026-05', competencia: 'Maio de 2026',     vencimento: '12/05/2026', pagamento: '14/05/2026', valor: 249.9, status: 'pago',     formaPagamento: 'Pix' },
  { id: 'f2026-04', competencia: 'Abril de 2026',    vencimento: '12/04/2026', pagamento: '12/04/2026', valor: 249.9, status: 'pago',     formaPagamento: 'Cartão Visa •••• 4242' },
  { id: 'f2026-03', competencia: 'Março de 2026',    vencimento: '12/03/2026', pagamento: '12/03/2026', valor: 199.9, status: 'pago',     formaPagamento: 'Cartão Visa •••• 4242' },
  { id: 'f2026-02', competencia: 'Fevereiro de 2026', vencimento: '12/02/2026', pagamento: '12/02/2026', valor: 199.9, status: 'pago',    formaPagamento: 'Cartão Visa •••• 4242' },
  { id: 'f2026-01', competencia: 'Janeiro de 2026',  vencimento: '12/01/2026', pagamento: '12/01/2026', valor: 199.9, status: 'pago',     formaPagamento: 'Boleto' },
]
