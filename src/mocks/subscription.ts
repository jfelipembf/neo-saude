import type { Subscription, SubscriptionInvoice } from '@/types/domain'

export const MOCK_SUBSCRIPTION: Subscription = {
  plan: 'Profissional',
  amount: 249.9,
  cycle: 'monthly',
  status: 'active',
  since: '12/03/2024',
  nextBilling: '12/08/2026',
  paymentMethod: 'Cartão Visa •••• 4242',
  includedProfessionals: 10,
  professionalsInUse: 6,
}

// Histórico do que a clínica já pagou pelo acesso — mais recente primeiro.
export const MOCK_INVOICES: SubscriptionInvoice[] = [
  { id: 'f2026-07', clinicId: 'c1', code: 'FAT-000001', referenceMonth: 'Julho de 2026',    dueDate: '12/07/2026', paidAt: '12/07/2026', amount: 249.9, status: 'paid',     paymentMethod: 'Cartão Visa •••• 4242' },
  { id: 'f2026-06', clinicId: 'c1', code: 'FAT-000002', referenceMonth: 'Junho de 2026',    dueDate: '12/06/2026', paidAt: '12/06/2026', amount: 249.9, status: 'paid',     paymentMethod: 'Cartão Visa •••• 4242' },
  { id: 'f2026-05', clinicId: 'c1', code: 'FAT-000003', referenceMonth: 'Maio de 2026',     dueDate: '12/05/2026', paidAt: '14/05/2026', amount: 249.9, status: 'paid',     paymentMethod: 'Pix' },
  { id: 'f2026-04', clinicId: 'c1', code: 'FAT-000004', referenceMonth: 'Abril de 2026',    dueDate: '12/04/2026', paidAt: '12/04/2026', amount: 249.9, status: 'paid',     paymentMethod: 'Cartão Visa •••• 4242' },
  { id: 'f2026-03', clinicId: 'c1', code: 'FAT-000005', referenceMonth: 'Março de 2026',    dueDate: '12/03/2026', paidAt: '12/03/2026', amount: 199.9, status: 'paid',     paymentMethod: 'Cartão Visa •••• 4242' },
  { id: 'f2026-02', clinicId: 'c1', code: 'FAT-000006', referenceMonth: 'Fevereiro de 2026', dueDate: '12/02/2026', paidAt: '12/02/2026', amount: 199.9, status: 'paid',    paymentMethod: 'Cartão Visa •••• 4242' },
  { id: 'f2026-01', clinicId: 'c1', code: 'FAT-000007', referenceMonth: 'Janeiro de 2026',  dueDate: '12/01/2026', paidAt: '12/01/2026', amount: 199.9, status: 'paid',     paymentMethod: 'Boleto' },
]
