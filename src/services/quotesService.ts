import { supabase } from '@/lib/supabase'
import { getCurrentClinicId, type ClientPayload } from '@/lib/tenant'
import type { ClientInsert, Insert } from '@/lib/db'
import { brToIsoDate, isoToBrDate } from '@/utils/date'
import type { PaymentPlanEntry, Quote, QuoteItem } from '@/types/domain'

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

/** Cria o orçamento e devolve o ID — é por ele que o editor chama a aprovação
 *  logo em seguida (aprovar é SEMPRE `approveQuote`, nunca um insert com
 *  status='approved', que nasceria sem parcela nenhuma). */
export async function addQuote(payload: NewQuote): Promise<string> {
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
  return data.id
}

/**
 * Aprova um orçamento e GERA as parcelas em Contas a Receber, via RPC
 * transacional `approve_quote`. A geração mora no servidor porque a linha de
 * CARTÃO tem de nascer como repasse da adquirente (D+N, com taxa por número de
 * parcelas, debtor='acquirer') — a mesma regra do procedimento direto, que usa
 * `private.card_installment_plan`, uma função `private` que o cliente não
 * alcança. Formas do paciente (pix/dinheiro/boleto/cheque/ted) seguem mensais.
 *
 * Idempotente (não duplica se já há recebíveis) e atômico: as parcelas e a
 * virada de status vivem na mesma transação, então nunca sobra contrato
 * aprovado e sem cobrança. Retorna quantas parcelas criou.
 */
export async function approveQuote(id: string, plan?: PaymentPlanEntry[]): Promise<number> {
  const planJson = plan?.length
    ? plan.map(e => ({
        method: e.method,
        amount: e.amount,
        installments: e.installments,
        first_due_date: e.firstDueDate,
        acquirer_id: e.acquirerId ?? null,
      }))
    : null
  const { data, error } = await supabase.rpc('approve_quote', { p_quote: id, p_plan: planJson })
  if (error) throw error
  return (data as number) ?? 0
}
