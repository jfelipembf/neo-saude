import { supabase } from '@/lib/supabase'
import { getCurrentClinicId, type ClientPayload } from '@/lib/tenant'
import type { ClientInsert, Insert } from '@/lib/db'
import { brToIsoDate, isoToBrDate, toIsoDate, addMonths } from '@/utils/date'
import type { Quote, QuoteItem } from '@/types/domain'

const PARTICULAR = 'Particular'

type QuoteRow = {
  id: string
  clinic_id: string
  code: string
  patient_id: string
  name: string
  issue_date: string
  status: Quote['status']
  discount: number
  installments: number
  notes: string | null
}
type ItemRow = {
  quote_id: string
  treatment: string
  professional_id: string | null
  insurance_id: string | null
  teeth: string[] | null
  faces: string[] | null
  unit_price: number
  multiply_per_tooth: boolean
  amount: number | null
}

async function insuranceMaps(clinicId: string): Promise<{ byId: Map<string, string>; byName: Map<string, string> }> {
  const { data, error } = await supabase.from('insurance').select('id, name').eq('clinic_id', clinicId)
  if (error) throw error
  const byId = new Map<string, string>()
  const byName = new Map<string, string>()
  for (const i of data ?? []) {
    byId.set(i.id as string, i.name as string)
    byName.set(i.name as string, i.id as string)
  }
  return { byId, byName }
}

export async function listPatientQuotes(patientId: string): Promise<Quote[]> {
  const clinicId = getCurrentClinicId()
  const [{ byId }, quotesRes] = await Promise.all([
    insuranceMaps(clinicId),
    supabase
      .from('quote')
      .select('id, clinic_id, code, patient_id, name, issue_date, status, discount, installments, notes')
      .eq('patient_id', patientId)
      .order('issue_date', { ascending: false }),
  ])
  if (quotesRes.error) throw quotesRes.error
  const quotes = quotesRes.data as QuoteRow[]
  if (quotes.length === 0) return []

  const { data: items, error: itemsError } = await supabase
    .from('quote_item')
    .select('quote_id, treatment, professional_id, insurance_id, teeth, faces, unit_price, multiply_per_tooth, amount, sort_order')
    .in('quote_id', quotes.map(q => q.id))
    .order('sort_order')
  if (itemsError) throw itemsError

  const itemsByQuote = new Map<string, QuoteItem[]>()
  for (const it of (items ?? []) as ItemRow[]) {
    const list = itemsByQuote.get(it.quote_id) ?? []
    list.push({
      treatment: it.treatment,
      professionalId: it.professional_id ?? undefined,
      insurance: it.insurance_id ? (byId.get(it.insurance_id) ?? undefined) : undefined,
      teeth: it.teeth ?? undefined,
      faces: it.faces ?? undefined,
      unitPrice: Number(it.unit_price),
      multiplyPerTooth: it.multiply_per_tooth,
      amount: it.amount != null ? Number(it.amount) : 0,
    })
    itemsByQuote.set(it.quote_id, list)
  }

  return quotes.map(q => ({
    id: q.id,
    clinicId: q.clinic_id,
    code: q.code,
    patientId: q.patient_id,
    name: q.name,
    date: isoToBrDate(q.issue_date) ?? '',
    status: q.status,
    items: itemsByQuote.get(q.id) ?? [],
    discount: Number(q.discount) || undefined,
    installments: q.installments,
    notes: q.notes ?? undefined,
  }))
}

/** Dados do editor "Criar orçamento". */
export type NewQuote = ClientPayload<Quote>

export async function addQuote(payload: NewQuote): Promise<void> {
  const clinicId = getCurrentClinicId()
  const { byName } = await insuranceMaps(clinicId)

  const quoteRow: ClientInsert<'quote'> = {
    clinic_id: clinicId,
    patient_id: payload.patientId,
    name: payload.name,
    issue_date: brToIsoDate(payload.date) ?? undefined,
    status: payload.status,
    discount: payload.discount ?? 0,
    installments: payload.installments ?? 1,
    notes: payload.notes ?? null,
  }
  const { data, error } = await supabase.from('quote').insert(quoteRow as Insert<'quote'>).select('id').single()
  if (error) throw error

  if (payload.items.length > 0) {
    const rows = payload.items.map((it, i) => ({
      clinic_id: clinicId,
      quote_id: data.id,
      sort_order: i,
      treatment: it.treatment,
      professional_id: it.professionalId ?? null,
      insurance_id: it.insurance && it.insurance !== PARTICULAR ? (byName.get(it.insurance) ?? null) : null,
      teeth: it.teeth ?? null,
      faces: it.faces ?? null,
      unit_price: it.unitPrice,
      multiply_per_tooth: it.multiplyPerTooth ?? false,
      // `amount` é COLUNA GERADA (unit_price × dentes quando multiplica) — não enviar.
    }))
    const { error: itemsError } = await supabase.from('quote_item').insert(rows)
    if (itemsError) throw itemsError
  }
  // quote.items_total / quote.total são recalculados pelo trigger tg_quote_recalc_total.
}

/**
 * Aprova um orçamento e GERA as parcelas em Contas a Receber (padrão dos ERPs).
 * O trigger tg_quote_stamp_approval carimba approved_at/by ao mudar o status;
 * as parcelas (uma por installment) são geradas aqui. Idempotente: se já existem
 * recebíveis do orçamento, não duplica. Retorna quantas parcelas criou.
 */
export async function approveQuote(id: string): Promise<number> {
  const clinicId = getCurrentClinicId()

  const { data: quote, error } = await supabase
    .from('quote')
    .select('id, name, patient_id, total, items_total, discount, installments')
    .eq('id', id)
    .single()
  if (error) throw error

  // Já tem parcelas? não duplica.
  const { count, error: countError } = await supabase
    .from('receivable')
    .select('id', { count: 'exact', head: true })
    .eq('quote_id', id)
  if (countError) throw countError
  if ((count ?? 0) > 0) {
    await supabase.from('quote').update({ status: 'approved' }).eq('id', id)
    return 0
  }

  const { error: approveError } = await supabase.from('quote').update({ status: 'approved' }).eq('id', id)
  if (approveError) throw approveError

  const total = Number(quote.total ?? (Number(quote.items_total) - Number(quote.discount)))
  if (total <= 0) return 0
  const installments = Math.max(1, quote.installments ?? 1)

  const cents = Math.round(total * 100)
  const base = Math.floor(cents / installments)
  const remainder = cents - base * installments   // sobra na 1ª parcela
  const today = new Date()

  const rows: ClientInsert<'receivable'>[] = []
  for (let k = 0; k < installments; k++) {
    const amount = (base + (k === 0 ? remainder : 0)) / 100
    rows.push({
      clinic_id: clinicId,
      description: `${quote.name} — parcela ${k + 1}/${installments}`,
      source: 'Orçamentos',
      due_date: toIsoDate(addMonths(today, k)),
      gross_amount: amount,
      fee: 0,
      status: 'pending',
      patient_id: quote.patient_id,
      quote_id: id,
      installment_number: k + 1,
      installment_count: installments,
    })
  }
  const { error: insError } = await supabase.from('receivable').insert(rows as Insert<'receivable'>[])
  if (insError) throw insError
  return installments
}
