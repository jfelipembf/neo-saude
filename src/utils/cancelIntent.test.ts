import { describe, it, expect } from 'vitest'
import { pediuCancelamento } from './cancelIntent'

describe('pediuCancelamento — a primeira linha contra o cancelamento fantasma', () => {
  it('reconhece o pedido de verdade', () => {
    for (const f of [
      'cancela a das 15h', 'cancele a consulta de quinta', 'desmarca a de segunda',
      'desmarque essa consulta', 'remarca para outro dia', 'ela desistiu',
      'tira essa consulta da agenda', 'ela não vai mais poder vir',
    ]) expect(pediuCancelamento(f)).toBe(true)
  })

  it('ignora acento e caixa — a fala vem transcrita', () => {
    expect(pediuCancelamento('CANCELA a consulta')).toBe(true)
    expect(pediuCancelamento('nao vai mais vir')).toBe(true)
  })

  it('RECUSA o caso real: ruído que virou frase', () => {
    // "Senhor Nando." disparou uma tentativa de cancelamento no atendimento.
    expect(pediuCancelamento('Senhor Nando.')).toBe(false)
    expect(pediuCancelamento('Legendas pela comunidade Amara.org')).toBe(false)
    expect(pediuCancelamento('Orrrrrrrr.')).toBe(false)
    expect(pediuCancelamento('')).toBe(false)
    expect(pediuCancelamento(undefined)).toBe(false)
  })

  it('não confunde consultar com cancelar', () => {
    expect(pediuCancelamento('tenho consulta essa semana?')).toBe(false)
    expect(pediuCancelamento('quando é a consulta dela')).toBe(false)
    expect(pediuCancelamento('marca um retorno pra quinta')).toBe(false)
  })
})
