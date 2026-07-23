import { supabase } from '@/lib/supabase'
import { getCurrentClinicId, type ClientPayload } from '@/lib/tenant'
import type { Insert, ClientInsert } from '@/lib/db'
import { brToIsoDate, isoToBrDate, localDate } from '@/utils/date'
import type {
  Acquirer, BankAccount, Payable, Receivable, ReceivableDebtor,
  CashFlowDay, ChartPeriod, CollectionAttempt, FinancePoint, PaymentMethod, PaymentStatus, InstallmentRate,
  SessionBillingStatus, UnbilledSession,
} from '@/types/domain'

const clinic = () => getCurrentClinicId()

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

/** Horizontes oferecidos na tela (dias corridos a partir de hoje). Uma projeção
 *  é um horizonte ROLANTE — não um intervalo livre no passado —, então o
 *  controle é a escolha de quão longe olhar. A RPC cash_flow(int) aceita 1..365;
 *  esta lista é o subconjunto que a UI expõe. Ver CashFlowTab. */
export const CASH_FLOW_HORIZONS = [30, 60, 90] as const
export type CashFlowHorizon = (typeof CASH_FLOW_HORIZONS)[number]
const DEFAULT_CASH_FLOW_HORIZON: CashFlowHorizon = 30

/**
 * Fluxo de caixa projetado (RPC cash_flow). `baseBalance` é o SALDO APURADO —
 * abertura das contas ativas + tudo já recebido − tudo já pago —, o ponto de
 * partida do acumulado. `days` traz os próximos `days` dias (contando hoje) com
 * os títulos em ABERTO pela data de VENCIMENTO; o acumulado dia a dia é
 * calculado na tela, não aqui.
 *
 * `days` é validado contra CASH_FLOW_HORIZONS: o horizonte vem de um estado de
 * UI, mas confiar direto num número que vai para a RPC é como um valor de query
 * string entrar no banco sem conferência — cai no default se vier fora da lista.
 */
export async function getCashFlow(
  days: CashFlowHorizon = DEFAULT_CASH_FLOW_HORIZON,
): Promise<{ baseBalance: number; days: CashFlowDay[] }> {
  const horizon = CASH_FLOW_HORIZONS.includes(days) ? days : DEFAULT_CASH_FLOW_HORIZON
  const { data, error } = await supabase.rpc('cash_flow', { p_days: horizon })
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
  acquirer_id: string | null; debtor: ReceivableDebtor; treatment_session_id: string | null
  bank_account_id: string | null; received_amount: number | null; notes: string | null
}
function toReceivable(r: ReceivableRow): Receivable {
  return {
    id: r.id, clinicId: r.clinic_id, code: r.code, description: r.description,
    dueDate: isoToBrDate(r.due_date) ?? '', receivedAt: isoToBrDate(r.received_at),
    method: r.method ?? undefined, source: r.source, grossAmount: Number(r.gross_amount), fee: Number(r.fee), status: r.status,
    patientId: r.patient_id ?? undefined, quoteId: r.quote_id ?? undefined,
    installmentNumber: r.installment_number ?? undefined, installmentCount: r.installment_count ?? undefined,
    acquirerId: r.acquirer_id ?? undefined, debtor: r.debtor,
    treatmentSessionId: r.treatment_session_id ?? undefined, bankAccountId: r.bank_account_id ?? undefined,
    receivedAmount: r.received_amount != null ? Number(r.received_amount) : undefined, notes: r.notes ?? undefined,
  }
}
const RECEIVABLE_COLS = 'id, clinic_id, code, description, due_date, received_at, method, source, gross_amount, fee, net_amount, status, patient_id, quote_id, installment_number, installment_count, acquirer_id, debtor, treatment_session_id, bank_account_id, received_amount, notes'
export async function listReceivables(): Promise<Receivable[]> {
  const { data, error } = await supabase.from('receivable').select(RECEIVABLE_COLS).eq('clinic_id', clinic()).order('due_date')
  if (error) throw error
  return (data as ReceivableRow[]).map(toReceivable)
}

/**
 * Extrato financeiro de UM paciente — o que a aba "Pagamentos" do perfil mostra.
 *
 * Lê `receivable`, e não `public.payment`: aquela tabela está CONGELADA (zero
 * linhas, nenhum escritor em todo o src/ e sem GRANT de escrita desde a
 * migration de congelamento). A aba lia de lá e por isso vinha vazia para todo
 * mundo, inclusive para paciente com parcela de contrato aprovado em aberto.
 */
