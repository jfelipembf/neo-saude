import { describe, expect, it } from 'vitest'
import { vezesCobradas } from './quotePerTooth'

describe('vezesCobradas', () => {
  // O bug que originou isto: "restauração no 26 e no 27" saía cobrando UMA.
  it('multiplica quando o dentista diz que é por dente', () => {
    expect(vezesCobradas(2, true)).toBe(2)
    expect(vezesCobradas(4, true)).toBe(4)
  })

  it('não multiplica quando ele diz que o valor é único', () => {
    expect(vezesCobradas(2, false)).toBe(1)
    expect(vezesCobradas(6, false)).toBe(1)
  })

  // Sem resposta, erra para o lado corrigível: o "× 2" aparece na prévia e o
  // dentista desfaz. Cobrar um quando eram dois sai da clínica sem ninguém ver.
  it('sem resposta, assume por dente', () => {
    expect(vezesCobradas(2)).toBe(2)
    expect(vezesCobradas(3, undefined)).toBe(3)
  })

  // Um dente não tem o que multiplicar — e devolver 0 zeraria o item.
  it('nunca multiplica com um dente ou nenhum', () => {
    expect(vezesCobradas(1, true)).toBe(1)
    expect(vezesCobradas(0, true)).toBe(1)
    expect(vezesCobradas(0)).toBe(1)
  })
})
