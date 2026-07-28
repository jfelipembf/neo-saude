import { describe, it, expect } from 'vitest'
import { addMonths, addDays, parseBrDate, toIsoDate, toShortDateWithYear, localDate, formatLongDate, isoToBrDate } from './date'

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

// As duas formas que o Postgres devolve chegam aqui misturadas: `date` para
// vencimento e data do fato, `timestamptz` para created_at/updated_at.
describe('isoToBrDate — coluna date e coluna timestamptz', () => {
  it('converte a data pura sem escorregar de dia', () => {
    expect(isoToBrDate('2026-07-27')).toBe('27/07/2026')
  })

  // Era o bug do anexo: 'aaaa-mm-ddTHH:MM:SSZ' quebrado no '-' fazia
  // Number('27T12:34:56Z') virar NaN, e a tela exibia "NaN/NaN/NaN".
  it('converte o timestamp completo do banco', () => {
    expect(isoToBrDate('2026-07-27T12:34:56.789Z')).toBe('27/07/2026')
  })

  it('aceita também o timestamp separado por espaço', () => {
    expect(isoToBrDate('2026-07-27 12:34:56+00')).toBe('27/07/2026')
  })

  // O horário do timestamp é UTC e precisa virar hora local — no Brasil
  // (UTC-3) 02:10Z de dia 27 ainda é a noite do dia 26.
  it('traz o timestamp para o fuso local antes de cortar o dia', () => {
    const esperado = toShortDateWithYear(new Date('2026-07-27T02:10:00Z'))
    expect(isoToBrDate('2026-07-27T02:10:00Z')).toBe(esperado)
  })

  it('nulo e vazio não viram texto', () => {
    expect(isoToBrDate(null)).toBeUndefined()
    expect(isoToBrDate(undefined)).toBeUndefined()
    expect(isoToBrDate('')).toBeUndefined()
  })

  // Melhor o campo sumir do que a tela mostrar "NaN/NaN/NaN", que não avisa
  // o usuário nem de que houve erro.
  it('data impossível vira undefined, não NaN', () => {
    expect(isoToBrDate('nao-e-data')).toBeUndefined()
    expect(isoToBrDate('2026-13-45T99:99:99Z')).toBeUndefined()
  })
})

// Vai para o fecho de receita e atestado ("Aracaju, 26 de julho de 2026").
describe('formatLongDate — data por extenso de documento assinado', () => {
  it('escreve o mês por extenso, em minúscula, sem zero à esquerda no dia', () => {
    expect(formatLongDate('26/07/2026')).toBe('26 de julho de 2026')
    expect(formatLongDate('01/01/2027')).toBe('1 de janeiro de 2027')
    expect(formatLongDate('09/03/2026')).toBe('9 de março de 2026')
  })

  // Documento com data quebrada é pior que documento sem data — quem chama
  // decide o que fazer com a string vazia.
  it('devolve vazio em entrada que não é dd/mm/aaaa', () => {
    expect(formatLongDate('2026-07-26')).toBe('')
    expect(formatLongDate('26/13/2026')).toBe('')
    expect(formatLongDate('')).toBe('')
    expect(formatLongDate(undefined)).toBe('')
  })
})
