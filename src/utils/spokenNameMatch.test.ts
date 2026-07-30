import { describe, expect, it } from 'vitest'
import { pareceMesmaPalavra, pareceMesmoNome } from './spokenNameMatch'

/**
 * O CASO REAL: "agende uma consulta amanhã para michele dotrovisk às 8" contra
 * "Michelle Dratovsky" no cadastro. As duas palavras falham no substring que a
 * busca digitada usa, e a resposta era "não encontrei paciente".
 */
describe('nome dito em voz alta', () => {
  it('acha o paciente do caso que originou isto', () => {
    expect(pareceMesmoNome('Michelle Dratovsky', 'michele dotrovisk')).toBe(true)
  })

  it('perdoa letra a mais ou a menos', () => {
    expect(pareceMesmaPalavra('michelle', 'michele')).toBe(true)
    expect(pareceMesmaPalavra('cristina', 'cristhina')).toBe(true)
    expect(pareceMesmaPalavra('nascimento', 'nacimento')).toBe(true)
  })

  // A distância de edição entre 'dratovsky' e 'dotrovisk' é SEIS — nenhum
  // limiar honesto as aproxima. Quem as aproxima é o esqueleto de consoantes.
  it('perdoa vogal trocada no meio de sobrenome estrangeiro', () => {
    expect(pareceMesmaPalavra('dratovsky', 'dotrovisk')).toBe(true)
  })

  // O que este arquivo NÃO faz: equivalência FONÉTICA — trocar k por c, w por
  // v, z por s. 'kowalski'/'covalsky' continuam distantes, e de propósito:
  // modelar som aproximaria também sobrenome que só se parece de longe, e o
  // custo de um falso positivo aqui é consulta marcada para outra pessoa. O
  // que está coberto é o erro de VOGAL, que é onde a transcrição de fato erra.
  // Aparecendo um caso real que precise de som, o lugar de tratar é aqui.
  it('não tenta adivinhar som, só vogal', () => {
    expect(pareceMesmaPalavra('kowalski', 'covalsky')).toBe(false)
  })

  it('aceita nome abreviado na fala', () => {
    expect(pareceMesmaPalavra('michelle', 'michel')).toBe(true)
    expect(pareceMesmoNome('Michelle Dratovsky', 'michelle')).toBe(true)
  })

  it('não depende de ordem nem de partícula', () => {
    expect(pareceMesmoNome('Maria de Souza', 'souza maria')).toBe(true)
  })

  it('continua achando o que a busca normal já achava', () => {
    expect(pareceMesmoNome('João Santos', 'joao')).toBe(true)
    expect(pareceMesmoNome('Ana Paula Ferreira', 'ana paula')).toBe(true)
  })
})

/**
 * FALSO POSITIVO AQUI É AGENDAR PARA A PESSOA ERRADA. Quando sobra mais de um
 * candidato quem chama pergunta qual — mas aproximar nomes que nada têm a ver
 * transformaria toda busca numa pergunta, e a ferramenta viraria ruído.
 */
describe('o que NÃO pode ser confundido', () => {
  it('nome curto não tolera erro nenhum', () => {
    expect(pareceMesmaPalavra('ana', 'ane')).toBe(false)
    expect(pareceMesmaPalavra('ivo', 'ivа'.normalize('NFC'))).toBe(false)
    expect(pareceMesmaPalavra('luiz', 'luis')).toBe(false)
  })

  it('sobrenomes diferentes seguem diferentes', () => {
    expect(pareceMesmaPalavra('silva', 'souza')).toBe(false)
    expect(pareceMesmaPalavra('ferreira', 'oliveira')).toBe(false)
    expect(pareceMesmaPalavra('rodrigues', 'domingues')).toBe(false)
  })

  it('não casa nome inteiro que só compartilha o primeiro', () => {
    expect(pareceMesmoNome('Ana Paula Ferreira', 'ana paula oliveira')).toBe(false)
  })

  it('termo vazio não acha ninguém', () => {
    expect(pareceMesmoNome('Michelle Dratovsky', '')).toBe(false)
    expect(pareceMesmoNome('Michelle Dratovsky', '   ')).toBe(false)
  })
})
