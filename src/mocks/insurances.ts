import type { Insurance } from '@/types/domain'

// Convênios aceitos — os selects de convênio do app (cadastro do paciente,
// orçamentos) montam as opções a partir desta lista (+ "Particular").
export const MOCK_INSURANCES: Insurance[] = [
  {
    id: 'cv1',
    clinicId: 'c1', name: 'Unimed', ans: '30.437-3', phone: '(79) 4002-1010',
    email: 'credenciado@unimed.com.br', payoutDays: 30, status: 'active',
  },
  {
    id: 'cv2',
    clinicId: 'c1', name: 'Bradesco Saúde', ans: '00.586-5', phone: '(11) 4004-2700',
    payoutDays: 45, status: 'active',
  },
  {
    id: 'cv3',
    clinicId: 'c1', name: 'SulAmérica', ans: '00.632-1', phone: '(11) 4004-4935',
    payoutDays: 30, status: 'active',
  },
  {
    id: 'cv4',
    clinicId: 'c1', name: 'Amil', ans: '32.632-6', phone: '(11) 3004-1000',
    payoutDays: 60, status: 'active',
  },
  {
    id: 'cv5',
    clinicId: 'c1', name: 'Hapvida', ans: '36.812-0', phone: '(85) 4002-3633',
    payoutDays: 45, status: 'inactive',
    notes: 'Credenciamento em análise.',
  },
]
