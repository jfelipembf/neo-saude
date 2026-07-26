import { describe, expect, it } from 'vitest'
import { resolverPedidoDeOrcamento, type MaterialDoCatalogo } from './quoteRequest'

const CREMER = { id: 'f1', nome: 'Dental Cremer Distribuidora', whatsapp: '79999110001' }
const SUL = { id: 'f2', nome: 'Dental Sul Distribuidora', whatsapp: '79999371622' }
const CIRURGICA = { id: 'f3', nome: 'Cirúrgica São Cristóvão', whatsapp: '79999371622' }

function material(
  nome: string, estoque: number, minimo: number, fornecedores = [CREMER],
): MaterialDoCatalogo {
  return { id: nome, nome, estoque, minimo, acabando: estoque <= minimo, fornecedores }
}

// O catálogo real da clínica no dia da falha.
const CATALOGO: MaterialDoCatalogo[] = [
  material('Resina Fotopolimerizável A2', 4, 10, [CREMER, SUL]),
  material('Broca Diamantada 1090', 2, 6, [CREMER]),
  material('Anestésico Lidocaína 2%', 30, 12, [CREMER]),
  material('Fio de Sutura 4-0', 12, 10, [CIRURGICA]),
  material('Sugador Descartável', 150, 50, [CIRURGICA]),
]

describe('material nomeado', () => {
  it('acha pelo nome exato', () => {
    const r = resolverPedidoDeOrcamento(CATALOGO, { material: 'Fio de Sutura 4-0' })
    expect(r).toEqual({ ok: true, materiais: [CATALOGO[3]] })
  })

  it('acha por parte do nome, sem depender de acento', () => {
    const r = resolverPedidoDeOrcamento(CATALOGO, { material: 'anestesico' })
    expect(r.ok && r.materiais[0].nome).toBe('Anestésico Lidocaína 2%')
  })

  it('com mais de um candidato, pergunta qual em vez de escolher sozinha', () => {
    const r = resolverPedidoDeOrcamento(CATALOGO, { material: 'broca' })
    const comDuasBrocas = [...CATALOGO, material('Broca Diamantada 3080', 9, 2)]
    const rr = resolverPedidoDeOrcamento(comDuasBrocas, { material: 'broca' })
    expect(r.ok).toBe(true)                       // só uma broca: resolve
    expect(rr.ok).toBe(false)                     // duas: pergunta
    expect(!rr.ok && rr.erro).toContain('Qual deles?')
  })

  it('nome que não existe em lugar nenhum devolve erro simples', () => {
    const r = resolverPedidoDeOrcamento(CATALOGO, { material: 'odontocol creme' })
    expect(r).toEqual({ ok: false, erro: 'Não encontrei "odontocol creme" no cadastro de materiais.' })
  })
})

// ⚠️ O caso que quebrou em atendimento real: "peça um orçamento ao Dental
// Cremer" — nome de FORNECEDOR chegando no campo do material.
describe('nome de fornecedor no lugar do material', () => {
  it('diz que é fornecedor, e não deixa a resposta como "não encontrei"', () => {
    const r = resolverPedidoDeOrcamento(CATALOGO, { material: 'dental creme' })
    expect(r.ok).toBe(false)
    expect(!r.ok && r.erro).toContain('é um FORNECEDOR')
    expect(!r.ok && r.erro).toContain('Dental Cremer Distribuidora')
  })

  it('lista os materiais daquele fornecedor, para ela perguntar qual', () => {
    const r = resolverPedidoDeOrcamento(CATALOGO, { material: 'dental creme' })
    expect(!r.ok && r.erro).toContain('Resina Fotopolimerizável A2')
    expect(!r.ok && r.erro).toContain('Broca Diamantada 1090')
  })

  it('destaca o que está em falta daquele fornecedor', () => {
    const r = resolverPedidoDeOrcamento(CATALOGO, { material: 'dental creme' })
    // Em falta: resina (4/10) e broca (2/6). Lidocaína (30/12) não.
    expect(!r.ok && r.erro).toMatch(/Em falta:.*Resina/)
    expect(!r.ok && r.erro).not.toMatch(/Em falta:.*Lidocaína/)
  })

  it('material de verdade ganha do nome de fornecedor parecido', () => {
    // "Dental Sul" é fornecedor; nenhum material se chama assim — mas se
    // houvesse, o material teria precedência.
    const comMaterialHomonimo = [...CATALOGO, material('Dental Sul Kit', 5, 1, [SUL])]
    const r = resolverPedidoDeOrcamento(comMaterialHomonimo, { material: 'Dental Sul Kit' })
    expect(r.ok).toBe(true)
  })
})

describe('pedido do que está em falta', () => {
  it('traz só o que está abaixo do mínimo', () => {
    const r = resolverPedidoDeOrcamento(CATALOGO, { emFalta: true })
    expect(r.ok && r.materiais.map(m => m.nome)).toEqual([
      'Resina Fotopolimerizável A2', 'Broca Diamantada 1090',
    ])
  })

  it('combinado com fornecedor, filtra pelos dois', () => {
    const r = resolverPedidoDeOrcamento(CATALOGO, { emFalta: true, fornecedor: 'Cirúrgica' })
    expect(r.ok).toBe(false)   // Cirúrgica não tem nada em falta
    expect(!r.ok && r.erro).toContain('Cirúrgica')
  })

  it('sem nada em falta, diz isso em vez de devolver lista vazia', () => {
    const cheio = [material('Resina', 100, 10), material('Broca', 50, 5)]
    const r = resolverPedidoDeOrcamento(cheio, { emFalta: true })
    expect(r).toEqual({ ok: false, erro: 'Nenhum material está abaixo do mínimo agora.' })
  })
})

describe('só o fornecedor, sem material', () => {
  it('lista o que ele fornece e pergunta qual', () => {
    const r = resolverPedidoDeOrcamento(CATALOGO, { fornecedor: 'Cirúrgica' })
    expect(r.ok).toBe(false)
    expect(!r.ok && r.erro).toContain('Fio de Sutura 4-0')
    expect(!r.ok && r.erro).toContain('Sugador Descartável')
    expect(!r.ok && r.erro).toContain('Qual material cotar?')
  })

  it('fornecedor desconhecido devolve erro próprio', () => {
    const r = resolverPedidoDeOrcamento(CATALOGO, { fornecedor: 'Fornecedor Inexistente' })
    expect(!r.ok && r.erro).toContain('Não encontrei materiais do fornecedor')
  })
})

describe('pedido vazio', () => {
  it('pede o que falta em vez de assumir alguma coisa', () => {
    const r = resolverPedidoDeOrcamento(CATALOGO, {})
    expect(r).toEqual({
      ok: false,
      erro: 'Diga o material a cotar, ou peça o orçamento do que está em falta.',
    })
  })
})
