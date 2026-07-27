import type {
  ProfessionalAbsence, ProfessionalAvailabilitySlot, ProfessionalBlockedSlot,
  ScheduledAppointment,
} from '@/types/domain'

/**
 * Onde um profissional PODE ser agendado — a regra completa, num lugar só.
 *
 * Antes ela vivia inline dentro do ScheduleGrid (no botão "+" da grade), e o
 * AppointmentModal tinha uma versão mais fraca que só olhava a grade recorrente
 * e ignorava bloqueio pontual, ausência e consultas já marcadas — por isso era
 * possível agendar em cima das férias de alguém pela tela. Qualquer caminho novo
 * de gravação nascia furando a regra por omissão; a voz da Cibelly seria o
 * primeiro. Aqui é o lugar único que todos passam a usar.
 *
 * Precedência (a mesma que a grade sempre aplicou):
 *   ausência por período  >  bloqueio pontual  >  grade recorrente
 */

/** Disponibilidade completa de um profissional, do jeito que os services entregam. */
export interface AvailabilityInput {
  /** Grade recorrente: a linha existir = disponível naquele weekday+hora. */
  template: ProfessionalAvailabilitySlot[]
  blocked: ProfessionalBlockedSlot[]
  absences: ProfessionalAbsence[]
  /** Consultas já marcadas — cancelada e falta NÃO ocupam. */
  appointments: ScheduledAppointment[]
}

export interface FreeSlot {
  /** aaaa-mm-dd */
  date: string
  /** 'HH:MM' */
  start: string
  end: string
}

export interface FreeSlotBlock {
  /** Primeiro horário em que uma consulta pode começar. */
  inicio: string
  /** Último horário em que uma consulta pode começar dentro do bloco. */
  ultimoInicio: string
  /** Quando termina a última consulta possível; não é horário de início. */
  fim: string
}

/** Motivo de um horário não servir — é o que a Cibelly fala em voz alta. */
export type UnavailableReason =
  | 'ausencia'
  | 'bloqueio'
  | 'fora-da-grade'
  | 'ocupado'
  | 'passado'
  | 'sem-grade'