export async function listPatientReceivables(patientId: string): Promise<Receivable[]> {
  const { data, error } = await supabase
    .from('receivable').select(RECEIVABLE_COLS)
    .eq('clinic_id', clinic()).eq('patient_id', patientId)
    .order('due_date')
  if (error) throw error
  return (data as ReceivableRow[]).map(toReceivable)
}

// NÃO existe addReceivable avulso: título a receber nunca nasce digitado à mão —
// vem do aceite do orçamento (quotesService.approveQuote gera as parcelas) ou do
// faturamento do procedimento (billTreatmentSession, logo abaixo).

// ── A faturar: procedimento executado que ninguém cobrou ─────────────────────
/**
 * Mora aqui, e não em treatmentsService, porque a pergunta é FINANCEIRA ("o que
 * a clínica produziu e não cobrou?") e a porta é a feature 'finance'. As duas
 * RPCs são SECURITY DEFINER porque cruzam prontuário × financeiro: sem elas o
 * usuário do Financeiro precisaria de acesso ao prontuário inteiro para ver uma
 * lista de valores em aberto.
 *
 * O FILTRO POR CLÍNICA É NOSSO, e não da RPC, de propósito: `unbilled_sessions`
 * devolve TODAS as clínicas em que o usuário tem vínculo ativo
 * (`clinic_id = any(private.auth_clinic_ids())`), que é o mesmo recorte das
 * policies. Só que o resto do app — inclusive todas as outras listas deste
 * arquivo — trabalha na clínica CORRENTE (`getCurrentClinicId()`, resolvida por
 * `my_session()`). Sem este filtro, um usuário com vínculo em duas clínicas
 * veria na tela da clínica A o nome e o valor do paciente da clínica B, e o
 * botão "Faturar" geraria o título NA CLÍNICA B sem erro nenhum — a RPC
 * `bill_treatment_session` confere o vínculo com a clínica DA SESSÃO, e ele
 * existe. `clinic_user` tem UNIQUE (clinic_id, user_id), ou seja, o segundo
 * vínculo é permitido hoje; hoje ninguém tem dois, e é por isso que a falha
 * seria silenciosa até o primeiro dono com duas unidades.
 */
export async function listUnbilledSessions(): Promise<UnbilledSession[]> {
  const { data, error } = await supabase.rpc('unbilled_sessions')
  if (error) throw error
  const current = clinic()
  return (data ?? []).filter(r => r.clinic_id === current).map(r => ({
    id: r.id,
    clinicId: r.clinic_id,
    patientId: r.patient_id,
    patientName: r.patient_name,
    hasInsurance: r.has_insurance,
    pendingQuoteCode: r.pending_quote_code ?? undefined,
    treatmentId: r.treatment_id,
    treatmentName: r.treatment_name,
    description: r.description,
    date: isoToBrDate(r.performed_on) ?? '',
    professionalId: r.professional_id ?? undefined,
    amount: Number(r.amount),
  }))
}

