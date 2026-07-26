import { describe, expect, it } from 'vitest'
import { requestsLowStockQuote } from './workflowIntent'

describe('requestsLowStockQuote', () => {
  it.each([
    'Verifique os materiais prestes a acabar e solicite um orçamento aos fornecedores.',
    'Veja o material em falta e faça uma cotação.',
    'Confira o estoque baixo e peça o valor aos representantes.',
    'Quais insumos estão no mínimo? Peça orçamento aos fornecedores.',
    'Verifique os materiais prestes a encerrar e solicite aos representantes.',
  ])('reconhece consulta de estoque com orçamento: %s', text => {
    expect(requestsLowStockQuote(text)).toBe(true)
  })

  it.each([
    'Quais materiais estão acabando?',
    'Solicite orçamento de resina.',
    'Confira os fornecedores cadastrados.',
    'Registre os materiais usados.',
  ])('não encadeia pedido incompleto: %s', text => {
    expect(requestsLowStockQuote(text)).toBe(false)
  })
})
