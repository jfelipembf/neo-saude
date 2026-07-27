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

/**
 * CPF com máscara: '12345678901' → '123.456.789-01'.
 *
 * Existe porque documento impresso (receita, atestado) mostra CPF, e o valor
 * guardado é só dígito — sem isto sairia "12345678901" no papel. Entrada que
 * não tiver 11 dígitos volta como veio: melhor mostrar o que existe do que
 * esconder um cadastro pela metade.
 */
export function formatCpf(cpf: string | undefined | null) {
  const d = (cpf ?? '').replace(/\D/g, '')
  if (d.length !== 11) return cpf ?? ''
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** Telefone com máscara: 10 dígitos → (79) 9999-1234; 11 → (79) 99999-1234. */
export function formatPhone(phone: string | undefined | null) {
  const d = (phone ?? '').replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return phone ?? ''
}
