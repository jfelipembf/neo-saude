import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  addAcquirer, addBankAccount, settlePayable, settleReceivable,
  cancelPayable, cancelReceivable, getCashFlow,
  getFinanceSeries, listAcquirers, listBankAccounts, listPayables,
  listReceivables, listPatientReceivables, updateAcquirer, updateBankAccount,
  reversePayable, reverseReceivable, settleReceivablesBatch,
  listCollectionAttempts, addCollectionAttempt, addPayable, addPayableSeries,
  listUnbilledSessions, billTreatmentSession,
} from '@/services/financeService'
import type {
  BatchSettlementInput, BillSessionInput, CashFlowHorizon, EditAcquirer, EditBankAccount,
  NewCollectionAttempt, NewPayable, RecurringPayableInput, SettlementInput,
} from '@/services/financeService'
import type { ChartPeriod } from '@/types/domain'

/**
 * Refaz TODO o módulo financeiro depois de um movimento de dinheiro.
 *
 * Cada mutation daqui invalidava só a própria lista, e o resultado era a tela
 * mentindo até o F5: dar baixa num título mudava a lista de recebíveis, mas
 * deixava o saldo do banco, o fluxo de caixa projetado, o gráfico do
 * dashboard, o extrato do paciente e a aba "A faturar" com o número velho.
 * Invalidar o prefixo inteiro custa um refetch a mais e elimina a classe de bug.
 *
 * `appointments.stats` entra junto porque a RPC dashboard_stats devolve
 * faturamento — é a mesma linha do dinheiro, em outra tela.
 */
export function invalidateFinance(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.finance.all })
  queryClient.invalidateQueries({ queryKey: queryKeys.appointments.stats })
}

/** Série financeira do gráfico; mantém a série anterior no ar durante a troca. */
export function useFinanceSeries(period: ChartPeriod, monthIso: string) {
  return useQuery({
    queryKey: queryKeys.finance.series(period, monthIso),
    queryFn: () => getFinanceSeries(period, monthIso),
    placeholderData: keepPreviousData,
  })
}

// ── Página Financeiro ────────────────────────────────────────────────────────
export function useCashFlow(days: CashFlowHorizon) {
  return useQuery({
    queryKey: queryKeys.finance.cashFlow(days),
    queryFn: () => getCashFlow(days),
  })
}

export function usePayables() {
  return useQuery({ queryKey: queryKeys.finance.payables, queryFn: listPayables })
}

export function useReceivables() {
  return useQuery({ queryKey: queryKeys.finance.receivables, queryFn: listReceivables })
}

/** Extrato de UM paciente (aba Pagamentos do perfil). */
export function usePatientReceivables(patientId: string) {
  return useQuery({
    queryKey: queryKeys.finance.byPatient(patientId),
    queryFn: () => listPatientReceivables(patientId),
    enabled: Boolean(patientId),
  })
}

// ── A faturar: a rede de segurança ───────────────────────────────────────────
export function useUnbilledSessions() {
  return useQuery({ queryKey: queryKeys.finance.unbilled, queryFn: listUnbilledSessions })
}

/** Fatura (ou marca como cortesia) um procedimento parado em "A faturar". */
export function useBillTreatmentSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, input }: { sessionId: string; input: BillSessionInput }) =>
      billTreatmentSession(sessionId, input),
    onSuccess: () => {
      invalidateFinance(queryClient)
      // O procedimento mudou de estado no PRONTUÁRIO também: a timeline do
      // paciente mostra a situação financeira de cada sessão.
      queryClient.invalidateQueries({ queryKey: queryKeys.treatments.all })
    },
  })
}

export function useBankAccounts() {
  return useQuery({ queryKey: queryKeys.finance.banks, queryFn: listBankAccounts })
}

export function useAcquirers() {
  return useQuery({ queryKey: queryKeys.finance.acquirers, queryFn: listAcquirers })
}

/** Dá settlement numa conta a pagar (modal Confirmar Pagamento) e refaz a lista. */
export function useSettlePayable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, settlement: settlement }: { id: string; settlement: SettlementInput }) => settlePayable(id, settlement),
    onSuccess: () => invalidateFinance(queryClient),
  })
}

/** Dá settlement numa conta a receber (modal Confirmar Recebimento) e refaz a lista. */
export function useSettleReceivable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, settlement: settlement }: { id: string; settlement: SettlementInput }) => settleReceivable(id, settlement),
    onSuccess: () => invalidateFinance(queryClient),
  })
}

/** Cadastra uma conta a pagar (modal "Nova conta a pagar") e refaz a lista. */
export function useAddPayable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NewPayable) => addPayable(payload),
    onSuccess: () => invalidateFinance(queryClient),
  })
}

/** Cadastra uma DESPESA RECORRENTE (mensal/semanal) — gera N contas a pagar. */
export function useAddPayableSeries() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RecurringPayableInput) => addPayableSeries(payload),
    onSuccess: () => invalidateFinance(queryClient),
  })
}

// NÃO existe useAddReceivable: título a receber nunca nasce digitado — vem do
// aceite do orçamento (parcelas do contrato) ou do faturamento do procedimento.

/** Cancela uma conta a pagar e refaz a lista. */
export function useCancelPayable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelPayable(id),
    onSuccess: () => invalidateFinance(queryClient),
  })
}

/** Cancela uma conta a receber e refaz a lista. */
export function useCancelReceivable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelReceivable(id),
    onSuccess: () => invalidateFinance(queryClient),
  })
}

// ── CRUD de contas bancárias e adquirentes ───────────────────────────────────
export function useSaveBankAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | null; payload: EditBankAccount }) =>
      id ? updateBankAccount(id, payload) : addBankAccount(payload),
    onSuccess: () => invalidateFinance(queryClient),
  })
}

export function useSaveAcquirer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | null; payload: EditAcquirer }) =>
      id ? updateAcquirer(id, payload) : addAcquirer(payload),
    onSuccess: () => invalidateFinance(queryClient),
  })
}

// ── Estorno de baixa ─────────────────────────────────────────────────────────
export function useReversePayable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reversePayable(id),
    onSuccess: () => invalidateFinance(queryClient),
  })
}

export function useReverseReceivable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reverseReceivable(id),
    onSuccess: () => invalidateFinance(queryClient),
  })
}

// ── Baixa em lote (fim de expediente / repasse de adquirente) ────────────────
export function useSettleReceivablesBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, settlement }: { ids: string[]; settlement: BatchSettlementInput }) =>
      settleReceivablesBatch(ids, settlement),
    onSuccess: () => invalidateFinance(queryClient),
  })
}

// ── Trilha de cobrança (aba Inadimplência) ───────────────────────────────────
export function useCollectionAttempts() {
  return useQuery({
    queryKey: queryKeys.finance.collections,
    queryFn: listCollectionAttempts,
  })
}

export function useAddCollectionAttempt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NewCollectionAttempt) => addCollectionAttempt(payload),
    onSuccess: () => invalidateFinance(queryClient),
  })
}
