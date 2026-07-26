import { describe, expect, it } from 'vitest'
import { normalizeBrazilianWhatsappNumber } from './whatsappNumber'

describe('normalizeBrazilianWhatsappNumber', () => {
  it.each([
    ['(82) 99999-9999', '5582999999999'],
    ['82 3333-4444', '558233334444'],
    ['+55 (82) 99999-9999', '5582999999999'],
    ['0055 82 99999-9999', '5582999999999'],
    ['0 82 99999-9999', '5582999999999'],
    ['015 82 99999-9999', '5582999999999'],
    ['5582999999999@s.whatsapp.net', '5582999999999'],
  ])('normaliza %s', (input, expected) => {
    expect(normalizeBrazilianWhatsappNumber(input)).toBe(expected)
  })

  it.each(['', '1234', '558299999999999', '998299999999'])(
    'recusa formato ambíguo ou inválido: %s',
    input => {
      expect(normalizeBrazilianWhatsappNumber(input)).toBeNull()
    },
  )
})
