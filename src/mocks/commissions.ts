import type { ProfessionalCommission } from '@/types/domain'

// Regras de comissão por profissional — os demais aparecem "sem comissão
// configurada" na aba Comissões do Administrativo.
export const MOCK_COMMISSIONS: ProfessionalCommission[] = [
  {
    clinicId: 'c1',
    professionalId: 'f1', type: 'percentage', amount: 40, base: 'received',
    payout: 'fixed_day', payoutDay: 5, status: 'active',
    notes: 'Percentual padrão de clínica geral.',
  },
  {
    clinicId: 'c1',
    professionalId: 'f2', type: 'percentage', amount: 35, base: 'performed',
    payout: 'fixed_day', payoutDay: 10, status: 'active',
  },
  {
    clinicId: 'c1',
    professionalId: 'f3', type: 'fixed', amount: 80, base: 'received',
    payout: 'per_visit', status: 'active',
    notes: 'R$ 80 por sessão, pago no dia do atendimento.',
  },
]
