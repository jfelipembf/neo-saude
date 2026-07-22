import { MOCK_ASSINATURA, MOCK_FATURAS } from '@/mocks/assinatura'
import type { Subscription, SubscriptionInvoice } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. No produto real estes dados vêm do
// gateway de cobrança do SaaS (Stripe, Pagar.me…), não do Supabase da clínica —
// trocar SÓ o corpo destas funções, mantendo a MESMA assinatura.
// Cópias ({ ...mock }) para o cache do TanStack Query não apontar para o objeto
// mutável.

export async function getAssinatura(): Promise<Subscription> {
  return { ...MOCK_ASSINATURA }
}

export async function listFaturas(): Promise<SubscriptionInvoice[]> {
  return MOCK_FATURAS.map(f => ({ ...f }))
}
