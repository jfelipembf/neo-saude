import { describe, it, expect } from 'vitest'
import { addMonths, addDays, parseBrDate, toIsoDate, toShortDateWithYear, localDate } from './date'

// Datas são a fonte silenciosa de bug em software de clínica: vencimento de
// parcela que pula o mês, dia da semana que escorrega no fuso, fim de mês que
// vira o mês seguinte. Os casos abaixo são exatamente os que já morderam.

describe('addMonths — vencimento de parcela', () => {
  it('não transborda quando o dia não existe no mês destino', () => {
    // 31/01 + 1 mês tem de virar 28/02, não 03/03. É o bug clássico de
    // setMonth(): o JS "corrige" a data para frente e a parcela vence no mês
    // errado, atrasando a cobrança inteira.
    expect(toShortDateWithYear(addMonths(new Date(2026, 0, 31), 1))).toBe('28/02/2026')
  })

  it('respeita ano bissexto', () => {
    expect(toShortDateWithYear(addMonths(new Date(2028, 0, 31), 1))).toBe('29/02/2028')
  })

  it('mantém o dia quando ele existe no mês destino', () => {
    expect(toShortDateWithYear(addMonths(new Date(2026, 0, 15), 1))).toBe('15/02/2026')
  })

  it('atravessa a virada de ano', () => {
    expect(toShortDateWithYear(addMonths(new Date(2026, 11, 10), 1))).toBe('10/01/2027')
  })

  it('gera as 3 parcelas de um orçamento sem repetir nem pular mês', () => {
    const inicio = new Date(2026, 0, 31)
    const vencimentos = [0, 1, 2].map(k => toShortDateWithYear(addMonths(inicio, k)))
    expect(vencimentos).toEqual(['31/01/2026', '28/02/2026', '31/03/2026'])
  })
})

describe('addDays — previsão de repasse da adquirente', () => {
  it('soma D+N atravessando o fim do mês', () => {
    // Venda em 28/02 com adquirente D+2 cai em 02/03.
    expect(toShortDateWithYear(addDays(new Date(2026, 1, 28), 2))).toBe('02/03/2026')
  })

  it('não muta a data original', () => {
    const original = new Date(2026, 5, 10)
    addDays(original, 30)
    expect(toShortDateWithYear(original)).toBe('10/06/2026')
  })
})

describe('parseBrDate / localDate — fuso', () => {
  it('interpreta dd/mm/aaaa no fuso LOCAL, sem escorregar de dia', () => {
    const d = parseBrDate('01/07/2026')
    expect(d.getDate()).toBe(1)
    expect(d.getMonth()).toBe(6)
    expect(d.getFullYear()).toBe(2026)
  })

  it('localDate não usa UTC — o dia da semana continua correto no Brasil', () => {
    // new Date('2026-07-01') seria meia-noite UTC = 30/06 21h no horário de
    // Brasília, e o dia da semana da agenda sairia errado.
    const d = localDate('2026-07-01')
    expect(d.getDate()).toBe(1)
    expect(d.getDay()).toBe(new Date(2026, 6, 1).getDay())
  })

  it('faz ida e volta entre os dois formatos', () => {
    expect(toIsoDate(parseBrDate('22/07/2026'))).toBe('2026-07-22')
  })
})
