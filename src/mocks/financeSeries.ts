import { buildAppointmentSeries, parseIsoMonth, noise } from '@/mocks/appointmentSeries'
import type { ChartPeriod, FinancePoint } from '@/types/domain'

// ─────────────────────────────────────────────────────────────────────────────
// Série financeira de demonstração, DERIVADA da série de consultas do mesmo
// período: ganhos = consultas × ticket médio; gastos ≈ 24–40% dos ganhos.
// Determinística como a original — o mesmo mês mostra sempre os mesmos valores.
// ─────────────────────────────────────────────────────────────────────────────

/** Arredonda para a dezena — valores "de caixa" não terminam em R$ x,37. */
function roundToTens(v: number) {
  return Math.round(v / 10) * 10
}

export function buildFinanceSeries(period: ChartPeriod, isoMonth: string): FinancePoint[] {
  const { year: year, month: month } = parseIsoMonth(isoMonth)

  return buildAppointmentSeries(period, isoMonth).map((p, i) => {
    const seed = year * 1000 + month * 50 + i
    const ticket = 105 + Math.round(noise(seed) * 30)          // R$ por consulta
    const income = roundToTens(p.value * ticket)
    const expenses = roundToTens(income * (0.24 + noise(seed + 1) * 0.16))
    return { label: p.label, income, expenses }
  })
}
