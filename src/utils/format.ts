/** 1234.5 → 'R$ 1.234,50' (moeda pt-BR). */
export function formatarReais(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** 3.5 → '3,5%' (percentual pt-BR, até 2 casas). */
export function formatarPercentual(v: number) {
  return `${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
}

/** 'R$ 1.234,50' | '1.234,50' | '1234,5' → número (NaN se inválido). */
export function parseReais(texto: string) {
  const limpo = texto.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
  return Number(limpo)
}
