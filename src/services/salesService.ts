import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { isoToBrDate } from '@/utils/date'
import type { Receivable, PaymentMethod, PaymentStatus, ReceivableDebtor } from '@/types/domain'
import type { DashboardRange } from '@/utils/period'

// ─────────────────────────────────────────────────────────────────────────────
// Vendas do período: uma "venda" é um recebível QUITADO — dinheiro que de fato
// entrou. A aba lista os títulos `status = 'paid'` cujo `received_at` cai no
// intervalo escolhido, a MESMA definição de faturamento que o Dashboard usa
// (receivable pago, por data de recebimento). Consulta direta à `receivable`
// (a RLS recorta a clínica), no mesmo molde de listReceivables — de propósito
// fora do financeService.ts, que está em edição paralela.
// ─────────────────────────────────────────────────────────────────────────────

type SaleRow = {
  id: string; clinic_id: string; code: string; description: string; due_date: string; received_at: string | null
  method: PaymentMethod | null; source: string; gross_amount: number; fee: number; net_amount: number; status: PaymentStatus
  patient_id: string | null; quote_id: string | null; installment_number: number | null; installment_count: number | null
  acquirer_id: string | null; debtor: ReceivableDebtor; treatment_session_id: string | null
  bank_account_id: string | null; received_amount: number | null; notes: string | null
}

const SALE_COLS = 'id, clinic_id, code, description, due_date, received_at, method, source, gross_amount, fee, net_amount, status, patient_id, quote_id, installment_number, installment_count, acquirer_id, debtor, treatment_session_id, bank_account_id, received_amount, notes'

function toSale(r: SaleRow): Receivable {
  return {
    id: r.id, clinicId: r.clinic_id, code: r.code, description: r.description,
    dueDate: isoToBrDate(r.due_date) ?? '', receivedAt: isoToBrDate(r.received_at),
    method: r.method ?? undefined, source: r.source,
    grossAmount: Number(r.gross_amount), fee: Number(r.fee), status: r.status,
    patientId: r.patient_id ?? undefined, quoteId: r.quote_id ?? undefined,
    installmentNumber: r.installment_number ?? undefined, installmentCount: r.installment_count ?? undefined,
    acquirerId: r.acquirer_id ?? undefined, debtor: r.debtor,
    treatmentSessionId: r.treatment_session_id ?? undefined, bankAccountId: r.bank_account_id ?? undefined,
    receivedAmount: r.received_amount != null ? Number(r.received_amount) : undefined, notes: r.notes ?? undefined,
  }
}

/** Vendas (recebíveis quitados) cujo recebimento cai no período [from, to], da
 *  mais recente para a mais antiga. As janelas vêm prontas de `dashboardRange`. */
export async function listSales(range: DashboardRange): Promise<Receivable[]> {
  const { data, error } = await supabase
    .from('receivable').select(SALE_COLS)
    .eq('clinic_id', getCurrentClinicId())
    .eq('status', 'paid')
    .gte('received_at', range.from)
    .lte('received_at', range.to)
    .order('received_at', { ascending: false })
  if (error) throw error
  return (data as SaleRow[]).map(toSale)
}
