import { toIsoDate } from '@/utils/date'

/** Granularidade do filtro de ganhos (períodos do gráfico e da lista). */
export type EarningsGranularity = 'dia' | 'week' | 'month' | 'year'

export const GRANULARITY_OPTIONS: { value: EarningsGranularity; label: string }[] = [
  { value: 'dia',    label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month',    label: 'Mês' },
  { value: 'year',    label: 'Ano' },
]

/** Primeiro e último dia do mês de `d` (ISO). */
export function monthRange(d: Date) {
  return {
    de:  toIsoDate(new Date(d.getFullYear(), d.getMonth(), 1)),
    ate: toIsoDate(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
  }
}

/** Períodos (barras) do gráfico de ganhos — o último é sempre o atual. */
export function earningsBuckets(gran: EarningsGranularity, today: Date) {
  if (gran === 'dia') {
    // Últimos 7 dias, um por barra.
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - i))
      const iso = toIsoDate(d)
      return { de: iso, ate: iso, rotulo: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) }
    })
  }
  if (gran === 'week') {
    // Últimas 6 semanas (dom–sáb), rotuladas pelo domingo.
    return Array.from({ length: 6 }, (_, i) => {
      const sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() - 7 * (5 - i))
      const saturday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 6)
      return {
        de: toIsoDate(sunday),
        ate: toIsoDate(saturday),
        rotulo: sunday.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      }
    })
  }
  if (gran === 'year') {
    // Últimos 5 anos.
    return Array.from({ length: 5 }, (_, i) => {
      const year = today.getFullYear() - (4 - i)
      return { de: `${year}-01-01`, ate: `${year}-12-31`, rotulo: String(year) }
    })
  }
  // Mês: últimos 6 meses.
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1)
    const { de, ate } = monthRange(d)
    const raw = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
    return { de, ate, rotulo: raw.charAt(0).toUpperCase() + raw.slice(1) }
  })
}
