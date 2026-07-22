import { supabase } from '@/lib/supabase'
import { getCurrentClinicId, type ClientPayload } from '@/lib/tenant'
import type { Insert, ClientInsert } from '@/lib/db'
import { brToIsoDate, isoToBrDate, localDate } from '@/utils/date'
import type {
  Acquirer, CashSession, BankAccount, Payable, Receivable,
  CashFlowDay, CashMovement, ChartPeriod, CollectionAttempt, FinancePoint, PaymentMethod, PaymentStatus, InstallmentRate,
} from '@/types/domain'

const clinic = () => getCurrentClinicId()

function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Conta em aberto vira 'overdue' só a PARTIR do dia seguinte ao vencimento. */
function openStatusIso(dueIso: string): 'pending' | 'overdue' {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return localDate(dueIso) < today ? 'overdue' : 'pending'
}

// ── Analítico (RPCs de agregação) ────────────────────────────────────────────
/** Série financeira (ganhos x gastos) por período — RPC finance_series. */
export async function getFinanceSeries(period: ChartPeriod, monthIso: string): Promise<FinancePoint[]> {
  const { data, error } = await supabase.rpc('finance_series', { p_period: period, p_month_iso: monthIso })
  if (error) throw error
  return (data ?? []).map(p => ({ label: p.label, income: Number(p.income), expenses: Number(p.expenses) }))
}

/** Janela da projeção. A aba Fluxo de Caixa não tem seletor de período, então o
 *  recorte é fixo — e precisa ir explícito: a RPC só existe na forma cash_flow(int). */
const CASH_FLOW_DAYS = 30

/**
 * Fluxo de caixa projetado (RPC cash_flow). `baseBalance` é o SALDO APURADO —
 * abertura das contas ativas + tudo já recebido − tudo já pago —, o ponto de
 * partida do acumulado. `days` traz os próximos CASH_FLOW_DAYS dias (contando
 * hoje) com os títulos em ABERTO pela data de VENCIMENTO; o acumulado dia a dia
 * é calculado na tela, não aqui.
 */
export async function getCashFlow(): Promise<{ baseBalance: number; days: CashFlowDay[] }> {
  const { data, error } = await supabase.rpc('cash_flow', { p_days: CASH_FLOW_DAYS })
  if (error) throw error
  // days[] traz { date (ISO), entry_count, inflows, outflows }; o `id` (ordenável)
  // é a própria data ISO.
  const c = data as unknown as { base_balance: number; days: { date: string; entry_count: number; inflows: number; outflows: number }[] }
  return {
    baseBalance: Number(c.base_balance),
    days: (c.days ?? []).map(d => ({
      id: d.date,
      date: isoToBrDate(d.date) ?? '',
      entryCount: Number(d.entry_count),
      inflows: Number(d.inflows),
      outflows: Number(d.outflows),
    })),
  }
}

// ── Caixa: movimentos do dia ─────────────────────────────────────────────────
type CashMovementRow = {
  id: string; clinic_id: string; name: string; payment_method: PaymentMethod | null
  description: string; posted_at: string; type: CashMovement['type']; amount: number
}
export async function listCashMovements(): Promise<CashMovement[]> {
  const { data, error } = await supabase
    .from('cash_movement')
    .select('id, clinic_id, name, payment_method, description, posted_at, type, amount')
    .eq('clinic_id', clinic())
    .order('posted_at', { ascending: false })
  if (error) throw error
  return (data as CashMovementRow[]).map(r => ({
    id: r.id,
    clinicId: r.clinic_id,
    name: r.name,
    paymentMethod: r.payment_method ?? undefined,
    description: r.description,
    postedAt: fmtDateTime(r.posted_at),
    type: r.type,
    amount: Number(r.amount),
  }))
}

