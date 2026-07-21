import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  abrirCaixa, addAdquirente, addContaBancaria, baixarContaPagar, baixarContaReceber,
  cancelarContaPagar, cancelarContaReceber, fecharCaixa, getCaixaSessao, getFluxoCaixa,
  getSerieFinanceira, listAdquirentes, listContasBancarias, listContasPagar,
  listContasReceber, listMovimentosCaixa, updateAdquirente, updateContaBancaria,
} from '@/services/financeiroService'
import type { SettlementInput } from '@/services/financeiroService'
import type { Acquirer, BankAccount, ChartPeriod } from '@/types/domain'

/** Série financeira do gráfico; mantém a série anterior no ar durante a troca. */
export function useSerieFinanceira(periodo: ChartPeriod, mesIso: string) {
  return useQuery({
    queryKey: queryKeys.financeiro.serie(periodo, mesIso),
    queryFn: () => getSerieFinanceira(periodo, mesIso),
    placeholderData: keepPreviousData,
  })
}

// ── Página Financeiro ────────────────────────────────────────────────────────
export function useMovimentosCaixa() {
  return useQuery({ queryKey: queryKeys.financeiro.caixa, queryFn: listMovimentosCaixa })
}

export function useFluxoCaixa() {
  return useQuery({ queryKey: queryKeys.financeiro.fluxo, queryFn: getFluxoCaixa })
}

export function useContasPagar() {
  return useQuery({ queryKey: queryKeys.financeiro.pagar, queryFn: listContasPagar })
}

export function useContasReceber() {
  return useQuery({ queryKey: queryKeys.financeiro.receber, queryFn: listContasReceber })
}

export function useContasBancarias() {
  return useQuery({ queryKey: queryKeys.financeiro.bancos, queryFn: listContasBancarias })
}

export function useAdquirentes() {
  return useQuery({ queryKey: queryKeys.financeiro.adquirentes, queryFn: listAdquirentes })
}

/** Dá baixa numa conta a pagar (modal Confirmar Pagamento) e refaz a lista. */
export function useBaixarContaPagar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, baixa }: { id: string; baixa: SettlementInput }) => baixarContaPagar(id, baixa),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.financeiro.pagar }),
  })
}

/** Dá baixa numa conta a receber (modal Confirmar Recebimento) e refaz a lista. */
export function useBaixarContaReceber() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, baixa }: { id: string; baixa: SettlementInput }) => baixarContaReceber(id, baixa),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.financeiro.receber }),
  })
}

/** Cancela uma conta a pagar e refaz a lista. */
export function useCancelarContaPagar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelarContaPagar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.financeiro.pagar }),
  })
}

/** Cancela uma conta a receber e refaz a lista. */
export function useCancelarContaReceber() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelarContaReceber(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.financeiro.receber }),
  })
}

// ── Sessão do caixa (abrir/fechar) ───────────────────────────────────────────
export function useCaixaSessao() {
  return useQuery({ queryKey: queryKeys.financeiro.caixaSessao, queryFn: getCaixaSessao })
}

/** Abre o caixa com o fundo de troco informado. */
export function useAbrirCaixa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (valorAbertura: number) => abrirCaixa(valorAbertura),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.financeiro.caixa }),
  })
}

/** Fecha o caixa do dia. */
export function useFecharCaixa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => fecharCaixa(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.financeiro.caixa }),
  })
}

// ── CRUD de contas bancárias e adquirentes ───────────────────────────────────
export function useSalvarContaBancaria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dados }: { id: string | null; dados: Omit<BankAccount, 'id'> }) =>
      id ? updateContaBancaria(id, dados) : addContaBancaria(dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.financeiro.bancos }),
  })
}

export function useSalvarAdquirente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dados }: { id: string | null; dados: Omit<Acquirer, 'id'> }) =>
      id ? updateAdquirente(id, dados) : addAdquirente(dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.financeiro.adquirentes }),
  })
}
