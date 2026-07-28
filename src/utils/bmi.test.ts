import { describe, expect, it } from 'vitest'
import { calcularImc, faixaDoImc, imcPorExtenso } from './bmi'

describe('calcularImc', () => {
  // Os mesmos números que o banco devolveu na coluna gerada — se os dois
  // divergirem, a prévia mente sobre o que vai ser gravado.
  it('bate com o cálculo do banco', () => {
    expect(calcularImc(82.5, 178)).toBe(26.04)
    expect(calcularImc(90, 178)).toBe(28.41)
  })

  it('sem peso ou sem altura não inventa número', () => {
    expect(calcularImc(70, null)).toBeNull()
    expect(calcularImc(null, 170)).toBeNull()
    expect(calcularImc(undefined, undefined)).toBeNull()
  })

  // Peso em grama e altura em metro são OS dois erros de digitação — e os dois
  // produzem um IMC que parece número (70000/1,7² = 24221; 70/0,0175² = 228571).
  it('recusa peso em grama e altura em metro', () => {
    expect(calcularImc(70000, 170)).toBeNull()
    expect(calcularImc(70, 1.75)).toBeNull()
  })

  it('recusa zero e negativo', () => {
    expect(calcularImc(0, 170)).toBeNull()
    expect(calcularImc(-70, 170)).toBeNull()
  })

  it('aceita criança', () => {
    expect(calcularImc(15, 95)).toBe(16.62)
  })
})

describe('faixaDoImc — pontos de corte da OMS', () => {
  it('classifica cada faixa', () => {
    expect(faixaDoImc(17)!.rotulo).toBe('Baixo peso')
    expect(faixaDoImc(22)!.rotulo).toBe('Peso adequado')
    expect(faixaDoImc(27)!.rotulo).toBe('Sobrepeso')
    expect(faixaDoImc(32)!.rotulo).toBe('Obesidade grau I')
    expect(faixaDoImc(37)!.rotulo).toBe('Obesidade grau II')
    expect(faixaDoImc(45)!.rotulo).toBe('Obesidade grau III')
  })

  // As bordas são onde classificação erra: 24,9 é adequado, 25,0 já é sobrepeso.
  it('respeita a borda exata de cada corte', () => {
    expect(faixaDoImc(18.49)!.rotulo).toBe('Baixo peso')
    expect(faixaDoImc(18.5)!.rotulo).toBe('Peso adequado')
    expect(faixaDoImc(24.99)!.rotulo).toBe('Peso adequado')
    expect(faixaDoImc(25)!.rotulo).toBe('Sobrepeso')
    expect(faixaDoImc(29.99)!.rotulo).toBe('Sobrepeso')
    expect(faixaDoImc(30)!.rotulo).toBe('Obesidade grau I')
    expect(faixaDoImc(40)!.rotulo).toBe('Obesidade grau III')
  })

  it('sem IMC não há faixa', () => {
    expect(faixaDoImc(null)).toBeNull()
  })
})

describe('imcPorExtenso', () => {
  it('usa vírgula decimal e duas casas', () => {
    expect(imcPorExtenso(26.04)).toBe('26,04')
    expect(imcPorExtenso(30)).toBe('30,00')
  })

  it('sem IMC mostra travessão, não zero', () => {
    expect(imcPorExtenso(null)).toBe('—')
  })
})
