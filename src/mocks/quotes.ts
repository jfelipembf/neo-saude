import type { Quote } from '@/types/domain'

// Orçamentos de demonstração — mais recente primeiro.
export const MOCK_QUOTES: Quote[] = [
  {
    id: 'o1',
    clinicId: 'c1', code: 'ORC-000001', patientId: 'p1', name: 'Plano de tratamento de Maria Oliveira',
    date: '18/07/2026', status: 'pending',
    items: [
      {
        treatment: 'Restauração em resina composta', professionalId: 'f2',
        insurance: 'Particular', teeth: ['16', '25'], faces: ['O/I'],
        unitPrice: 350, multiplyPerTooth: true, amount: 700,
      },
      {
        treatment: 'Clareamento em consultório', professionalId: 'f2',
        insurance: 'Particular', unitPrice: 900, amount: 900,
      },
    ],
    discount: 100,
    installments: 3,
    notes: 'Valores válidos por 30 dias.',
  },
  {
    id: 'o2',
    clinicId: 'c1', code: 'ORC-000002', patientId: 'p1', name: 'Tratamento de canal — dente 36',
    date: '10/07/2026', status: 'approved',
    items: [
      {
        treatment: 'Tratamento endodôntico (canal)', professionalId: 'f2',
        insurance: 'Particular', teeth: ['36'], unitPrice: 750, amount: 750,
      },
    ],
    installments: 1,
  },
]
