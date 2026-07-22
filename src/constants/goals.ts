// ─────────────────────────────────────────────────────────────────────────────
// Metas da clínica — rótulos pt e natureza de cada métrica.
//
// As CHAVES são as do enum `public.goal_metric` e as de `dashboard_stats() ->
// metrics`. Métrica nova entra em três lugares e nos três com o mesmo rótulo:
// o enum do banco, o tipo GoalMetric e este arquivo — o teste de paridade em
// `src/utils/metrics.test.ts` (bloco "constantes das métricas") falha se um
// deles ficar para trás.
// ─────────────────────────────────────────────────────────────────────────────
import type { GoalMetric } from '@/types/domain'

/**
 * Ordem em que as métricas aparecem na aba Metas e nos cartões do Dashboard.
 * Fonte única da ordem: a tela não reordena, e `Object.keys` de um Record não
 * dá garantia de ordem que valha a pena depender.
 */
export const GOAL_METRICS: GoalMetric[] = ['appointments', 'active_patients', 'revenue', 'expenses']

/** Rótulo curto da métrica (cabeçalho da linha na aba Metas). */
export const GOAL_METRIC_LABEL: Record<GoalMetric, string> = {
  appointments:    'Consultas do mês',
  active_patients: 'Pacientes ativos',
  revenue:         'Faturamento do mês',
  // "Gastos" e não "Despesas": é o termo que o app já usa para o MESMO número
  // na legenda do FinanceChart. Duas palavras para a mesma coisa fazem o
  // usuário procurar a diferença que não existe.
  expenses:        'Gastos do mês',
}

/** O que a métrica conta, para o texto de apoio da linha. */
export const GOAL_METRIC_HELP: Record<GoalMetric, string> = {
  appointments:    'Consultas não canceladas no mês corrente.',
  active_patients: 'Pacientes com cadastro ativo hoje.',
  revenue:         'Recebido no mês, pela data da baixa.',
  expenses:        'Pago no mês, pela data do pagamento.',
}

/**
 * Dinheiro ou contagem. Decide a máscara do campo (R$ vs. inteiro), a
 * formatação do valor na tela e — no Dashboard — o TOM da variação: em
 * `expenses`, subir é ruim (ver `GOAL_METRIC_HIGHER_IS_BETTER`).
 */
export const GOAL_METRIC_IS_MONEY: Record<GoalMetric, boolean> = {
  appointments:    false,
  active_patients: false,
  revenue:         true,
  expenses:        true,
}

/**
 * Se crescer é bom. Só `expenses` foge: gastar 20% a mais que no mês passado
 * é um número VERMELHO, e pintá-lo de verde só porque a seta aponta para cima
 * seria mentir com cor.
 */
export const GOAL_METRIC_HIGHER_IS_BETTER: Record<GoalMetric, boolean> = {
  appointments:    true,
  active_patients: true,
  revenue:         true,
  expenses:        false,
}
