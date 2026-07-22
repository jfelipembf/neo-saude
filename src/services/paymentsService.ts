import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { brToIsoDate, isoToBrDate } from '@/utils/date'
import type { Payment, PaymentEntry, BilledTreatment, PaymentMethod, PaymentStatus } from '@/types/domain'

type PaymentRow = {
  id: string; clinic_id: string; code: string; patient_id: string; payment_date: string
  description: string; amount: number; status: PaymentStatus
}
type EntryRow = {
  payment_id: string; method: PaymentMethod; amount: number; received_on: string | null
  card_brand: string | null; authorization_code: string | null; nsu: string | null; installments: number | null
}
type BilledRow = { payment_id: string; name: string; professional_id: string; amount: number }

async function hydrate(payments: PaymentRow[]): Promise<Payment[]> {
  if (payments.length === 0) return []
  const ids = payments.map(p => p.id)
  const [entriesRes, billedRes] = await Promise.all([
    supabase.from('payment_entry')
      .select('payment_id, method, amount, received_on, card_brand, authorization_code, nsu, installments')
      .in('payment_id', ids).order('created_at'),
    supabase.from('billed_treatment')
      .select('payment_id, name, professional_id, amount').in('payment_id', ids).order('created_at'),
  ])
  if (entriesRes.error) throw entriesRes.error
  if (billedRes.error) throw billedRes.error

  const entriesBy = new Map<string, PaymentEntry[]>()
  for (const e of (entriesRes.data ?? []) as EntryRow[]) {
    const list = entriesBy.get(e.payment_id) ?? []
    list.push({
      method: e.method, amount: Number(e.amount), date: isoToBrDate(e.received_on),
      cardBrand: e.card_brand ?? undefined, authorizationCode: e.authorization_code ?? undefined,
      nsu: e.nsu ?? undefined, installments: e.installments ?? undefined,
    })
    entriesBy.set(e.payment_id, list)
  }
  const billedBy = new Map<string, BilledTreatment[]>()
  for (const b of (billedRes.data ?? []) as BilledRow[]) {
    const list = billedBy.get(b.payment_id) ?? []
    list.push({ name: b.name, professionalId: b.professional_id, amount: Number(b.amount) })
    billedBy.set(b.payment_id, list)
  }
  return payments.map(p => ({
    id: p.id, clinicId: p.clinic_id, code: p.code, patientId: p.patient_id,
    date: isoToBrDate(p.payment_date) ?? '', description: p.description, amount: Number(p.amount), status: p.status,
    entries: entriesBy.get(p.id) ?? [],
    treatments: billedBy.get(p.id),
  }))
}

const PAYMENT_COLS = 'id, clinic_id, code, patient_id, payment_date, description, amount, status'

export async function listPatientPayments(patientId: string): Promise<Payment[]> {
  const { data, error } = await supabase.from('payment').select(PAYMENT_COLS)
    .eq('patient_id', patientId).order('payment_date', { ascending: false })
  if (error) throw error
  return hydrate(data as PaymentRow[])
}

/** Todos os pagamentos (ex.: aba Ganhos do perfil do profissional). */
export async function listPayments(): Promise<Payment[]> {
  const { data, error } = await supabase.from('payment').select(PAYMENT_COLS)
    .eq('clinic_id', getCurrentClinicId()).order('payment_date', { ascending: false })
  if (error) throw error
  return hydrate(data as PaymentRow[])
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
  const { data: payment, error } = await supabase.from('payment').select('amount').eq('id', id).single()
  if (error) throw error
  const { data: entries, error: entriesError } = await supabase.from('payment_entry').select('amount').eq('payment_id', id)
  if (entriesError) throw entriesError

  const { error: insError } = await supabase.from('payment_entry').insert({
    clinic_id: getCurrentClinicId(), payment_id: id, method: payload.method, amount: payload.amount,
    received_on: brToIsoDate(payload.date), card_brand: payload.cardBrand ?? null,
    authorization_code: payload.authorizationCode ?? null, nsu: payload.nsu ?? null, installments: payload.installments ?? null,
  })
  if (insError) throw insError

  const received = (entries ?? []).reduce((sum, e) => sum + Number(e.amount), 0) + payload.amount
  if (received >= Number(payment.amount)) {
    const { error: upError } = await supabase.from('payment').update({ status: 'paid' }).eq('id', id)
    if (upError) throw upError
  }
}
