import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { isoToBrDate } from '@/utils/date'
import { PAYMENT_METHOD_LABEL } from '@/constants/payments'
import type { Receivable, PaymentMethod, PaymentStatus, ReceivableDebtor } from '@/types/domain'
import type { DashboardRange } from '@/utils/period'

// ─────────────────────────────────────────────────────────────────────────────
// Vendas do período: REGIME DE COMPETÊNCIA — uma "venda" conta no dia em que
// ACONTECEU (receivable.competence_date), paga ou não. Venda no cartão aparece
// no dia da venda com status pendente (o repasse da adquirente cai depois e o
// cron dá baixa sozinho); só cancelada fica de fora. MESMA definição do card
// "Faturamento" do Dashboard (dashboard_stats_period) — ver
// docs/modelo-contabil.md. Consulta direta à `receivable` (a RLS recorta a
// clínica), de propósito fora do financeService.ts, que está em edição paralela.
// ─────────────────────────────────────────────────────────────────────────────

type SaleRow = {
  id: string; clinic_id: string; code: string; description: string
  competence_date: string; due_date: string; received_at: string | null
  method: PaymentMethod | null; source: string; gross_amount: number; fee: number; net_amount: number; status: PaymentStatus
  patient_id: string | null; quote_id: string | null; installment_number: number | null; installment_count: number | null
  acquirer_id: string | null; debtor: ReceivableDebtor; treatment_session_id: string | null
  bank_account_id: string | null; received_amount: number | null; notes: string | null
  card_brand: string | null; authorization_code: string | null; sale_id: string | null
}

const SALE_COLS = 'id, clinic_id, code, description, competence_date, due_date, received_at, method, source, gross_amount, fee, net_amount, status, patient_id, quote_id, installment_number, installment_count, acquirer_id, debtor, treatment_session_id, bank_account_id, received_amount, notes, card_brand, authorization_code, sale_id'

function toSale(r: SaleRow): Receivable {
  return {
    id: r.id, clinicId: r.clinic_id, code: r.code, description: r.description,
    competenceDate: isoToBrDate(r.competence_date) ?? '',
    dueDate: isoToBrDate(r.due_date) ?? '', receivedAt: isoToBrDate(r.received_at),
    method: r.method ?? undefined, source: r.source,
    grossAmount: Number(r.gross_amount), fee: Number(r.fee), status: r.status,
    patientId: r.patient_id ?? undefined, quoteId: r.quote_id ?? undefined,
    installmentNumber: r.installment_number ?? undefined, installmentCount: r.installment_count ?? undefined,
    acquirerId: r.acquirer_id ?? undefined, debtor: r.debtor,
    treatmentSessionId: r.treatment_session_id ?? undefined, bankAccountId: r.bank_account_id ?? undefined,
    receivedAmount: r.received_amount != null ? Number(r.received_amount) : undefined, notes: r.notes ?? undefined,
    cardBrand: r.card_brand ?? undefined, authorizationCode: r.authorization_code ?? undefined,
    saleId: r.sale_id ?? undefined,
  }
}

/** Vendas do período [from, to] pela data da VENDA (competência), da mais
 *  recente para a mais antiga. As janelas vêm prontas de `dashboardRange`. */
export async function listSales(range: DashboardRange): Promise<Receivable[]> {
  const { data, error } = await supabase
    .from('receivable').select(SALE_COLS)
    .eq('clinic_id', getCurrentClinicId())
    .neq('status', 'canceled')
    .gte('competence_date', range.from)
    .lte('competence_date', range.to)
    .order('competence_date', { ascending: false })
  if (error) throw error
  return (data as SaleRow[]).map(toSale)
}

// ── Fechar uma venda do PDV (checkout_sale) ─────────────────────────────────

interface CartLine {
  serviceId: string
  quantity: number
}

interface PaymentPlanLine {
  method: PaymentMethod
  amount: number
  /** Só relevante em 'credit' — os demais métodos são sempre à vista (ver
   *  checkout_sale/PaymentForm). */
  installments?: number
  /** Obrigatória quando method for 'credit'/'debit' (repasse de adquirente). */
  acquirerId?: string
  /** Crédito/débito: bandeira (obrigatória) e código de autorização (opcional)
   *  — vão pro `notes` do recebível gerado. */
  cardBrand?: string
  authorizationCode?: string
}