// ── Contas a pagar ───────────────────────────────────────────────────────────
type PayableRow = {
  id: string; clinic_id: string; code: string; description: string; category: string
  due_date: string; paid_at: string | null; supplier: string; amount: number; status: PaymentStatus
  payment_method: PaymentMethod | null; bank_account_id: string | null; paid_amount: number | null; notes: string | null
}
function toPayable(r: PayableRow): Payable {
  return {
    id: r.id, clinicId: r.clinic_id, code: r.code, description: r.description, category: r.category,
    dueDate: isoToBrDate(r.due_date) ?? '', paidAt: isoToBrDate(r.paid_at), supplier: r.supplier,
    amount: Number(r.amount), status: r.status,
    paymentMethod: r.payment_method ?? undefined, bankAccountId: r.bank_account_id ?? undefined,
    paidAmount: r.paid_amount != null ? Number(r.paid_amount) : undefined, notes: r.notes ?? undefined,
  }
}
const PAYABLE_COLS = 'id, clinic_id, code, description, category, due_date, paid_at, supplier, amount, status, payment_method, bank_account_id, paid_amount, notes'
export async function listPayables(): Promise<Payable[]> {
  const { data, error } = await supabase.from('payable').select(PAYABLE_COLS).eq('clinic_id', clinic()).order('due_date')
  if (error) throw error
  return (data as PayableRow[]).map(toPayable)
}

/** Campos do modal "Nova conta a pagar". */
export interface NewPayable {
  description: string
  category: string
  supplier: string
  dueDate: string       // dd/mm/aaaa
  amount: number
  notes?: string
}
export async function addPayable(p: NewPayable): Promise<void> {
  const row: ClientInsert<'payable'> = {
    clinic_id: clinic(),
    description: p.description,
    category: p.category,
    supplier: p.supplier,
    due_date: brToIsoDate(p.dueDate)!,
    amount: p.amount,
    notes: p.notes ?? null,
    // status → default 'pending'; code → trigger tr_code.
  }
  const { error } = await supabase.from('payable').insert(row as Insert<'payable'>)
  if (error) throw error
}

// ── Contas a receber ─────────────────────────────────────────────────────────
type ReceivableRow = {
  id: string; clinic_id: string; code: string; description: string; due_date: string; received_at: string | null
  method: PaymentMethod | null; source: string; gross_amount: number; fee: number; net_amount: number; status: PaymentStatus
  patient_id: string | null; quote_id: string | null; installment_number: number | null; installment_count: number | null
  acquirer_id: string | null; bank_account_id: string | null; received_amount: number | null; notes: string | null
}
function toReceivable(r: ReceivableRow): Receivable {
  return {
    id: r.id, clinicId: r.clinic_id, code: r.code, description: r.description,
    dueDate: isoToBrDate(r.due_date) ?? '', receivedAt: isoToBrDate(r.received_at),
    method: r.method ?? undefined, source: r.source, grossAmount: Number(r.gross_amount), fee: Number(r.fee), status: r.status,
    patientId: r.patient_id ?? undefined, quoteId: r.quote_id ?? undefined,
    installmentNumber: r.installment_number ?? undefined, installmentCount: r.installment_count ?? undefined,
    acquirerId: r.acquirer_id ?? undefined, bankAccountId: r.bank_account_id ?? undefined,
    receivedAmount: r.received_amount != null ? Number(r.received_amount) : undefined, notes: r.notes ?? undefined,
  }
}
const RECEIVABLE_COLS = 'id, clinic_id, code, description, due_date, received_at, method, source, gross_amount, fee, net_amount, status, patient_id, quote_id, installment_number, installment_count, acquirer_id, bank_account_id, received_amount, notes'
export async function listReceivables(): Promise<Receivable[]> {
  const { data, error } = await supabase.from('receivable').select(RECEIVABLE_COLS).eq('clinic_id', clinic()).order('due_date')
  if (error) throw error
  return (data as ReceivableRow[]).map(toReceivable)
}

/** Campos do modal "Nova conta a receber" (avulsa, fora de orçamento). */
export interface NewReceivable {
  description: string
  source: string
  dueDate: string       // dd/mm/aaaa
  grossAmount: number
  notes?: string
}
export async function addReceivable(p: NewReceivable): Promise<void> {
  const row: ClientInsert<'receivable'> = {
    clinic_id: clinic(),
    description: p.description,
    source: p.source,
    due_date: brToIsoDate(p.dueDate)!,
    gross_amount: p.grossAmount,
    fee: 0,
    net_amount: p.grossAmount,   // avulsa: sem adquirente, líquido = bruto.
    notes: p.notes ?? null,
    // status → default 'pending'; code → trigger tr_code.
  }
  const { error } = await supabase.from('receivable').insert(row as Insert<'receivable'>)
  if (error) throw error
}

