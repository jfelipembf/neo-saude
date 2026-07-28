/**
 * IMC — o número e a faixa.
 *
 * O cálculo definitivo é do BANCO (`appointment.bmi` é coluna gerada): nunca
 * existe um IMC gravado que discorde do peso gravado. Esta função existe para
 * a PRÉVIA enquanto o médico digita, e por isso precisa dar exatamente o mesmo
 * resultado — mesma fórmula, mesmo arredondamento em 2 casas.
 */

/** Faixas da OMS, que é o que se usa em consultório adulto no Brasil. */
export interface FaixaImc {
  rotulo: string
  /** Para a cor na tela: fora do adequado é `alerta`, muito fora é `risco`. */
  tom: 'adequado' | 'alerta' | 'risco'
}

/**
 * IMC = peso / altura². Devolve `null` quando falta um dos dois ou quando o
 * valor está fora do fisiologicamente possível — os mesmos limites que o CHECK
 * do banco aplica, porque peso em grama e altura em metro são os dois erros de
 * digitação que produzem um IMC que *parece* número.
 */
export function calcularImc(pesoKg: number | null | undefined, alturaCm: number | null | undefined): number | null {
  const p = Number(pesoKg)
  const a = Number(alturaCm)
  if (!Number.isFinite(p) || !Number.isFinite(a)) return null
  if (p <= 0 || p > 500) return null
  if (a < 30 || a > 250) return null
  const m = a / 100
  return Math.round((p / (m * m)) * 100) / 100
}

/**
 * A faixa da OMS. Não aplica os pontos de corte de Lipschitz (idoso), que são
 * outros: dizer "eutrófico" para um idoso com IMC 21 seria uma afirmação
 * clínica que esta função não tem como sustentar sozinha. A tela mostra que a
 * referência é a da OMS, e a leitura fica com quem atende.
 */
export function faixaDoImc(imc: number | null): FaixaImc | null {
  if (imc === null) return null
  if (imc < 18.5) return { rotulo: 'Baixo peso', tom: 'alerta' }
  if (imc < 25)   return { rotulo: 'Peso adequado', tom: 'adequado' }
  if (imc < 30)   return { rotulo: 'Sobrepeso', tom: 'alerta' }
  if (imc < 35)   return { rotulo: 'Obesidade grau I', tom: 'risco' }
  if (imc < 40)   return { rotulo: 'Obesidade grau II', tom: 'risco' }
  return { rotulo: 'Obesidade grau III', tom: 'risco' }
}

/** '26,04' — vírgula decimal, como se escreve em prontuário brasileiro. */
export function imcPorExtenso(imc: number | null): string {
  return imc === null ? '—' : imc.toFixed(2).replace('.', ',')
}
