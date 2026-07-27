import { describe, expect, it } from 'vitest'
import { marcosPorDia, rotuloDoMarco, type SnapshotBruto } from './odontogramRevisions'

function s(sessionId: string, date: string, createdAt: string, description?: string): SnapshotBruto {
  return { sessionId, date, createdAt, description }
}

describe('marcosPorDia', () => {
  it('sem snapshot nenhum, não inventa marco', () => {
    expect(marcosPorDia([])).toEqual([])
  })

  it('um snapshot por dia vira um marco por dia', () => {
    const r = marcosPorDia([
      s('a', '2026-03-14', '2026-03-14T10:00:00Z'),
      s('b', '2026-05-02', '2026-05-02T09:00:00Z'),
    ])
    expect(r.map(m => m.date)).toEqual(['2026-03-14', '2026-05-02'])
    expect(r.every(m => m.registros === 1)).toBe(true)
  })

  // O caso real: 26 gravações do mesmo dia viram UMA marca.
  it('colapsa o dia inteiro numa marca só', () => {
    const r = marcosPorDia([
      s('a', '2026-07-26', '2026-07-26T01:00:00Z'),
      s('b', '2026-07-26', '2026-07-26T02:00:00Z'),
      s('c', '2026-07-26', '2026-07-26T03:00:00Z'),
    ])
    expect(r).toHaveLength(1)
    expect(r[0].registros).toBe(3)
  })

  // O ponto do arquivo inteiro: a marca é o estado em que a boca FICOU.
  it('a marca do dia é o ÚLTIMO snapshot dele', () => {
    const r = marcosPorDia([
      s('meio', '2026-07-26', '2026-07-26T02:00:00Z'),
      s('fim', '2026-07-26', '2026-07-26T03:00:00Z'),
      s('inicio', '2026-07-26', '2026-07-26T01:00:00Z'),
    ])
    expect(r[0].sessionId).toBe('fim')
  })

  it('a descrição vem do snapshot escolhido, não de outro do mesmo dia', () => {
    const r = marcosPorDia([
      s('a', '2026-07-26', '2026-07-26T01:00:00Z', 'Exame clínico'),
      s('b', '2026-07-26', '2026-07-26T05:00:00Z', 'Restauração 26'),
    ])
    expect(r[0].description).toBe('Restauração 26')
  })

  it('ordena do mais antigo para o mais recente, venha como vier do banco', () => {
    const r = marcosPorDia([
      s('c', '2026-07-26', '2026-07-26T01:00:00Z'),
      s('a', '2025-01-09', '2025-01-09T01:00:00Z'),
      s('b', '2026-03-14', '2026-03-14T01:00:00Z'),
    ])
    expect(r.map(m => m.date)).toEqual(['2025-01-09', '2026-03-14', '2026-07-26'])
  })

  it('empate em createdAt escolhe sempre o mesmo, não o que o banco mandou primeiro', () => {
    const mesmo = '2026-07-26T01:00:00Z'
    const a = marcosPorDia([s('x', '2026-07-26', mesmo), s('y', '2026-07-26', mesmo)])
    const b = marcosPorDia([s('y', '2026-07-26', mesmo), s('x', '2026-07-26', mesmo)])
    expect(a[0].sessionId).toBe(b[0].sessionId)
  })

  // Melhor perder a marca do que colocar a boca de um dia no lugar de outro.
  it('descarta snapshot sem data em vez de chutar uma', () => {
    const r = marcosPorDia([s('sem', '', '2026-07-26T01:00:00Z'), s('com', '2026-07-26', '2026-07-26T02:00:00Z')])
    expect(r).toHaveLength(1)
    expect(r[0].sessionId).toBe('com')
  })
})

describe('rotuloDoMarco', () => {
  const hoje = new Date(2026, 6, 26)

  it('no ano corrente mostra só dia e mês', () => {
    expect(rotuloDoMarco('2026-03-14', hoje)).toBe('14/03')
  })

  // Sem o ano, dois 14/03 de anos diferentes viram marcos idênticos.
  it('em outro ano mostra o ano', () => {
    expect(rotuloDoMarco('2025-03-14', hoje)).toBe('14/03/25')
  })

  it('não escorrega de dia por fuso', () => {
    expect(rotuloDoMarco('2026-01-01', hoje)).toBe('01/01')
    expect(rotuloDoMarco('2026-12-31', hoje)).toBe('31/12')
  })
})
