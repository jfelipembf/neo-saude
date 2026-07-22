// Rótulos de dias da semana indexados por Date.getDay() (0 = Dom … 6 = Sáb).
export const DAY_OF_WEEK_SHORT: Record<number, string> = {
  0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb',
}

export const DAY_OF_WEEK_LONG: Record<number, string> = {
  0: 'Domingo', 1: 'Segunda-feira', 2: 'Terça-feira', 3: 'Quarta-feira',
  4: 'Quinta-feira', 5: 'Sexta-feira', 6: 'Sábado',
}

/**
 * Meses do ano, em ARRAY e não em Record: quem usa isto (a matriz de metas)
 * indexa por 0..11 — o mesmo índice de `Date.getMonth()` e o mesmo índice do
 * vetor `clinic_goal.monthly`, cuja posição 0 é janeiro. Um Record convidaria
 * a numerar de 1 a 12 e a matriz passaria a ler o mês errado por um.
 *
 * Escritos à mão, não por `toLocaleString('pt-BR', { month: 'short' })`: o
 * runtime devolve "jan." (minúsculo, com ponto) e varia entre navegadores —
 * cabeçalho de tabela não pode mudar de forma conforme o ICU do usuário.
 */
export const MONTHS_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

/** Nome por extenso do mês (títulos e textos de apoio). Mesma indexação 0..11. */
export const MONTHS_LONG = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
