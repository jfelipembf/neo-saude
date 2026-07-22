/** 1234.5 → 'R$ 1.234,50' (moeda pt-BR). */
export function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * 1234.5 → '1.234,50' — dinheiro SEM o símbolo, para colunas estreitas.
 *
 * Existe para a matriz de metas, onde o "R$" fica no rótulo da linha e repeti-lo
 * em 12 células só empurraria o número para fora da coluna. Faz par com
 * `parseBRL`, que lê tanto esta forma quanto a de `formatBRL`.
 */
export function formatAmount(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** 3.5 → '3,5%' (percentual pt-BR, até 2 casas). */
export function formatPercent(v: number) {
  return `${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
}

/** 'R$ 1.234,50' | '1.234,50' | '1234,5' → número (NaN se inválido). */
export function parseBRL(text: string) {
  const cleaned = text.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
  return Number(cleaned)
}

/** '3,19' | '3.19' → 3.19 (percentuais digitados nos formulários). */
export function parsePercent(text: string) {
  return Number(text.replace(',', '.'))
}