/** Decisão tomada na aba "A faturar" sobre um procedimento parado. */
export interface BillSessionInput {
  dueDate?: string        // dd/mm/aaaa
  /** Preenchido = cortesia/garantia: não gera título, mas registra o motivo. */
  notBillableReason?: string
  /**
   * Cobrar assim mesmo — decisão humana e explícita. Vale para os DOIS desvios
   * da escada que existem para não cobrar ninguém automaticamente: paciente de
   * convênio e procedimento segurado por um contrato JÁ QUITADO. Nunca vence o
   * 'covered' (contrato com saldo em aberto): ali a dívida está viva e cobrar
   * de novo é cobrar duas vezes.
   */
  chargeAnyway?: boolean
}
export async function billTreatmentSession(sessionId: string, input: BillSessionInput): Promise<SessionBillingStatus> {
  const { data, error } = await supabase.rpc('bill_treatment_session', {
    p_session: sessionId,
    p_due_date: brToIsoDate(input.dueDate) ?? undefined,
    p_not_billable_reason: input.notBillableReason?.trim() || undefined,
    p_charge_anyway: input.chargeAnyway ?? false,
  })
  if (error) throw error
  return data as SessionBillingStatus
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

/**
 * A FORMA DE PAGAMENTO NÃO SE REESCREVE NA BAIXA.
 *
 * Dois estragos, os dois reais e os dois deste jeitinho `method: s.method ?? null`:
 *
 *  1. TÍTULO DE CARTÃO. Ele nasceu com a forma da VENDA e o CHECK
 *     `receivable_acquirer_is_card_ck` (acquirer_id null OR method null OR method
 *     in credit/debit) RECUSA trocá-la por pix/dinheiro/boleto. Como o
 *     PaymentModal abre com 'cash' selecionado, dar baixa numa parcela de
 *     maquininha pela aba Contas a Receber estourava
 *     "violates check constraint receivable_acquirer_is_card_ck" na cara do
 *     usuário — e na baixa em LOTE, que atualiza uma linha por vez sem
 *     transação, o lote parava no meio, deixando parte baixada e parte não.
 *  2. SEM FORMA ESCOLHIDA. O SettleModal e o "Confirmar repasse" da Conciliação
 *     mandam `method` vazio; gravar null APAGAVA a forma que o título já tinha.
 *     Um crédito que perde o `method` nunca mais é baixado sozinho — a rotina
 *     private.settle_card_receivables filtra `method = 'credit'`.
 *
 * Regra: título com adquirente mantém a forma da venda, sempre; sem adquirente,
 * só grava quando o usuário de fato escolheu uma.
 */
function methodPatch(s: { method?: PaymentMethod }, acquirerId: string | null): { method?: PaymentMethod } {
  if (acquirerId || !s.method) return {}
  return { method: s.method }
}

/**
 * Baixa via RPC ATÔMICA `settle_receivable`: o incremento de `received_amount`
 * é uma única UPDATE no banco. Antes era read-modify-write no cliente (lê o
 * recebido, soma, grava), e duas baixas parciais simultâneas se sobrescreviam —
 * a segunda partia do valor ANTES da primeira. A regra da forma da venda
 * (não reescrever no cartão; só gravar quando o usuário escolheu) mora agora
 * dentro da função (ver methodPatch, ainda usado na baixa em lote).
 */
export async function settleReceivable(id: string, s: SettlementInput): Promise<void> {
  const { error } = await supabase.rpc('settle_receivable', {
    p_id: id,
    p_amount: s.amount,
    p_date: brToIsoDate(s.date),
    p_method: s.method ?? null,
    p_bank: s.bankAccountId ?? null,
    p_notes: s.notes ?? null,
  })
  if (error) throw error
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
  const { data, error } = await supabase.from('receivable').select('status, due_date, received_amount, notes, acquirer_id').eq('id', id).single()
  if (error) throw error
  if (data.status !== 'paid' && !data.received_amount) return
  const trail = `Recebimento de ${formatBRLPlain(Number(data.received_amount ?? 0))} estornado em ${new Date().toLocaleDateString('pt-BR')}.`
  // Estorno de título de CARTÃO volta para 'pending', nunca 'overdue': quem deve
  // é a adquirente, e o CHECK receivable_acquirer_never_overdue_ck recusaria o
  // UPDATE inteiro — o estorno falharia em vez de estornar.
  const reopened = data.acquirer_id ? 'pending' : openStatusIso(data.due_date)
  const { error: upError } = await supabase.from('receivable').update({
    status: reopened, received_at: null, bank_account_id: null, received_amount: 0,
    // Estornar um repasse de cartão é dizer "este dinheiro NÃO caiu". Sem esta
    // marca a rotina diária o encontrava de novo (pending, sem recebimento, com
    // a data já passada) e rebaixava tudo na madrugada seguinte — o sistema
    // desfazendo, todo dia, a conferência que o humano fez no extrato.
    ...(data.acquirer_id ? { auto_settle_blocked: true } : {}),
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
    .from('receivable').select('id, status, net_amount, acquirer_id').in('id', ids)
  if (error) throw error
  let settled = 0
  for (const row of data ?? []) {
    if (row.status === 'paid' || row.status === 'canceled') continue
    // Mesma regra da baixa avulsa (ver methodPatch): o lote da Conciliação vem
    // SEM forma, e gravar null aqui apagaria o 'credit' de cada parcela — que é
    // justamente o que faz a rotina diária reconhecê-la como cartão.
    const { error: upError } = await supabase.from('receivable').update({
      status: 'paid', received_at: brToIsoDate(s.date), ...methodPatch(s, row.acquirer_id),
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

// NÃO existe sessão de caixa (abrir/fechar): a aba foi removida — conferência
// diária, se voltar, será um RELATÓRIO sobre as baixas (modelo Simples Dental),
// não um ritual de sessão. As tabelas cash_session/cash_movement seguem no
// banco, inertes, até uma limpeza de schema.

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
