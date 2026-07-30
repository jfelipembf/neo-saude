import { describe, expect, it } from 'vitest'
import { mensagemDoErro } from './observability'

/**
 * O que está sendo protegido aqui: a mensagem é a CHAVE DE AGRUPAMENTO do "top
 * erros". Se erros diferentes caírem todos em "[object Object]", o painel mostra
 * uma linha com 300 ocorrências que não diz nada — que é pior do que não ter
 * painel, porque parece informação.
 */
describe('mensagemDoErro', () => {
  it('usa a mensagem de um Error', () => {
    expect(mensagemDoErro(new Error('Falha ao salvar'))).toBe('Falha ao salvar')
  })

  it('cai no nome quando o Error não tem mensagem', () => {
    expect(mensagemDoErro(new TypeError())).toBe('TypeError')
  })

  it('aceita string lançada direto', () => {
    expect(mensagemDoErro('deu ruim')).toBe('deu ruim')
  })

  // O caso que motiva o arquivo: erro do Supabase/PostgREST não é `Error`.
  it('lê `message` de um erro do PostgREST', () => {
    const erro = { message: 'permission denied for table patient', code: '42501' }
    expect(mensagemDoErro(erro)).toBe('permission denied for table patient')
  })

  it('cai em `details` e depois em `hint` quando não há message', () => {
    expect(mensagemDoErro({ details: 'Key (id) is not present' })).toBe('Key (id) is not present')
    expect(mensagemDoErro({ hint: 'Perhaps you meant patient_id' })).toBe('Perhaps you meant patient_id')
  })

  // message vazio não é message: cair no JSON diz mais do que devolver ''.
  it('ignora campo de texto vazio e segue procurando', () => {
    expect(mensagemDoErro({ message: '   ', details: 'valor real' })).toBe('valor real')
  })

  it('serializa objeto sem nenhum campo conhecido', () => {
    expect(mensagemDoErro({ status: 500 })).toBe('{"status":500}')
  })

  // Sem este tratamento, JSON.stringify lançaria DENTRO do registrador de erro.
  it('não quebra com referência circular', () => {
    const circular: Record<string, unknown> = { a: 1 }
    circular.self = circular
    expect(mensagemDoErro(circular)).toBe('Erro não serializável')
  })

  it('trata null, undefined e número', () => {
    expect(mensagemDoErro(null)).toBe('null')
    expect(mensagemDoErro(undefined)).toBe('Erro desconhecido')
    expect(mensagemDoErro(404)).toBe('404')
  })
})
