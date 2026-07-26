import { describe, expect, it } from 'vitest'
import {
  checkSlot, formatFreeStartRanges, freeSlotsOfDay, nextFreeSlots,
  type AvailabilityInput, mergeFreeSlots,
} from './availability'
import type { ScheduledAppointment } from '@/types/domain'

const HOJE = '2026-07-27'          // uma segunda-feira
const SEGUNDA = '2026-07-27'
const TERCA = '2026-07-28'

/** Grade padrão: segunda e terça, das 9h às 12h (blocos de 1h). */
function base(over: Partial<AvailabilityInput> = {}): AvailabilityInput {
  return {
    template: [
      { weekday: 1, hour: 9 }, { weekday: 1, hour: 10 }, { weekday: 1, hour: 11 },
      { weekday: 2, hour: 9 }, { weekday: 2, hour: 10 }, { weekday: 2, hour: 11 },
    ],
    blocked: [],
    absences: [],
    appointments: [],
    ...over,
  }
}

function consulta(date: string, startTime: string, endTime: string, status = 'scheduled'): ScheduledAppointment {
  return {
    id: `${date}-${startTime}`, clinicId: 'c', patientId: 'p', activity: 'Consulta',
    date, startTime, endTime, professionalId: 'prof', status: status as ScheduledAppointment['status'],
  }
}

describe('checkSlot', () => {
  it('aceita horário dentro da grade, livre', () => {
    expect(checkSlot(base(), SEGUNDA, '09:00', 60, HOJE)).toBeNull()
  })

  it('recusa data passada', () => {
    expect(checkSlot(base(), '2026-07-01', '09:00', 60, HOJE)).toBe('passado')
  })

  // O modal antigo LIBERAVA tudo quando a grade estava vazia — e a grade nasce
  // vazia. Era validação que simplesmente não existia numa clínica nova.
  it('recusa quando o profissional não tem grade cadastrada', () => {
    expect(checkSlot(base({ template: [] }), SEGUNDA, '09:00', 60, HOJE)).toBe('sem-grade')
  })

  it('recusa fora da grade recorrente', () => {
    expect(checkSlot(base(), SEGUNDA, '15:00', 60, HOJE)).toBe('fora-da-grade')
    expect(checkSlot(base(), '2026-07-29', '09:00', 60, HOJE)).toBe('fora-da-grade')  // quarta
  })

  // Estes dois o modal ignorava: dava para agendar em cima das férias.
  it('recusa em dia de ausência', () => {
    const a = base({ absences: [{ id: 'a', professionalId: 'prof', startDate: SEGUNDA, endDate: TERCA }] })
    expect(checkSlot(a, SEGUNDA, '09:00', 60, HOJE)).toBe('ausencia')
  })

  it('recusa em hora bloqueada', () => {
    const a = base({ blocked: [{ date: SEGUNDA, hour: 10 }] })
    expect(checkSlot(a, SEGUNDA, '10:00', 60, HOJE)).toBe('bloqueio')
  })

  it('recusa quando já existe consulta no horário', () => {
    const a = base({ appointments: [consulta(SEGUNDA, '09:00', '10:00')] })
    expect(checkSlot(a, SEGUNDA, '09:00', 60, HOJE)).toBe('ocupado')
    expect(checkSlot(a, SEGUNDA, '09:30', 60, HOJE)).toBe('ocupado')   // sobreposição parcial
  })

  // Cancelada e falta liberam o espaço — mesmo recorte das travas do banco.
  it('consulta cancelada ou falta não ocupa', () => {
    expect(checkSlot(base({ appointments: [consulta(SEGUNDA, '09:00', '10:00', 'canceled')] }), SEGUNDA, '09:00', 60, HOJE)).toBeNull()
    expect(checkSlot(base({ appointments: [consulta(SEGUNDA, '09:00', '10:00', 'no_show')] }), SEGUNDA, '09:00', 60, HOJE)).toBeNull()
  })

  // A grade é de hora cheia, mas a consulta tem duração livre: uma de 90 min às
  // 11:00 invade as 12h, que não está na grade.
  it('checa TODAS as horas que a duração atravessa, não só a de início', () => {
    expect(checkSlot(base(), SEGUNDA, '11:00', 60, HOJE)).toBeNull()
    expect(checkSlot(base(), SEGUNDA, '11:00', 90, HOJE)).toBe('fora-da-grade')
  })
})