// ── Contas bancárias ─────────────────────────────────────────────────────────
type BankRow = {
  id: string; clinic_id: string; name: string; type: BankAccount['type']; bank: string | null; branch: string | null
  account_number: string | null; holder: string | null; opening_balance: number; status: BankAccount['status']; is_default: boolean; notes: string | null
}
export async function listBankAccounts(): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from('bank_account')
    .select('id, clinic_id, name, type, bank, branch, account_number, holder, opening_balance, status, is_default, notes')
    .eq('clinic_id', clinic()).order('name')
  if (error) throw error
  return (data as BankRow[]).map(r => ({
    id: r.id, clinicId: r.clinic_id, name: r.name, type: r.type, bank: r.bank ?? undefined, branch: r.branch ?? undefined,
    accountNumber: r.account_number ?? undefined, holder: r.holder ?? undefined, balance: Number(r.opening_balance),
    status: r.status, isDefault: r.is_default, notes: r.notes ?? undefined,
  }))
}

// ── Adquirentes (+ taxas de parcelamento) ────────────────────────────────────
export async function listAcquirers(): Promise<Acquirer[]> {
  const clinicId = clinic()
  const { data, error } = await supabase
    .from('acquirer')
    .select('id, clinic_id, name, card_brands, credit_fee, debit_fee, settlement_days, payout_account_id, status, notes')
    .eq('clinic_id', clinicId).order('name')
  if (error) throw error
  const acquirers = data ?? []
  if (acquirers.length === 0) return []

  const { data: rates, error: ratesError } = await supabase
    .from('acquirer_installment_rate')
    .select('acquirer_id, installments, fee')
    .in('acquirer_id', acquirers.map(a => a.id as string))
    .order('installments')
  if (ratesError) throw ratesError
  const byAcquirer = new Map<string, InstallmentRate[]>()
  for (const rt of rates ?? []) {
    const list = byAcquirer.get(rt.acquirer_id as string) ?? []
    list.push({ installments: rt.installments as number, fee: Number(rt.fee) })
    byAcquirer.set(rt.acquirer_id as string, list)
  }
  return acquirers.map(a => ({
    id: a.id as string, clinicId: a.clinic_id as string, name: a.name as string,
    cardBrands: (a.card_brands ?? []) as string[], creditFee: Number(a.credit_fee), debitFee: Number(a.debit_fee),
    installmentFees: byAcquirer.get(a.id as string), settlementDays: a.settlement_days as number,
    payoutAccountId: (a.payout_account_id as string) ?? undefined, status: a.status as Acquirer['status'], notes: (a.notes as string) ?? undefined,
  }))
}

// ── Baixas e estornos (o líquido/aberto são colunas GERADAS; enviamos só o recebido) ──
export interface SettlementInput {
  date: string; method?: PaymentMethod; bankAccountId?: string; amount: number; notes?: string
  cardBrand?: string; authorizationCode?: string; nsu?: string; installments?: number
}

export async function settlePayable(id: string, s: SettlementInput): Promise<void> {
  const { error } = await supabase.from('payable').update({
    status: 'paid', paid_at: brToIsoDate(s.date), payment_method: s.method ?? null,
    bank_account_id: s.bankAccountId ?? null, paid_amount: s.amount, ...(s.notes ? { notes: s.notes } : {}),
  }).eq('id', id)
  if (error) throw error
}

export async function settleReceivable(id: string, s: SettlementInput): Promise<void> {
  const { data, error } = await supabase
    .from('receivable').select('received_amount, net_amount').eq('id', id).single()
  if (error) throw error
  const totalReceived = Number(data.received_amount ?? 0) + s.amount
  const settled = totalReceived >= Number(data.net_amount) - 0.001
  // CHECK receivable_received_requires_date_ck: com received_amount > 0, received_at
  // é OBRIGATÓRIO — carimba-se a data em QUALQUER recebimento (parcial ou total).
  const { error: upError } = await supabase.from('receivable').update({
    status: settled ? 'paid' : 'pending', received_at: brToIsoDate(s.date),
    method: s.method ?? null, bank_account_id: s.bankAccountId ?? null, received_amount: totalReceived,
    ...(s.notes ? { notes: s.notes } : {}),
  }).eq('id', id)
  if (upError) throw upError
}

