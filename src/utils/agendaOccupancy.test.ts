import { describe, expect, it } from 'vitest'
import {
  consultasDoDia, consultasNoHorario, textoDaOcupacao, type ConsultaNaAgenda,
} from './agendaOccupancy'

function consulta(
  id: string, startTime: string, endTime: string,
  extra?: Partial<ConsultaNaAgenda>,
): ConsultaNaAgenda {
  return {
    id,
    patientId: `pac-${id}`,
    date: '2026-07-31',
    startTime,
    endTime,
    activity: 'Consulta',
    status: 'scheduled',
    ...extra,
  }
}

const SEXTA: ConsultaNaAgenda[] = [
  consulta('a', '08:30', '09:30'),
  consulta('b', '10:00', '11:00'),
  consulta('c', '09:00', '10:00', { date: '2026-08-01' }),   // outro dia
  consulta('d', '09:00', '10:00', { status: 'canceled' }),
]

describe('consultasNoHorario', () => {
  // ⚠️ O caso que motiva o arquivo: comparar só o startTime diria "livre".
  it('a consulta das 8h30 AINDA ocupa as 9h', () => {
    const r = consultasNoHorario(SEXTA, '2026-07-31', '09:00')
    expect(r.map(c => c.id)).toEqual(['a'])
  })

  it('a consulta que TERMINA às 9h30 não ocupa as 9h30', () => {
    expect(consultasNoHorario(SEXTA, '2026-07-31', '09:30')).toEqual([])
  })

  it('pega no instante exato do início', () => {
    expect(consultasNoHorario(SEXTA, '2026-07-31', '08:30').map(c => c.id)).toEqual(['a'])
  })

  it('não mistura outro dia', () => {
    expect(consultasNoHorario(SEXTA, '2026-07-31', '09:15').map(c => c.id)).toEqual(['a'])
  })

  it('cancelada não ocupa', () => {
    // 'd' é 09:00–10:00 cancelada; só 'a' aparece.
    expect(consultasNoHorario(SEXTA, '2026-07-31', '09:10').map(c => c.id)).toEqual(['a'])
  })

  it('falta não ocupa', () => {
    const comFalta = [consulta('x', '14:00', '15:00', { status: 'no_show' })]
    expect(consultasNoHorario(comFalta, '2026-07-31', '14:30')).toEqual([])
  })

  it('horário realmente vazio devolve lista vazia', () => {
    expect(consultasNoHorario(SEXTA, '2026-07-31', '16:00')).toEqual([])
  })

  it('encaixe: duas consultas no mesmo horário voltam as duas, em ordem', () => {
    const sobrepostas = [
      consulta('tarde', '09:00', '10:00'),
      consulta('cedo', '08:45', '09:45'),
    ]
    expect(consultasNoHorario(sobrepostas, '2026-07-31', '09:15').map(c => c.id))
      .toEqual(['cedo', 'tarde'])
  })
})

describe('consultasDoDia', () => {
  it('só o dia pedido, em ordem de horário, sem canceladas', () => {
    expect(consultasDoDia(SEXTA, '2026-07-31').map(c => c.id)).toEqual(['a', 'b'])
  })

  it('dia sem nada devolve vazio', () => {
    expect(consultasDoDia(SEXTA, '2026-12-25')).toEqual([])
  })
})

describe('textoDaOcupacao', () => {
  const nome = (id: string) => ({ 'pac-a': 'Michelle Dratovsky', 'pac-b': 'Ana Souza' }[id] ?? '?')

  it('escreve hora, nome e atividade', () => {
    expect(textoDaOcupacao(consultasDoDia(SEXTA, '2026-07-31'), nome))
      .toBe('08:30 Michelle Dratovsky (Consulta); 10:00 Ana Souza (Consulta)')
  })

  it('sem consultas devolve string vazia, para quem chama decidir a frase', () => {
    expect(textoDaOcupacao([], nome)).toBe('')
  })

  it('sem atividade não deixa parêntese vazio', () => {
    const semAtividade = [consulta('a', '08:00', '09:00', { activity: '' })]
    expect(textoDaOcupacao(semAtividade, nome)).toBe('08:00 Michelle Dratovsky')
  })
})
