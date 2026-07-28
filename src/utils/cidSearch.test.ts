import { describe, expect, it } from 'vitest'
import { normalizarBuscaCid, pareceCodigoCid } from './cidSearch'

describe('normalizarBuscaCid', () => {
  // O caso que apareceu no uso: "CID-B34" não achava B349, que existe.
  it('tira o rótulo CID que o médico digita junto', () => {
    expect(normalizarBuscaCid('CID-B34').codigo).toBe('B34')
    expect(normalizarBuscaCid('cid b34').codigo).toBe('B34')
    expect(normalizarBuscaCid('CID10 B34').codigo).toBe('B34')
    expect(normalizarBuscaCid('cid-10 b34').codigo).toBe('B34')
  })

  it('tira o ponto do código, que a tabela não guarda', () => {
    expect(normalizarBuscaCid('B34.9').codigo).toBe('B349')
    expect(normalizarBuscaCid('J18.1').codigo).toBe('J181')
  })

  it('código puro passa intacto, em maiúsculas', () => {
    expect(normalizarBuscaCid('b349').codigo).toBe('B349')
  })

  // "CIDADE" começa com "cid" mas é busca por doença — o prefixo só sai quando
  // é separador ou "10" logo depois.
  it('não estraga palavra que começa com CID', () => {
    expect(normalizarBuscaCid('cidade').texto).toBe('ade')
  })

  it('busca por doença mantém o texto digitado', () => {
    expect(normalizarBuscaCid('pneumonia').texto).toBe('pneumonia')
    expect(normalizarBuscaCid('  fratura fêmur  ').texto).toBe('fratura fêmur')
  })
})

describe('pareceCodigoCid', () => {
  it('letra seguida de dígito é código', () => {
    expect(pareceCodigoCid('B34')).toBe(true)
    expect(pareceCodigoCid('J181')).toBe(true)
  })

  it('palavra não é código', () => {
    expect(pareceCodigoCid('PNEUMONIA')).toBe(false)
    expect(pareceCodigoCid('')).toBe(false)
  })
})
