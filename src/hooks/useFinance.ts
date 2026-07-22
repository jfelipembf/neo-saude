import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  openCash, addAcquirer, addBankAccount, settlePayable, settleReceivable,
  cancelPayable, cancelReceivable, closeCash, getCashSession, getCashFlow,
  getFinanceSeries, listAcquirers, listBankAccounts, listPayables,
  listReceivables, listCashMovements, updateAcquirer, updateBankAccount,
  reversePayable, reverseReceivable, settleReceivablesBatch,
  listCollectionAttempts, addCollectionAttempt,
} from '@/services/financeService'
import type { BatchSettlementInput, EditAcquirer, EditBankAccount, NewCollectionAttempt, SettlementInput } from '@/services/financeService'
import type { ChartPeriod } from '@/types/domain'

/** Série financeira do gráfico; mantém a série anterior no ar durante a troca. */
export function useFinanceSeries(period: ChartPeriod, monthIso: string) {
  return useQuery({
    queryKey: queryKeys.finance.series(period, monthIso),
    queryFn: () => getFinanceSeries(period, monthIso),
    placeholderData: keepPreviousData,
  })
}

// ── Página Financeiro ────────────────────────────────────────────────────────
export function useCashMovements() {
  return useQuery({ queryKey: queryKeys.finance.cash, queryFn: listCashMovements })
}

export function useCashFlow() {
  return useQuery({ queryKey: queryKeys.finance.cashFlow, queryFn: getCashFlow })
}

export function usePayables() {
  return useQuery({ queryKey: queryKeys.finance.payables, queryFn: listPayables })
}

export function useReceivables() {
  return useQuery({ queryKey: queryKeys.finance.receivables, queryFn: listReceivables })
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.finance.payables }),
  })
}

/** Dá settlement numa conta a receber (modal Confirmar Recebimento) e refaz a lista. */
export function useSettleReceivable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, settlement: settlement }: { id: string; settlement: SettlementInput }) => settleReceivable(id, settlement),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.finance.receivables }),
  })
}

/** Cancela uma conta a pagar e refaz a lista. */
export function useCancelPayable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelPayable(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.finance.payables }),
  })
}

/** Cancela uma conta a receber e refaz a lista. */
export function useCancelReceivable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelReceivable(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.finance.receivables }),
  })
}

// ── Sessão do caixa (abrir/fechar) ───────────────────────────────────────────
export function useCashSession() {
  return useQuery({ queryKey: queryKeys.finance.cashSession, queryFn: getCashSession })
}

/** Abre o caixa com o fundo de troco informado. */
export function useOpenCash() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (openingAmount: number) => openCash(openingAmount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.finance.cash }),
  })
}

/** Fecha o caixa do dia. */
export function useCloseCash() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => closeCash(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.finance.cash }),
  })
}

// ── CRUD de contas bancárias e adquirentes ───────────────────────────────────
export function useSaveBankAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | null; payload: EditBankAccount }) =>
      id ? updateBankAccount(id, payload) : addBankAccount(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.finance.banks }),
  })
}

export function useSaveAcquirer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | null; payload: EditAcquirer }) =>
      id ? updateAcquirer(id, payload) : addAcquirer(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.finance.acquirers }),
  })
}

// ── Estorno de baixa ─────────────────────────────────────────────────────────
export function useReversePayable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reversePayable(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.finance.payables }),
  })
}

export function useReverseReceivable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reverseReceivable(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.finance.receivables }),
  })
}

// ── Baixa em lote (fim de expediente / repasse de adquirente) ────────────────
export function useSettleReceivablesBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, settlement }: { ids: string[]; settlement: BatchSettlementInput }) =>
      settleReceivablesBatch(ids, settlement),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.finance.receivables }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.finance.collections }),
  })
}
