import { toIsoDate } from '@/utils/date'

/** Granularidade do filtro de ganhos (períodos do gráfico e da lista). */
export type EarningsGranularity = 'dia' | 'semana' | 'mes' | 'ano'

export const OPCOES_GRANULARIDADE: { value: EarningsGranularity; label: string }[] = [
  { value: 'dia',    label: 'Dia' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes',    label: 'Mês' },
  { value: 'ano',    label: 'Ano' },
]

/** Primeiro e último dia do mês de `d` (ISO). */
export function rangeDoMes(d: Date) {
  return {
    de:  toIsoDate(new Date(d.getFullYear(), d.getMonth(), 1)),
    ate: toIsoDate(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
  }
}

/** Períodos (barras) do gráfico de ganhos — o último é sempre o atual. */
export function bucketsGanhos(gran: EarningsGranularity, hoje: Date) {
  if (gran === 'dia') {
    // Últimos 7 dias, um por barra.
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (6 - i))
      const iso = toIsoDate(d)
      return { de: iso, ate: iso, rotulo: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) }
    })
  }
  if (gran === 'semana') {
    // Últimas 6 semanas (dom–sáb), rotuladas pelo domingo.
    return Array.from({ length: 6 }, (_, i) => {
      const domingo = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay() - 7 * (5 - i))
      const sabado = new Date(domingo.getFullYear(), domingo.getMonth(), domingo.getDate() + 6)
      return {
        de: toIsoDate(domingo),
        ate: toIsoDate(sabado),
        rotulo: domingo.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      }
    })
  }
  if (gran === 'ano') {
    // Últimos 5 anos.
    return Array.from({ length: 5 }, (_, i) => {
      const ano = hoje.getFullYear() - (4 - i)
      return { de: `${ano}-01-01`, ate: `${ano}-12-31`, rotulo: String(ano) }
    })
  }
  // Mês: últimos 6 meses.
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1)
    const { de, ate } = rangeDoMes(d)
    const bruto = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
    return { de, ate, rotulo: bruto.charAt(0).toUpperCase() + bruto.slice(1) }
  })
}
