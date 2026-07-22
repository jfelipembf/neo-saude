import { MOCK_SUBSCRIPTION, MOCK_INVOICES } from '@/mocks/subscription'
import type { Subscription, SubscriptionInvoice } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. No produto real estes dados vêm do
// gateway de cobrança do SaaS (Stripe, Pagar.me…), não do Supabase da clínica —
// trocar SÓ o corpo destas funções, mantendo a MESMA assinatura.
// Cópias ({ ...mock }) para o cache do TanStack Query não apontar para o objeto
// mutável.

export async function getSubscription(): Promise<Subscription> {
  return { ...MOCK_SUBSCRIPTION }
}

export async function listInvoices(): Promise<SubscriptionInvoice[]> {
  return MOCK_INVOICES.map(f => ({ ...f }))
}