export const UNAVAILABLE_LABEL: Record<UnavailableReason, string> = {
  ausencia: 'o profissional está ausente nesse dia',
  bloqueio: 'esse horário está bloqueado',
  'fora-da-grade': 'esse horário está fora da disponibilidade cadastrada',
  ocupado: 'já existe consulta nesse horário',
  passado: 'essa data já passou',
  'sem-grade': 'o profissional ainda não tem disponibilidade cadastrada',
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function toHhmm(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Dia da semana (0=Dom) de uma data aaaa-mm-dd, sem passar por UTC. */
function weekdayOf(dateIso: string) {
  const [y, m, d] = dateIso.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

function estaAusente(a: AvailabilityInput, dateIso: string) {
  return a.absences.some(x => x.startDate <= dateIso && dateIso <= x.endDate)
}

/** Consultas que de fato ocupam o horário — cancelada e falta liberam o espaço,
 *  mesmo recorte que as travas do banco usam. */
function ocupadas(a: AvailabilityInput, dateIso: string) {
  return a.appointments
    .filter(s => s.date === dateIso && s.status !== 'canceled' && s.status !== 'no_show')
    .sort((x, y) => x.startTime.localeCompare(y.startTime))
}

/**
 * Um horário específico serve? Devolve `null` quando serve, ou o motivo.
 *
 * `duration` em minutos: a checagem cobre a consulta INTEIRA, não só o começo —
 * uma consulta de 90 min às 10:00 precisa das horas 10 e 11 livres. A grade é
 * de hora cheia, então cada hora tocada é verificada.
 */
export function checkSlot(
  a: AvailabilityInput, dateIso: string, start: string, duration: number, hojeIso: string,
): UnavailableReason | null {
  if (dateIso < hojeIso) return 'passado'
  // Grade vazia é ambígua no código antigo (o modal liberava tudo, a grade não
  // oferecia nada). Aqui é explícito: sem grade, não há o que prometer.
  if (a.template.length === 0) return 'sem-grade'
  if (estaAusente(a, dateIso)) return 'ausencia'

  const weekday = weekdayOf(dateIso)
  const inicio = toMinutes(start)
  const fim = inicio + duration

  const recorrente = new Set(a.template.map(s => `${s.weekday}-${s.hour}`))
  const bloqueado = new Set(a.blocked.filter(b => b.date === dateIso).map(b => b.hour))

  // Toda hora cheia tocada pela consulta precisa estar liberada.
  for (let h = Math.floor(inicio / 60); h < Math.ceil(fim / 60); h++) {
    if (bloqueado.has(h)) return 'bloqueio'
    if (!recorrente.has(`${weekday}-${h}`)) return 'fora-da-grade'
  }

  const conflito = ocupadas(a, dateIso).some(
    s => toMinutes(s.startTime) < fim && toMinutes(s.endTime) > inicio,
  )
  return conflito ? 'ocupado' : null
}

/**
 * Todos os horários livres de um dia, já descontando bloqueio, ausência e as
 * consultas existentes — é o que a Cibelly oferece quando o dentista pede
 * "quando tem vaga?".
 *
 * `step` é de quanto em quanto oferecer (padrão 30 min): a grade é de hora
 * cheia, mas oferecer só de hora em hora desperdiça a segunda metade de uma
 * hora que ficou meio livre.
 */
export function freeSlotsOfDay(
  a: AvailabilityInput, dateIso: string, duration: number, hojeIso: string, step = 30,
): FreeSlot[] {
  if (dateIso < hojeIso || a.template.length === 0 || estaAusente(a, dateIso)) return []

  const weekday = weekdayOf(dateIso)
  const bloqueado = new Set(a.blocked.filter(b => b.date === dateIso).map(b => b.hour))
  const horas = a.template
    .filter(s => s.weekday === weekday && !bloqueado.has(s.hour))
    .map(s => s.hour)
    .sort((x, y) => x - y)
  if (horas.length === 0) return []

  const marcadas = ocupadas(a, dateIso)
  const livres: FreeSlot[] = []
  const primeiro = Math.min(...horas) * 60
  const ultimo = (Math.max(...horas) + 1) * 60

  for (let inicio = primeiro; inicio + duration <= ultimo; inicio += step) {
    const fim = inicio + duration
    // Toda hora tocada precisa estar na grade e sem bloqueio.
    let cabe = true
    for (let h = Math.floor(inicio / 60); h < Math.ceil(fim / 60); h++) {
      if (!horas.includes(h)) { cabe = false; break }
    }
    if (!cabe) continue

    const conflito = marcadas.some(
      s => toMinutes(s.startTime) < fim && toMinutes(s.endTime) > inicio,
    )
    if (!conflito) livres.push({ date: dateIso, start: toHhmm(inicio), end: toHhmm(fim) })
  }

  return livres
}

/**
 * Primeiros `limite` horários livres a partir de uma data, varrendo dias para
 * frente — a resposta natural de "quando tem vaga pra ela?".
 *
 * `diasAFrente` limita a varredura: sem teto, um profissional sem grade nenhuma
 * faria o laço rodar para sempre.
 */
export function nextFreeSlots(
  a: AvailabilityInput, aPartirDe: string, duration: number, hojeIso: string,
  limite = 5, diasAFrente = 30,
): FreeSlot[] {
  const encontrados: FreeSlot[] = []
  const [y, m, d] = aPartirDe.split('-').map(Number)
  const cursor = new Date(y, m - 1, d)

  for (let i = 0; i < diasAFrente && encontrados.length < limite; i++) {
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
    // Uma vaga por dia: oferecer cinco horários da mesma terça não ajuda quem
    // está escolhendo — o dentista quer dias diferentes.
    const doDia = freeSlotsOfDay(a, iso, duration, hojeIso)
    if (doDia.length) encontrados.push(doDia[0])
    cursor.setDate(cursor.getDate() + 1)
  }

  return encontrados
}

/**
 * Junta horários livres contíguos num bloco só: doze janelas de 30 min viram
 * "08:00–12:00".
 *
 * Existe por causa de um custo real: perguntada sobre "esta semana", a
 * assistente chamou a ferramenta SETE vezes (um dia por vez) e cada resposta
 * trazia uma dúzia de faixas sobrepostas — 08:00-09:00, 08:30-09:30,
 * 09:00-10:00… Tudo isso volta para o contexto e é relido a cada turno.
 *
 * Para a fala, o bloco preserva também `ultimoInicio`: numa consulta de 60
 * minutos, "08:00–11:00" termina às 11:00, mas o último início é 10:00.
 */
export function mergeFreeSlots(slots: FreeSlot[]): FreeSlotBlock[] {
  const ordenados = [...slots].sort((a, b) => a.start.localeCompare(b.start))
  const blocos: FreeSlotBlock[] = []
  for (const s of ordenados) {
    const ultimo = blocos[blocos.length - 1]
    // Contíguo OU sobreposto entra no bloco anterior; o fim é sempre o maior.
    if (ultimo && s.start <= ultimo.fim) {
      if (s.start > ultimo.ultimoInicio) ultimo.ultimoInicio = s.start
      if (s.end > ultimo.fim) ultimo.fim = s.end
    } else {
      blocos.push({ inicio: s.start, ultimoInicio: s.start, fim: s.end })
    }
  }
  return blocos
}

/** Texto inequívoco para voz: lista horários de INÍCIO, não a hora de término. */
export function formatFreeStartRanges(blocks: FreeSlotBlock[]): string {
  return blocks
    .map(block => block.inicio === block.ultimoInicio
      ? block.inicio
      : `${block.inicio} a ${block.ultimoInicio}`)
    .join(' e ')
}