function formatBRLPlain(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export async function reversePayable(id: string): Promise<void> {
  const { data, error } = await supabase.from('payable').select('status, due_date, paid_at, notes').eq('id', id).single()
  if (error) throw error
  if (data.status !== 'paid') return
  const trail = `Baixa de ${isoToBrDate(data.paid_at) ?? '—'} estornada em ${new Date().toLocaleDateString('pt-BR')}.`
  const { error: upError } = await supabase.from('payable').update({
    status: openStatusIso(data.due_date), paid_at: null, payment_method: null, bank_account_id: null, paid_amount: null,
    notes: data.notes ? `${data.notes} · ${trail}` : trail,
  }).eq('id', id)
  if (upError) throw upError
}

export async function reverseReceivable(id: string): Promise<void> {
  const { data, error } = await supabase.from('receivable').select('status, due_date, received_amount, notes').eq('id', id).single()
  if (error) throw error
  if (data.status !== 'paid' && !data.received_amount) return
  const trail = `Recebimento de ${formatBRLPlain(Number(data.received_amount ?? 0))} estornado em ${new Date().toLocaleDateString('pt-BR')}.`
  const { error: upError } = await supabase.from('receivable').update({
    status: openStatusIso(data.due_date), received_at: null, bank_account_id: null, received_amount: 0,
    notes: data.notes ? `${data.notes} · ${trail}` : trail,
  }).eq('id', id)
  if (upError) throw upError
}

export interface BatchSettlementInput {
  date: string; method?: PaymentMethod; bankAccountId?: string; notes?: string
}
export async function settleReceivablesBatch(ids: string[], s: BatchSettlementInput): Promise<number> {
  if (ids.length === 0) return 0
  const { data, error } = await supabase
    .from('receivable').select('id, status, net_amount').in('id', ids)
  if (error) throw error
  let settled = 0
  for (const row of data ?? []) {
    if (row.status === 'paid' || row.status === 'canceled') continue
    const { error: upError } = await supabase.from('receivable').update({
      status: 'paid', received_at: brToIsoDate(s.date), method: s.method ?? null,
      bank_account_id: s.bankAccountId ?? null, received_amount: Number(row.net_amount),
      ...(s.notes ? { notes: s.notes } : {}),
    }).eq('id', row.id as string)
    if (upError) throw upError
    settled++
  }
  return settled
}

export async function cancelPayable(id: string): Promise<void> {
  const { error } = await supabase.from('payable').update({ status: 'canceled' }).eq('id', id)
  if (error) throw error
}
export async function cancelReceivable(id: string): Promise<void> {
  const { error } = await supabase.from('receivable').update({ status: 'canceled' }).eq('id', id)
  if (error) throw error
}

// ── Sessão do caixa ──────────────────────────────────────────────────────────
export async function getCashSession(): Promise<CashSession> {
  const { data, error } = await supabase
    .from('cash_session')
    .select('operator_name, opened_at, opening_amount, closed_at')
    .eq('clinic_id', clinic())
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data || data.closed_at) return { isOpen: false, openingAmount: 0 }
  return {
    isOpen: true,
    operator: data.operator_name ?? undefined,
    openedAt: fmtDateTime(data.opened_at),
    openingAmount: Number(data.opening_amount),
  }
}

export async function openCash(openingAmount: number): Promise<void> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  let operator = 'Operador'
  if (userId) {
    const { data: prof } = await supabase.from('profile').select('full_name').eq('id', userId).maybeSingle()
    operator = prof?.full_name ?? operator
  }
  const { error } = await supabase.from('cash_session').insert({
    clinic_id: clinic(), opened_by: userId ?? null, operator_name: operator, opening_amount: openingAmount,
  })
  if (error) throw error
}

