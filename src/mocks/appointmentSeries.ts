import type { ChartPeriod, SeriesPoint } from '@/types/domain'

// ─────────────────────────────────────────────────────────────────────────────
// Série de demonstração do gráfico de consultas. Gerada de forma DETERMINÍSTICA
// a partir do mês de referência: o mesmo mês mostra sempre os mesmos valores,
// e meses diferentes mostram curvas diferentes (dá vida ao seletor de mês).
// ─────────────────────────────────────────────────────────────────────────────

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// Perfil-base de consultas por dia da semana (Dom..Sáb).
const WEEKDAY_BASE = [2, 8, 12, 10, 14, 11, 6]

/** Pseudo-aleatório determinístico em [0, 1) a partir de uma semente. */
export function noise(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/** 'aaaa-mm' → { year, month } (month 0-based, como no Date). */
export function parseIsoMonth(isoMonth: string) {
  const [year, month] = isoMonth.split('-').map(Number)
  return { year: year, month: month - 1 }
}

/** Semana (Seg→Dom) que contém o dia de referência: hoje no mês atual, dia 1 nos demais. */
function buildWeek(isoMonth: string): SeriesPoint[] {
  const { year: year, month: month } = parseIsoMonth(isoMonth)
  const today = new Date()
  const ref = year === today.getFullYear() && month === today.getMonth()
    ? today
    : new Date(year, month, 1)

  const monday = new Date(ref)
  monday.setDate(ref.getDate() - ((ref.getDay() + 6) % 7))

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    const base = WEEKDAY_BASE[day.getDay()]
    const variation = Math.round(noise(year * 10000 + month * 100 + day.getDate()) * 6 - 3)
    return {
      label: `${WEEKDAYS[day.getDay()]} ${day.getDate()}`,
      value: Math.max(0, base + variation),
    }
  })
}

function buildMonth(isoMonth: string): SeriesPoint[] {
  const { year: year, month: month } = parseIsoMonth(isoMonth)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weeks = Math.ceil(daysInMonth / 7)

  return Array.from({ length: weeks }, (_, i) => ({
    label: `Sem ${i + 1}`,
    value: Math.round(48 + noise(year * 100 + month * 10 + i) * 24 - 12),
  }))
}

function buildYear(isoMonth: string): SeriesPoint[] {
  const { year: year } = parseIsoMonth(isoMonth)
  return MONTHS.map((label, i) => ({
    label,
    value: Math.round(205 + noise(year * 12 + i) * 70 - 35),
  }))
}

export function buildAppointmentSeries(period: ChartPeriod, isoMonth: string): SeriesPoint[] {
  if (period === 'week') return buildWeek(isoMonth)
  if (period === 'month') return buildMonth(isoMonth)
  return buildYear(isoMonth)
}
