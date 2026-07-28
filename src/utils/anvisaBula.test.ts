import { describe, expect, it } from 'vitest'
import { bulaUrl, termoDeBusca } from './anvisaBula'

describe('bulaUrl', () => {
  it('monta o link do Bulário filtrado pelo nome', () => {
    expect(bulaUrl('AMOXICILINA'))
      .toBe('https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=AMOXICILINA')
  })

  // Nome de medicamento tem acento, espaço e '+' com frequência. Sem escapar,
  // o '+' vira espaço na query e a busca não acha nada — falha silenciosa, que
  // é a pior: o usuário vê a página da ANVISA vazia e culpa a ANVISA.
  it('escapa acento, espaço e sinal de mais', () => {
    const url = bulaUrl('DIPIRONA + CAFEÍNA')!
    expect(url).toContain('nomeProduto=DIPIRONA%20%2B%20CAF')
    expect(url).not.toContain('DIPIRONA + CAF')
  })

  it('sem nome não inventa link', () => {
    expect(bulaUrl('')).toBeNull()
    expect(bulaUrl('   ')).toBeNull()
    expect(bulaUrl(null)).toBeNull()
    expect(bulaUrl(undefined)).toBeNull()
  })
})

describe('termoDeBusca', () => {
  // "DIPIRONA (SÓDICA)" não existe como nome de produto na ANVISA; "DIPIRONA"
  // existe. O termo mais curto acha mais.
  it('tira o que está entre parênteses', () => {
    expect(termoDeBusca('DIPIRONA (SÓDICA)')).toBe('DIPIRONA')
    expect(termoDeBusca('CLORIDRATO DE LIDOCAÍNA (COM VASO)')).toBe('CLORIDRATO DE LIDOCAÍNA')
  })

  it('corta na vírgula', () => {
    expect(termoDeBusca('AMOXICILINA, TRIIDRATADA')).toBe('AMOXICILINA')
  })

  it('não estraga nome simples', () => {
    expect(termoDeBusca('DAKTARIN GEL ORAL')).toBe('DAKTARIN GEL ORAL')
    expect(termoDeBusca('ÁCIDO TRANEXÂMICO')).toBe('ÁCIDO TRANEXÂMICO')
  })

  it('normaliza espaço sobrando', () => {
    expect(termoDeBusca('  SPIDUFEN   770  ')).toBe('SPIDUFEN 770')
  })
})
