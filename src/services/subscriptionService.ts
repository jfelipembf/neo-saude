import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { isoToBrDate } from '@/utils/date'
import type { Subscription, SubscriptionInvoice, BillingCycle, SubscriptionStatus, PaymentStatus } from '@/types/domain'

// Assinatura e faturas são escritas pela PLATAFORMA (gateway, via service_role);
// a clínica só LÊ. getSubscription usa a RPC my_subscription, que já junta plano
// (label + limite) e a contagem de profissionais em uso.

type SubscriptionJson = {
  plan: string
  amount: number
  cycle: BillingCycle
  status: SubscriptionStatus
  since: string
  next_billing: string
  payment_method: string | null
  included_professionals: number | null
  professionals_in_use: number | null
}

export async function getSubscription(): Promise<Subscription> {
  const { data, error } = await supabase.rpc('my_subscription')
  if (error) throw error
  // A RPC devolve NULL quando a clínica ainda não tem contrato (cortesia/piloto).
  if (!data) throw new Error('Clínica sem assinatura ativa.')
  const s = data as unknown as SubscriptionJson
  return {
    plan: s.plan,
    amount: Number(s.amount),
    cycle: s.cycle,
    status: s.status,
    since: isoToBrDate(s.since) ?? '',
    nextBilling: isoToBrDate(s.next_billing) ?? '',
    paymentMethod: s.payment_method ?? undefined,
    includedProfessionals: s.included_professionals ?? undefined,
    professionalsInUse: s.professionals_in_use ?? undefined,
  }
}

type InvoiceRow = {
  id: string
  clinic_id: string
  code: string
  reference_month: string
  due_date: string
  paid_at: string | null
  amount: number
  status: PaymentStatus
  payment_method_label: string | null
}

/** "2026-07-01" → "Julho de 2026". */
function referenceMonthLabel(iso: string): string {
  const label = new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export async function listInvoices(): Promise<SubscriptionInvoice[]> {
  const { data, error } = await supabase
    .from('subscription_invoice')
    .select('id, clinic_id, code, reference_month, due_date, paid_at, amount, status, payment_method_label')
    .eq('clinic_id', getCurrentClinicId())
    .order('reference_month', { ascending: false })
  if (error) throw error
  return (data as InvoiceRow[]).map(r => ({
    id: r.id,
    clinicId: r.clinic_id,
    code: r.code,
    referenceMonth: referenceMonthLabel(r.reference_month),
    dueDate: isoToBrDate(r.due_date) ?? '',
    paidAt: isoToBrDate(r.paid_at),
    amount: Number(r.amount),
    status: r.status,
    paymentMethod: r.payment_method_label ?? undefined,
  }))
}
