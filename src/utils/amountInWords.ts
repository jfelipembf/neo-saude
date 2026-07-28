/**
 * VALOR POR EXTENSO — o "(duzentos e cinquenta reais)" do recibo.
 *
 * Não é enfeite: num recibo o extenso é o que impede alterar o algarismo depois
 * de assinado, e é por isso que todo modelo de recibo brasileiro o traz. Como o
 * papel sai com o nome da clínica e vira comprovante do paciente, errar aqui é
 * emitir documento errado — daí ser função pura e testada, e não um `toLocale`
 * qualquer.
 */

const ATE_VINTE = [
  '', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
  'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis',
  'dezessete', 'dezoito', 'dezenove',
]
const DEZENAS = [
  '', '', 'vinte', 'trinta', 'quarenta', 'cinquenta',
  'sessenta', 'setenta', 'oitenta', 'noventa',
]
/** "cento" só existe acompanhado: 100 sozinho é "cem". */
const CENTENAS = [
  '', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos',
  'seiscentos', 'setecentos', 'oitocentos', 'novecentos',
]

/** 0–999 por extenso. Base de tudo: milhar e milhão são este bloco repetido. */
function ateNovecentos(n: number): string {
  if (n === 0) return ''
  if (n === 100) return 'cem'
  if (n < 20) return ATE_VINTE[n]

  if (n < 100) {
    const d = Math.floor(n / 10)
    const u = n % 10
    return u === 0 ? DEZENAS[d] : `${DEZENAS[d]} e ${ATE_VINTE[u]}`
  }

  const c = Math.floor(n / 100)
  const resto = n % 100
  return resto === 0 ? CENTENAS[c] : `${CENTENAS[c]} e ${ateNovecentos(resto)}`
}

/** Une as partes com "e" antes da última, como se fala. */
function juntar(partes: string[]): string {
  const cheias = partes.filter(Boolean)
  if (cheias.length === 0) return ''
  if (cheias.length === 1) return cheias[0]
  return `${cheias.slice(0, -1).join(', ')} e ${cheias.at(-1)}`
}

function inteiroPorExtenso(n: number): string {
  if (n === 0) return 'zero'

  const milhoes = Math.floor(n / 1_000_000)
  const milhares = Math.floor((n % 1_000_000) / 1000)
  const resto = n % 1000

  const partes = [
    milhoes ? `${milhoes === 1 ? 'um milhão' : `${ateNovecentos(milhoes)} milhões`}` : '',
    milhares ? `${milhares === 1 ? 'mil' : `${ateNovecentos(milhares)} mil`}` : '',
    ateNovecentos(resto),
  ]
  return juntar(partes)
}

/**
 * Reais por extenso, com os centavos.
 *
 * Arredonda para centavo ANTES de separar as partes: 0.1 + 0.2 em ponto
 * flutuante daria "trinta centavos" virando "vinte e nove", e recibo com
 * centavo errado é recibo contestável.
 */
export function valorPorExtenso(valor: number): string {
  const centavosTotais = Math.round(Math.abs(valor) * 100)
  const reais = Math.floor(centavosTotais / 100)
  const centavos = centavosTotais % 100

  const parteReais = reais === 1 ? 'um real' : `${inteiroPorExtenso(reais)} reais`
  const parteCentavos = centavos === 1 ? 'um centavo' : `${inteiroPorExtenso(centavos)} centavos`

  if (centavos === 0) return parteReais
  if (reais === 0) return parteCentavos
  return `${parteReais} e ${parteCentavos}`
}
