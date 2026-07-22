import type { CollectionAttempt } from '@/types/domain'

// Trilha de cobrança — quem já foi cobrado, quando e por onde.
export const MOCK_COLLECTION_ATTEMPTS: CollectionAttempt[] = [
  {
    id: 'ca1', clinicId: 'c1', patientId: 'p1', date: '05/07/2026',
    channel: 'whatsapp', amountCharged: 180,
    notes: 'Mensagem automática de saldo devedor.',
  },
  {
    id: 'ca2', clinicId: 'c1', patientId: 'p1', date: '14/07/2026',
    channel: 'phone', amountCharged: 330,
    notes: 'Falou com a paciente; prometeu pagar até o fim do mês.',
  },
]
