import { buildFinanceSeries } from '@/mocks/financeSeries'
import {
  MOCK_ACQUIRERS, MOCK_CASH_SESSION, MOCK_BANK_ACCOUNTS, MOCK_PAYABLES,
  MOCK_RECEIVABLES, MOCK_CASH_FLOW_DAYS, MOCK_CASH_MOVEMENTS, CASH_FLOW_BASE_BALANCE,
} from '@/mocks/finance'
import type {
  Acquirer, CashSession, BankAccount, Payable, Receivable,
  CashFlowDay, CashMovement, ChartPeriod, CollectionAttempt, FinancePoint, PaymentMethod,
} from '@/types/domain'
import { CURRENT_CLINIC, type ClientPayload } from '@/lib/tenant'
import { parseBrDate } from '@/utils/date'
import { MOCK_COLLECTION_ATTEMPTS } from '@/mocks/collectionAttempts'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('cash_movements')… mantendo a MESMA assinatura.
export async function getFinanceSeries(period: ChartPeriod, monthIso: string): Promise<FinancePoint[]> {
  return buildFinanceSeries(period, monthIso)
}

// ── Página Financeiro ────────────────────────────────────────────────────────
export async function listCashMovements(): Promise<CashMovement[]> {
  return MOCK_CASH_MOVEMENTS
}

export async function getCashFlow(): Promise<{ baseBalance: number; dias: CashFlowDay[] }> {
  return { baseBalance: CASH_FLOW_BASE_BALANCE, dias: MOCK_CASH_FLOW_DAYS }
}

// Cópias ({ ...x }) — devolver a MESMA referência faz o structural sharing do
// TanStack Query concluir que nada mudou e pular o re-render (regra do projeto).
export async function listPayables(): Promise<Payable[]> {
  return MOCK_PAYABLES.map(c => ({ ...c }))
}

export async function listReceivables(): Promise<Receivable[]> {
  return MOCK_RECEIVABLES.map(c => ({ ...c }))
}

export async function listBankAccounts(): Promise<BankAccount[]> {
  return MOCK_BANK_ACCOUNTS
}

export async function listAcquirers(): Promise<Acquirer[]> {
  return MOCK_ACQUIRERS
}

/** Dados do modal de baixa (Confirmar Pagamento / Recebimento). */
export interface SettlementInput {
  date: string             // dd/mm/aaaa
  method?: PaymentMethod
  bankAccountId?: string
  amount: number
  notes?: string
  // Dados da maquininha quando a baixa é no cartão (vêm do modal de pagamento).
  cardBrand?: string
  authorizationCode?: string
  nsu?: string
  installments?: number
}

/** Dá baixa numa conta a pagar com os dados do modal. */
export async function settlePayable(id: string, settlement: SettlementInput): Promise<void> {
  const payable = MOCK_PAYABLES.find(c => c.id === id)
  if (!payable) return
  Object.assign(payable, {
    status: 'paid',
    paidAt: settlement.date,
    paymentMethod: settlement.method,
    bankAccountId: settlement.bankAccountId,
    paidAmount: settlement.amount,
    ...(settlement.notes ? { notes: settlement.notes } : {}),
  })
}

/**
 * Dá baixa numa conta a receber. Aceita recebimento PARCIAL: o valor acumula
 * e a conta só quita quando a soma cobre o líquido (bruto − taxa).
 */
export async function settleReceivable(id: string, settlement: SettlementInput): Promise<void> {
  const receivable = MOCK_RECEIVABLES.find(c => c.id === id)
  if (!receivable) return
  const totalReceived = (receivable.receivedAmount ?? 0) + settlement.amount
  const netAmount = receivable.grossAmount - receivable.fee
  const settled = totalReceived >= netAmount - 0.001
  Object.assign(receivable, {
    status: settled ? 'paid' : 'pending',
    receivedAt: settled ? settlement.date : undefined,
    method: settlement.method ?? receivable.method,
    bankAccountId: settlement.bankAccountId ?? receivable.bankAccountId,
    receivedAmount: totalReceived,
    ...(settlement.notes ? { notes: settlement.notes } : {}),
  })
}

/** Status correto de uma conta em aberto: vencida se o vencimento já passou. */
function openStatus(dueDate: string): 'pending' | 'overdue' {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // Vencimento é por DIA, não por hora: uma conta que vence hoje continua
  // pendente até acabar o dia, só vira vencida a partir de amanhã.
  return parseBrDate(dueDate) < today ? 'overdue' : 'pending'
}

/**
 * ESTORNA a baixa de uma conta a pagar (recepção deu baixa errada). Volta a
 * pendente/vencida, limpa os dados da baixa e registra a trilha em `notes` —
 * no Supabase isso vira um evento em tabela de auditoria.
 */
export async function reversePayable(id: string): Promise<void> {
  const payable = MOCK_PAYABLES.find(c => c.id === id)
  if (!payable || payable.status !== 'paid') return
  const trail = `Baixa de ${payable.paidAt} estornada em ${new Date().toLocaleDateString('pt-BR')}.`
  Object.assign(payable, {
    status: openStatus(payable.dueDate),
    paidAt: undefined, paymentMethod: undefined, bankAccountId: undefined, paidAmount: undefined,
    notes: payable.notes ? `${payable.notes} · ${trail}` : trail,
  })
}

