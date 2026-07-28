import { describe, expect, it } from 'vitest'
import { valorPorExtenso } from './amountInWords'

describe('valorPorExtenso', () => {
  it('zero', () => {
    expect(valorPorExtenso(0)).toBe('zero reais')
  })

  // Singular tem forma própria — "um reais" num recibo assinado é vexame.
  it('singular do real e do centavo', () => {
    expect(valorPorExtenso(1)).toBe('um real')
    expect(valorPorExtenso(0.01)).toBe('um centavo')
    expect(valorPorExtenso(1.01)).toBe('um real e um centavo')
  })

  it('unidades e dezenas', () => {
    expect(valorPorExtenso(7)).toBe('sete reais')
    expect(valorPorExtenso(15)).toBe('quinze reais')
    expect(valorPorExtenso(42)).toBe('quarenta e dois reais')
  })

  // 100 sozinho é "cem"; acompanhado vira "cento e...". É o erro clássico.
  it('cem contra cento', () => {
    expect(valorPorExtenso(100)).toBe('cem reais')
    expect(valorPorExtenso(101)).toBe('cento e um reais')
    expect(valorPorExtenso(150)).toBe('cento e cinquenta reais')
  })

  it('centenas', () => {
    expect(valorPorExtenso(250)).toBe('duzentos e cinquenta reais')
    expect(valorPorExtenso(999)).toBe('novecentos e noventa e nove reais')
  })

  // "um mil" não se fala — é só "mil".
  it('mil sem o "um"', () => {
    expect(valorPorExtenso(1000)).toBe('mil reais')
    expect(valorPorExtenso(2000)).toBe('dois mil reais')
    expect(valorPorExtenso(1200)).toBe('mil e duzentos reais')
  })

  it('milhão no singular e no plural', () => {
    expect(valorPorExtenso(1_000_000)).toBe('um milhão reais')
    expect(valorPorExtenso(2_000_000)).toBe('dois milhões reais')
  })

  it('centavos junto dos reais', () => {
    expect(valorPorExtenso(250.5)).toBe('duzentos e cinquenta reais e cinquenta centavos')
    expect(valorPorExtenso(19.9)).toBe('dezenove reais e noventa centavos')
  })

  // Arredonda ANTES de separar: sem isso 0.1+0.2 (que em binário é
  // 0.30000000000000004) viraria "vinte e nove centavos", e recibo com centavo
  // errado é recibo contestável.
  it('não perde centavo por ponto flutuante', () => {
    expect(valorPorExtenso(0.1 + 0.2)).toBe('trinta centavos')
  })

  it('arredonda para o centavo mais próximo', () => {
    expect(valorPorExtenso(99.999)).toBe('cem reais')
    expect(valorPorExtenso(10.004)).toBe('dez reais')
    expect(valorPorExtenso(10.006)).toBe('dez reais e um centavo')
  })

  it('valor negativo sai como o módulo (recibo não tem valor negativo)', () => {
    expect(valorPorExtenso(-50)).toBe('cinquenta reais')
  })
})
