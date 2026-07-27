import { describe, expect, it } from 'vitest'
import {
  consultasDoDia, consultasNoHorario, perguntaAmplaDemais, textoDaOcupacao,
  PERGUNTA_DO_RECORTE, type ConsultaNaAgenda,
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

describe('perguntaAmplaDemais', () => {
  // "Como está minha agenda?" — nenhum recorte: é a pergunta que virava meio
  // minuto de locução lendo dia a dia quem está marcado e todas as vagas.
  it('sem dia, sem paciente e sem foco, é ampla demais', () => {
    expect(perguntaAmplaDemais({ temPacienteAlvo: false })).toBe(true)
  })

  it('um dia nomeado já é recorte suficiente', () => {
    expect(perguntaAmplaDemais({ data: '2026-07-31', temPacienteAlvo: false })).toBe(false)
  })

  // "essa semana" continua amplo: são 7 dias de lista.
  it('período de vários dias sem foco continua amplo', () => {
    expect(perguntaAmplaDemais({ data: '2026-07-31', dias: 7, temPacienteAlvo: false })).toBe(true)
  })

  it('dias sem data também é amplo', () => {
    expect(perguntaAmplaDemais({ dias: 7, temPacienteAlvo: false })).toBe(true)
  })

  // Perguntar sobre ALGUÉM já é o recorte: "a Ana tem consulta essa semana?"
  it('com paciente-alvo, nunca pergunta de volta', () => {
    expect(perguntaAmplaDemais({ dias: 7, temPacienteAlvo: true })).toBe(false)
    expect(perguntaAmplaDemais({ temPacienteAlvo: true })).toBe(false)
  })

  // Depois de ele escolher, a ferramenta responde — não pergunta de novo.
  it('com foco escolhido, responde mesmo sem dia', () => {
    expect(perguntaAmplaDemais({ temPacienteAlvo: false, foco: 'vagas' })).toBe(false)
    expect(perguntaAmplaDemais({ dias: 7, temPacienteAlvo: false, foco: 'agendamentos' })).toBe(false)
  })

  it('a pergunta oferece as três saídas', () => {
    expect(PERGUNTA_DO_RECORTE).toContain('agendamentos')
    expect(PERGUNTA_DO_RECORTE).toContain('horários livres')
    expect(PERGUNTA_DO_RECORTE).toContain('dia específico')
  })
})
