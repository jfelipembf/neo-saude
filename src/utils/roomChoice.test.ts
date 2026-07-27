import { describe, it, expect } from 'vitest'
import { chooseRoom } from './roomChoice'

const DUAS = ['Sala 1', 'Sala 2']

describe('chooseRoom — quando NÃO perguntar', () => {
  it('clínica sem sala cadastrada: agenda sem sala', () => {
    expect(chooseRoom([])).toEqual({ ok: true })
    // Mesmo se ele falar um nome, não há o que resolver.
    expect(chooseRoom([], 'sala 2')).toEqual({ ok: true })
  })

  it('uma sala só: usa ela e não pergunta nada', () => {
    expect(chooseRoom(['Sala 1'])).toEqual({ ok: true, room: 'Sala 1' })
  })

  it('uma sala só ignora o que foi dito — não existe escolha a fazer', () => {
    expect(chooseRoom(['Consultório A'], 'sala 2')).toEqual({ ok: true, room: 'Consultório A' })
  })
})

describe('chooseRoom — quando perguntar', () => {
  it('duas salas e nada dito: recusa e devolve a lista', () => {
    const r = chooseRoom(DUAS)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.rooms).toEqual(DUAS)
  })

  it('nome que não existe: recusa dizendo qual não achou', () => {
    const r = chooseRoom(DUAS, 'sala 7')
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.reason).toContain('sala 7')
      expect(r.rooms).toEqual(DUAS)
    }
  })

  it('ambiguidade não se resolve no chute', () => {
    // "sala 1" casa com "Sala 1" e "Sala 10" na busca por aproximação — mas o
    // nome EXATO existe, então ganha. É o caso que justifica a ordem das regras.
    expect(chooseRoom(['Sala 1', 'Sala 10'], 'sala 1')).toEqual({ ok: true, room: 'Sala 1' })
    // Já "sala" sozinha casa com as duas e aí sim tem de perguntar.
    const r = chooseRoom(['Sala 1', 'Sala 10'], 'sala')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toContain('Mais de uma')
  })
})

describe('chooseRoom — o nome vem FALADO, não digitado', () => {
  it('ignora caixa e acento', () => {
    const salas = ['Consultório A', 'Consultório B']
    expect(chooseRoom(salas, 'consultorio a')).toEqual({ ok: true, room: 'Consultório A' })
    expect(chooseRoom(salas, 'CONSULTÓRIO B')).toEqual({ ok: true, room: 'Consultório B' })
  })

  it('ignora espaço sobrando', () => {
    expect(chooseRoom(DUAS, '  sala 2  ')).toEqual({ ok: true, room: 'Sala 2' })
  })

  it('casa por aproximação quando sobra uma só', () => {
    // "frente" só existe num dos nomes — não precisa dizer o nome inteiro.
    const salas = ['Consultório da frente', 'Consultório dos fundos']
    expect(chooseRoom(salas, 'frente')).toEqual({ ok: true, room: 'Consultório da frente' })
  })

  it('devolve o nome CANÔNICO do cadastro, não o que foi falado', () => {
    // É esse nome que vai para o payload e precisa bater com o cadastro.
    const r = chooseRoom(DUAS, 'sala 2')
    expect(r).toEqual({ ok: true, room: 'Sala 2' })
  })

  it('string vazia ou só espaço conta como "não disse"', () => {
    expect(chooseRoom(DUAS, '').ok).toBe(false)
    expect(chooseRoom(DUAS, '   ').ok).toBe(false)
  })
})