/** ESTORNA a baixa de uma conta a receber (inclusive recebimentos parciais). */
export async function reverseReceivable(id: string): Promise<void> {
  const receivable = MOCK_RECEIVABLES.find(c => c.id === id)
  if (!receivable || (receivable.status !== 'paid' && !receivable.receivedAmount)) return
  const trail = `Recebimento de ${formatBRLPlain(receivable.receivedAmount ?? 0)} estornado em ${new Date().toLocaleDateString('pt-BR')}.`
  Object.assign(receivable, {
    status: openStatus(receivable.dueDate),
    receivedAt: undefined, bankAccountId: undefined, receivedAmount: undefined,
    notes: receivable.notes ? `${receivable.notes} · ${trail}` : trail,
  })
}

/** R$ sem depender do utils de UI (o service não importa camada de formatação). */
function formatBRLPlain(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Dados comuns de uma baixa em LOTE (cada conta quita pelo próprio líquido). */
export interface BatchSettlementInput {
  date: string             // dd/mm/aaaa
  method?: PaymentMethod
  bankAccountId?: string
  notes?: string
}

/**
 * Dá baixa TOTAL em várias contas a receber de uma vez (fim de expediente,
 * confirmação de repasse da adquirente). Parcial não existe em lote de
 * propósito: quem precisa de parcial baixa uma a uma.
 */
export async function settleReceivablesBatch(ids: string[], settlement: BatchSettlementInput): Promise<number> {
  let settled = 0
  for (const id of ids) {
    const receivable = MOCK_RECEIVABLES.find(c => c.id === id)
    if (!receivable || receivable.status === 'paid' || receivable.status === 'canceled') continue
    Object.assign(receivable, {
      status: 'paid',
      receivedAt: settlement.date,
      method: settlement.method ?? receivable.method,
      bankAccountId: settlement.bankAccountId ?? receivable.bankAccountId,
      receivedAmount: receivable.grossAmount - receivable.fee,
      ...(settlement.notes ? { notes: settlement.notes } : {}),
    })
    settled++
  }
  return settled
}

/** Cancela uma conta a pagar (após o ConfirmDialog). */
export async function cancelPayable(id: string): Promise<void> {
  const payable = MOCK_PAYABLES.find(c => c.id === id)
  if (payable) payable.status = 'canceled'
}

/** Cancela uma conta a receber (após o ConfirmDialog). */
export async function cancelReceivable(id: string): Promise<void> {
  const receivable = MOCK_RECEIVABLES.find(c => c.id === id)
  if (receivable) receivable.status = 'canceled'
}

// ── Sessão do caixa (abrir/fechar) ───────────────────────────────────────────
export async function getCashSession(): Promise<CashSession> {
  // Cópia: a query não deve compartilhar a referência mutável do mock.
  return { ...MOCK_CASH_SESSION }
}

/** Abre o caixa com o fundo de troco informado. */
export async function openCash(openingAmount: number): Promise<void> {
  const now = new Date()
  const openedAt = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  Object.assign(MOCK_CASH_SESSION, { isOpen: true, openingAmount, openedAt, operator: 'Dra. Camila Duarte' })
}

/** Fecha o caixa (a contagem da gaveta fica registrada no fechamento real). */
export async function closeCash(): Promise<void> {
  Object.assign(MOCK_CASH_SESSION, { isOpen: false, openingAmount: 0, openedAt: undefined, operator: undefined })
}

// ── CRUD de contas bancárias e adquirentes (mock em memória) ─────────────────

/** Campos que o formulário envia (sem id/tenant — ver ClientPayload). */
export type EditBankAccount = ClientPayload<BankAccount>
export type EditAcquirer = ClientPayload<Acquirer>

let nextAccountId = 100
let nextAcquirerId = 100

export async function addBankAccount(payload: EditBankAccount): Promise<void> {
  MOCK_BANK_ACCOUNTS.push({ id: `cb${nextAccountId++}`, clinicId: CURRENT_CLINIC, ...payload })
}

export async function updateBankAccount(id: string, payload: EditBankAccount): Promise<void> {
  const account = MOCK_BANK_ACCOUNTS.find(c => c.id === id)
  if (account) Object.assign(account, payload)
}

export async function addAcquirer(payload: EditAcquirer): Promise<void> {
  MOCK_ACQUIRERS.push({ id: `aq${nextAcquirerId++}`, clinicId: CURRENT_CLINIC, ...payload })
}

export async function updateAcquirer(id: string, payload: EditAcquirer): Promise<void> {
  const acquirer = MOCK_ACQUIRERS.find(a => a.id === id)
  if (acquirer) Object.assign(acquirer, payload)
}

// ── Trilha de cobrança de inadimplentes (aba Inadimplência) ──────────────────

/** O que o formulário de registro envia (id/tenant nascem aqui). */
export type NewCollectionAttempt = ClientPayload<CollectionAttempt>

let nextAttemptId = 100

export async function listCollectionAttempts(): Promise<CollectionAttempt[]> {
  // Cópias — o cache do TanStack Query não deve apontar para o array mutável.
  return MOCK_COLLECTION_ATTEMPTS.map(a => ({ ...a }))
}

export async function addCollectionAttempt(payload: NewCollectionAttempt): Promise<void> {
  MOCK_COLLECTION_ATTEMPTS.push({ id: `ca${nextAttemptId++}`, clinicId: CURRENT_CLINIC, ...payload })
}
