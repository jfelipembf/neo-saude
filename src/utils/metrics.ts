// ─────────────────────────────────────────────────────────────────────────────
// Contas das métricas do Dashboard — funções puras, sem React e sem texto.
//
// Ficam aqui, e não dentro da página, porque são exatamente o tipo de conta que
// erra em silêncio: divisão por zero vira Infinity, e Infinity formatado vira
// "+∞% vs. mês anterior" na tela de um cliente. Fora da página, dá para testar.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Variação percentual do mês corrente sobre o anterior, ou `null` quando a
 * comparação NÃO EXISTE. Os dois casos de null:
 *
 *   `previous == null` — não há mês anterior comparável. Nenhuma das quatro
 *                        métricas atuais produz isso (todas são de fluxo); o
 *                        caso segue tratado porque quem sumiu foi a métrica de
 *                        estoque, não a possibilidade de uma nova aparecer.
 *   `previous === 0`   — o mês anterior foi zero. Qualquer número dividido por
 *                        zero é infinito, e "+∞%" (ou "+100%" por um crescimento
 *                        de 0 para 1) diz muito mais do que o dado sustenta —
 *                        clínica no primeiro mês de uso cairia toda aqui.
 *
 * Quem recebe `null` NÃO deve exibir variação: nenhuma tendência é melhor que
 * uma tendência inventada, porque a inventada é lida como se fosse real.
 */
export function percentChange(current: number, previous: number | null): number | null {
  if (previous == null || previous === 0) return null
  return ((current - previous) / previous) * 100
}

/**
 * Quanto da meta já foi cumprido, em % — NÃO limitado a 100: superar a meta em
 * 50% é informação, e capar em 100% a esconderia.
 * `null` quando não há meta (ou quando ela é inválida, o que o CHECK do banco
 * já impede, mas o front não depende disso para não dividir por zero).
 */
export function goalProgress(current: number, target: number | null): number | null {
  if (target == null || target <= 0) return null
  return Math.round((current / target) * 100)
}
