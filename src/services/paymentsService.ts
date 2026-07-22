import { MOCK_PAYMENTS } from '@/mocks/payments'
import type { Payment, PaymentMethod } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('payments')… mantendo a MESMA assinatura.
export async function listPatientPayments(patientId: string): Promise<Payment[]> {
  return MOCK_PAYMENTS.filter(p => p.patientId === patientId)
}

/** Todos os pagamentos (ex.: aba Ganhos do perfil do profissional). */
export async function listPayments(): Promise<Payment[]> {
  return MOCK_PAYMENTS
}

/** Dados do modal "Realizar pagamento" (campos de cartão só p/ crédito/débito). */
export interface ReceivePaymentInput {
  method: PaymentMethod
  amount: number
  date: string           // dd/mm/aaaa
  cardBrand?: string
  authorizationCode?: string
  nsu?: string
  installments?: number      // só crédito
}

/** Registra um recebimento; o pagamento quita quando a soma das formas cobre o total. */
export async function receivePayment(id: string, payload: ReceivePaymentInput): Promise<void> {
  const payment = MOCK_PAYMENTS.find(p => p.id === id)
  if (!payment) return
  payment.entries.push({ ...payload })
  const received = payment.entries.reduce((sum, f) => sum + f.amount, 0)
  if (received >= payment.amount) payment.status = 'paid'
}