export async function closeCash(): Promise<void> {
  const { data: userData } = await supabase.auth.getUser()
  const { error } = await supabase.from('cash_session')
    .update({ closed_at: new Date().toISOString(), closed_by: userData.user?.id ?? null })
    .eq('clinic_id', clinic()).is('closed_at', null)
  if (error) throw error
}

// ── CRUD de contas bancárias e adquirentes ───────────────────────────────────
export type EditBankAccount = ClientPayload<BankAccount>
export type EditAcquirer = ClientPayload<Acquirer>

function bankRow(p: EditBankAccount) {
  return {
    name: p.name, type: p.type, bank: p.bank ?? null, branch: p.branch ?? null,
    account_number: p.accountNumber ?? null, holder: p.holder ?? null, opening_balance: p.balance,
    status: p.status, is_default: p.isDefault ?? false, notes: p.notes ?? null,
  }
}
export async function addBankAccount(p: EditBankAccount): Promise<void> {
  const { error } = await supabase.from('bank_account').insert({ clinic_id: clinic(), ...bankRow(p) })
  if (error) throw error
}
export async function updateBankAccount(id: string, p: EditBankAccount): Promise<void> {
  const { error } = await supabase.from('bank_account').update(bankRow(p)).eq('id', id)
  if (error) throw error
}

function acquirerRow(p: EditAcquirer) {
  return {
    name: p.name, card_brands: p.cardBrands, credit_fee: p.creditFee, debit_fee: p.debitFee,
    settlement_days: p.settlementDays, payout_account_id: p.payoutAccountId ?? null, status: p.status, notes: p.notes ?? null,
  }
}
async function reconcileRates(clinicId: string, acquirerId: string, fees?: InstallmentRate[]): Promise<void> {
  if (fees === undefined) return
  const { error: delErr } = await supabase.from('acquirer_installment_rate').delete().eq('acquirer_id', acquirerId)
  if (delErr) throw delErr
  if (fees.length > 0) {
    const rows = fees.map(f => ({ clinic_id: clinicId, acquirer_id: acquirerId, installments: f.installments, fee: f.fee }))
    const { error: insErr } = await supabase.from('acquirer_installment_rate').insert(rows)
    if (insErr) throw insErr
  }
}
export async function addAcquirer(p: EditAcquirer): Promise<void> {
  const clinicId = clinic()
  const { data, error } = await supabase.from('acquirer').insert({ clinic_id: clinicId, ...acquirerRow(p) }).select('id').single()
  if (error) throw error
  await reconcileRates(clinicId, data.id, p.installmentFees)
}
export async function updateAcquirer(id: string, p: EditAcquirer): Promise<void> {
  const clinicId = clinic()
  const { error } = await supabase.from('acquirer').update(acquirerRow(p)).eq('id', id)
  if (error) throw error
  await reconcileRates(clinicId, id, p.installmentFees)
}

// ── Cobrança de inadimplentes ────────────────────────────────────────────────
export type NewCollectionAttempt = ClientPayload<CollectionAttempt>
type CollectionRow = {
  id: string; clinic_id: string; patient_id: string; attempt_date: string
  channel: CollectionAttempt['channel']; amount_charged: number; notes: string | null
}
export async function listCollectionAttempts(): Promise<CollectionAttempt[]> {
  const { data, error } = await supabase
    .from('collection_attempt')
    .select('id, clinic_id, patient_id, attempt_date, channel, amount_charged, notes')
    .eq('clinic_id', clinic()).order('attempt_date', { ascending: false })
  if (error) throw error
  return (data as CollectionRow[]).map(r => ({
    id: r.id, clinicId: r.clinic_id, patientId: r.patient_id, date: isoToBrDate(r.attempt_date) ?? '',
    channel: r.channel, amountCharged: Number(r.amount_charged), notes: r.notes ?? undefined,
  }))
}
export async function addCollectionAttempt(p: NewCollectionAttempt): Promise<void> {
  const attemptDate = brToIsoDate(p.date)
  if (!attemptDate) throw new Error('Data da tentativa de cobrança inválida.')
  const { error } = await supabase.from('collection_attempt').insert({
    clinic_id: clinic(), patient_id: p.patientId, attempt_date: attemptDate, channel: p.channel,
    amount_charged: p.amountCharged, notes: p.notes ?? null,
  })
  if (error) throw error
}
