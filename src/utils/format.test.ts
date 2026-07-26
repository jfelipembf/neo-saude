import { describe, expect, it } from 'vitest'
import { formatCpf, formatPhone } from './format'

// Estes dois vão para dentro de documento impresso e assinado (receita,
// atestado, solicitação de exame). O valor guardado é só dígito, então sem
// máscara o CPF sairia "12345678901" no papel entregue ao paciente.
describe('formatCpf', () => {
  it('aplica a máscara em 11 dígitos', () => {
    expect(formatCpf('12345678901')).toBe('123.456.789-01')
  })

  it('aceita valor que já vem mascarado sem duplicar pontuação', () => {
    expect(formatCpf('123.456.789-01')).toBe('123.456.789-01')
  })

  // Cadastro pela metade é comum; melhor imprimir o que existe do que sumir
  // com o dado — quem chama decide se mostra ou omite a linha.
  it('devolve como veio quando não tem 11 dígitos', () => {
    expect(formatCpf('123')).toBe('123')
    expect(formatCpf('')).toBe('')
    expect(formatCpf(undefined)).toBe('')
    expect(formatCpf(null)).toBe('')
  })
})

describe('formatPhone', () => {
  it('celular com 11 dígitos', () => {
    expect(formatPhone('79999371622')).toBe('(79) 99937-1622')
  })

  it('fixo com 10 dígitos', () => {
    expect(formatPhone('7932111234')).toBe('(79) 3211-1234')
  })

  it('devolve como veio em tamanho inesperado', () => {
    expect(formatPhone('5579999371622')).toBe('5579999371622')   // com DDI
    expect(formatPhone(undefined)).toBe('')
  })
})
