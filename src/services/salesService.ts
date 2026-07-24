import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { isoToBrDate } from '@/utils/date'
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

export interface CartLine {
  serviceId: string
  quantity: number
}

export interface PaymentPlanLine {
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
  saleDateIso: string   // aaaa-mm-dd — já vem assim do <Input type="date">
  discount: number
  items: CartLine[]
  plan: PaymentPlanLine[]
}

/** Fecha a venda: grava sale/sale_item, cria o direito a sessões das linhas de
 *  pacote e gera os recebíveis do plano de pagamento (RPC checkout_sale). */
export async function checkoutSale(payload: CheckoutSalePayload): Promise<string> {
  const { data, error } = await supabase.rpc('checkout_sale', {
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
