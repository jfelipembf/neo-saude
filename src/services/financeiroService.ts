import { gerarSerieFinanceira } from '@/mocks/serieFinanceira'
import {
  MOCK_ADQUIRENTES, MOCK_CAIXA_SESSAO, MOCK_CONTAS_BANCARIAS, MOCK_CONTAS_PAGAR,
  MOCK_CONTAS_RECEBER, MOCK_FLUXO_DIAS, MOCK_MOVIMENTOS_CAIXA, SALDO_BASE_FLUXO,
} from '@/mocks/financeiro'
import type {
  Acquirer, CashSession, BankAccount, Payable, Receivable,
  CashFlowDay, CashMovement, ChartPeriod, FinancePoint, PaymentMethod,
} from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('lancamentos')… mantendo a MESMA assinatura.
export async function getSerieFinanceira(periodo: ChartPeriod, mesIso: string): Promise<FinancePoint[]> {
  return gerarSerieFinanceira(periodo, mesIso)
}

// ── Página Financeiro ────────────────────────────────────────────────────────
export async function listMovimentosCaixa(): Promise<CashMovement[]> {
  return MOCK_MOVIMENTOS_CAIXA
}

export async function getFluxoCaixa(): Promise<{ saldoBase: number; dias: CashFlowDay[] }> {
  return { saldoBase: SALDO_BASE_FLUXO, dias: MOCK_FLUXO_DIAS }
}

export async function listContasPagar(): Promise<Payable[]> {
  return MOCK_CONTAS_PAGAR
}

export async function listContasReceber(): Promise<Receivable[]> {
  return MOCK_CONTAS_RECEBER
}

export async function listContasBancarias(): Promise<BankAccount[]> {
  return MOCK_CONTAS_BANCARIAS
}

export async function listAdquirentes(): Promise<Acquirer[]> {
  return MOCK_ADQUIRENTES
}

/** Dados do modal de baixa (Confirmar Pagamento / Recebimento). */
export interface SettlementInput {
  data: string             // dd/mm/aaaa
  forma?: PaymentMethod
  contaBancariaId?: string
  valor: number
  observacao?: string
}

/** Dá baixa numa conta a pagar com os dados do modal. */
export async function baixarContaPagar(id: string, baixa: SettlementInput): Promise<void> {
  const conta = MOCK_CONTAS_PAGAR.find(c => c.id === id)
  if (!conta) return
  Object.assign(conta, {
    status: 'pago',
    pagamento: baixa.data,
    formaPagamento: baixa.forma,
    contaBancariaId: baixa.contaBancariaId,
    valorPago: baixa.valor,
    ...(baixa.observacao ? { observacao: baixa.observacao } : {}),
  })
}

/**
 * Dá baixa numa conta a receber. Aceita recebimento PARCIAL: o valor acumula
 * e a conta só quita quando a soma cobre o líquido (bruto − taxa).
 */
export async function baixarContaReceber(id: string, baixa: SettlementInput): Promise<void> {
  const conta = MOCK_CONTAS_RECEBER.find(c => c.id === id)
  if (!conta) return
  const totalRecebido = (conta.valorRecebido ?? 0) + baixa.valor
  const liquido = conta.valorBruto - conta.taxa
  const quitou = totalRecebido >= liquido - 0.001
  Object.assign(conta, {
    status: quitou ? 'pago' : 'pendente',
    recebimento: quitou ? baixa.data : undefined,
    forma: baixa.forma ?? conta.forma,
    contaBancariaId: baixa.contaBancariaId ?? conta.contaBancariaId,
    valorRecebido: totalRecebido,
    ...(baixa.observacao ? { observacao: baixa.observacao } : {}),
  })
}

/** Cancela uma conta a pagar (após o ConfirmDialog). */
export async function cancelarContaPagar(id: string): Promise<void> {
  const conta = MOCK_CONTAS_PAGAR.find(c => c.id === id)
  if (conta) conta.status = 'cancelado'
}

/** Cancela uma conta a receber (após o ConfirmDialog). */
export async function cancelarContaReceber(id: string): Promise<void> {
  const conta = MOCK_CONTAS_RECEBER.find(c => c.id === id)
  if (conta) conta.status = 'cancelado'
}

// ── Sessão do caixa (abrir/fechar) ───────────────────────────────────────────
export async function getCaixaSessao(): Promise<CashSession> {
  // Cópia: a query não deve compartilhar a referência mutável do mock.
  return { ...MOCK_CAIXA_SESSAO }
}

/** Abre o caixa com o fundo de troco informado. */
export async function abrirCaixa(valorAbertura: number): Promise<void> {
  const agora = new Date()
  const abertoEm = `${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  Object.assign(MOCK_CAIXA_SESSAO, { aberto: true, valorAbertura, abertoEm, operador: 'Dra. Camila Duarte' })
}

/** Fecha o caixa (a contagem da gaveta fica registrada no fechamento real). */
export async function fecharCaixa(): Promise<void> {
  Object.assign(MOCK_CAIXA_SESSAO, { aberto: false, valorAbertura: 0, abertoEm: undefined, operador: undefined })
}

// ── CRUD de contas bancárias e adquirentes (mock em memória) ─────────────────
let proximaContaId = 100
let proximaAdquirenteId = 100

export async function addContaBancaria(dados: Omit<BankAccount, 'id'>): Promise<void> {
  MOCK_CONTAS_BANCARIAS.push({ id: `cb${proximaContaId++}`, ...dados })
}

export async function updateContaBancaria(id: string, dados: Omit<BankAccount, 'id'>): Promise<void> {
  const conta = MOCK_CONTAS_BANCARIAS.find(c => c.id === id)
  if (conta) Object.assign(conta, dados)
}

export async function addAdquirente(dados: Omit<Acquirer, 'id'>): Promise<void> {
  MOCK_ADQUIRENTES.push({ id: `aq${proximaAdquirenteId++}`, ...dados })
}

export async function updateAdquirente(id: string, dados: Omit<Acquirer, 'id'>): Promise<void> {
  const adquirente = MOCK_ADQUIRENTES.find(a => a.id === id)
  if (adquirente) Object.assign(adquirente, dados)
}