describe('freeSlotsOfDay', () => {
  it('oferece de 30 em 30 dentro da grade', () => {
    const livres = freeSlotsOfDay(base(), SEGUNDA, 60, HOJE)
    expect(livres.map(s => s.start)).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00'])
  })

  it('pula o que está ocupado', () => {
    const a = base({ appointments: [consulta(SEGUNDA, '09:00', '10:00')] })
    expect(freeSlotsOfDay(a, SEGUNDA, 60, HOJE).map(s => s.start)).toEqual(['10:00', '10:30', '11:00'])
  })

  it('não oferece como início a hora em que a última vaga termina', () => {
    const a = base({ appointments: [consulta(SEGUNDA, '11:00', '12:00')] })
    const blocos = mergeFreeSlots(freeSlotsOfDay(a, SEGUNDA, 60, HOJE))
    expect(formatFreeStartRanges(blocos)).toBe('09:00 a 10:00')
  })

  it('devolve vazio em dia de ausência, sem grade, ou no passado', () => {
    expect(freeSlotsOfDay(base({ absences: [{ id: 'a', professionalId: 'prof', startDate: SEGUNDA, endDate: SEGUNDA }] }), SEGUNDA, 60, HOJE)).toEqual([])
    expect(freeSlotsOfDay(base({ template: [] }), SEGUNDA, 60, HOJE)).toEqual([])
    expect(freeSlotsOfDay(base(), '2026-07-01', 60, HOJE)).toEqual([])
  })
})

describe('nextFreeSlots', () => {
  it('varre dias para frente e traz uma vaga por dia', () => {
    const vagas = nextFreeSlots(base(), SEGUNDA, 60, HOJE, 3)
    expect(vagas.map(v => v.date)).toEqual([SEGUNDA, TERCA, '2026-08-03'])   // seg, ter, próxima seg
    expect(vagas.every(v => v.start === '09:00')).toBe(true)
  })

  // Sem teto de varredura, profissional sem grade faria o laço rodar para sempre.
  it('não trava quando não há vaga nenhuma', () => {
    expect(nextFreeSlots(base({ template: [] }), SEGUNDA, 60, HOJE, 5)).toEqual([])
  })
})

describe('mergeFreeSlots — a agenda dita em voz alta', () => {
  const s = (start: string, end: string) => ({ date: '2026-07-27', start, end })

  it('junta as janelas sobrepostas de 30 em 30 num bloco só', () => {
    // Exatamente o que a ferramenta devolvia: 5 faixas para "08:00 às 11:00".
    expect(mergeFreeSlots([
      s('08:00', '09:00'), s('08:30', '09:30'), s('09:00', '10:00'),
      s('09:30', '10:30'), s('10:00', '11:00'),
    ])).toEqual([{ inicio: '08:00', ultimoInicio: '10:00', fim: '11:00' }])
  })

  it('separa o que tem intervalo no meio — o almoço aparece', () => {
    expect(mergeFreeSlots([
      s('08:00', '09:00'), s('08:30', '09:30'),
      s('14:00', '15:00'), s('14:30', '15:30'),
    ])).toEqual([
      { inicio: '08:00', ultimoInicio: '08:30', fim: '09:30' },
      { inicio: '14:00', ultimoInicio: '14:30', fim: '15:30' },
    ])
  })

  it('não depende da ordem de entrada', () => {
    expect(mergeFreeSlots([s('09:00', '10:00'), s('08:00', '09:00')]))
      .toEqual([{ inicio: '08:00', ultimoInicio: '09:00', fim: '10:00' }])
  })

  it('lista vazia e faixa única', () => {
    expect(mergeFreeSlots([])).toEqual([])
    expect(mergeFreeSlots([s('08:00', '09:00')]))
      .toEqual([{ inicio: '08:00', ultimoInicio: '08:00', fim: '09:00' }])
  })

  it('dita a faixa pelos horários de início, sem oferecer a hora de término', () => {
    expect(formatFreeStartRanges([
      { inicio: '08:00', ultimoInicio: '10:00', fim: '11:00' },
      { inicio: '14:00', ultimoInicio: '16:00', fim: '17:00' },
    ])).toBe('08:00 a 10:00 e 14:00 a 16:00')
  })
})