export interface CheckoutSalePayload {
  patientId: string
  /** Consulta que originou a venda. Presente = a venda fica AMARRADA a ela, e
   *  o banco recusa uma segunda venda para a mesma consulta (índice único
   *  parcial sale_appointment_uk). Ausente = venda avulsa do PDV. */
  appointmentId?: string
  saleDateIso: string   // aaaa-mm-dd — já vem assim do <Input type="date">
  discount: number
  items: CartLine[]
  plan: PaymentPlanLine[]
}

/** Fecha a venda: grava sale/sale_item, cria o direito a sessões das linhas de
 *  pacote e gera os recebíveis do plano de pagamento (RPC checkout_sale). */
export async function checkoutSale(payload: CheckoutSalePayload): Promise<string> {
  // Com consulta, a RPC que amarra: venda e vínculo nascem na MESMA transação.
  // Gravar o elo num segundo UPDATE deixaria venda órfã se a rede caísse.
  const rpc = payload.appointmentId ? 'checkout_sale_for_appointment' : 'checkout_sale'
  const { data, error } = await supabase.rpc(rpc, {
    ...(payload.appointmentId ? { p_appointment: payload.appointmentId } : {}),
    p_patient: payload.patientId,
    p_sale_date: payload.saleDateIso,
    p_discount: payload.discount,
    p_items: payload.items.map(i => ({ service_id: i.serviceId, quantity: i.quantity })),
    p_plan: payload.plan.map(p => ({
      method: p.method,
      amount: p.amount,
      installments: p.installments,
      acquirer_id: p.acquirerId,
      card_brand: p.cardBrand,
      authorization_code: p.authorizationCode,
    })),
  })
  if (error) throw error
  return data
}

/**
 * Esta consulta já foi paga?
 *
 * Pergunta ao banco, não ao cache: a recepção pode ter cobrado noutra aba
 * enquanto o modal estava aberto, e é justamente esse o caso que a trava
 * precisa pegar.
 */
export interface VendaDaConsulta {
  id: string
  /** BRUTO — é o que vai no recibo do paciente (docs/modelo-contabil.md). */
  total: number
  saleDate: string
  /** O que foi vendido, para a descrição do recibo. */
  description: string
  /** Formas usadas, já escritas ("Crédito 3x + Pix"). */
  paymentMethods: string
}

export async function findSaleByAppointment(
  appointmentId: string,
): Promise<VendaDaConsulta | null> {
  const clinicId = getCurrentClinicId()
  const { data, error } = await supabase
    .from('sale')
    .select('id, total, sale_date')
    .eq('clinic_id', clinicId)
    .eq('appointment_id', appointmentId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const saleId = data.id as string
  // Itens e títulos em paralelo: o recibo precisa do QUE foi vendido e de COMO
  // foi pago, e nenhum dos dois depende do outro.
  const [itens, titulos] = await Promise.all([
    supabase.from('sale_item').select('name, quantity').eq('clinic_id', clinicId).eq('sale_id', saleId),
    supabase.from('receivable').select('method, installment_count')
      .eq('clinic_id', clinicId).eq('sale_id', saleId).order('installment_number'),
  ])
  if (itens.error) throw itens.error
  if (titulos.error) throw titulos.error

  const descricao = (itens.data ?? [])
    .map(i => (Number(i.quantity) > 1 ? `${i.quantity}× ${i.name}` : String(i.name)))
    .join(', ')

  // Uma linha por FORMA, não por parcela: um crédito em 3x gera três títulos, e
  // listar "Crédito, Crédito, Crédito" no recibo é ruído.
  const formas = new Map<string, number>()
  for (const t of titulos.data ?? []) {
    const metodo = t.method as PaymentMethod | null
    if (!metodo) continue
    formas.set(metodo, Math.max(formas.get(metodo) ?? 1, Number(t.installment_count) || 1))
  }
  const paymentMethods = [...formas.entries()]
    .map(([metodo, parcelas]) => {
      const rotulo = PAYMENT_METHOD_LABEL[metodo as PaymentMethod] ?? metodo
      return parcelas > 1 ? `${rotulo} ${parcelas}x` : rotulo
    })
    .join(' + ')

  return {
    id: saleId,
    total: Number(data.total),
    saleDate: isoToBrDate(data.sale_date as string) ?? '',
    description: descricao || 'Atendimento',
    paymentMethods,
  }
}
