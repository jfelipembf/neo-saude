import { toIsoDate, addDays, localDate } from '@/utils/date'

// ─────────────────────────────────────────────────────────────────────────────
// Períodos do Dashboard: cada preset vira uma janela [from, to] e uma janela
// ANTERIOR comparável — calendário-consciente (mês → mês anterior, ano → ano
// anterior), não "N dias atrás". O RPC dashboard_stats_period só agrega as duas.
// ─────────────────────────────────────────────────────────────────────────────

export type PeriodPreset = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'

export interface DashboardRange {
  from: string
  to: string
  prevFrom: string
  prevTo: string
}

function range(from: Date, to: Date, prevFrom: Date, prevTo: Date): DashboardRange {
  return { from: toIsoDate(from), to: toIsoDate(to), prevFrom: toIsoDate(prevFrom), prevTo: toIsoDate(prevTo) }
}

/** Janela atual + anterior de um preset (custom compara com o período de igual
 *  tamanho imediatamente antes). Datas em ISO (aaaa-mm-dd). */
export function dashboardRange(preset: PeriodPreset, customFrom?: string, customTo?: string): DashboardRange {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const y = today.getFullYear()
  const m = today.getMonth()

  switch (preset) {
    case 'today': {
      const yest = addDays(today, -1)
      return range(today, today, yest, yest)
    }
    case 'yesterday': {
      const yest = addDays(today, -1)
      const before = addDays(today, -2)
      return range(yest, yest, before, before)
    }
    case 'week': {
      // Semana de segunda a domingo, contendo hoje.
      const diffToMon = (today.getDay() + 6) % 7
      const mon = addDays(today, -diffToMon)
      const sun = addDays(mon, 6)
      return range(mon, sun, addDays(mon, -7), addDays(sun, -7))
    }
    case 'month': {
      const first = new Date(y, m, 1)
      const last = new Date(y, m + 1, 0)
      return range(first, last, new Date(y, m - 1, 1), new Date(y, m, 0))
    }
    case 'year': {
      return range(new Date(y, 0, 1), new Date(y, 11, 31), new Date(y - 1, 0, 1), new Date(y - 1, 11, 31))
    }
    case 'custom':
    default: {
      const from = customFrom ? localDate(customFrom) : today
      const to = customTo ? localDate(customTo) : today
      const lenDays = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1
      return range(from, to, addDays(from, -lenDays), addDays(to, -lenDays))
    }
  }
}

export const PERIOD_PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: 'today',     label: 'Hoje' },
  { key: 'yesterday', label: 'Ontem' },
  { key: 'week',      label: 'Semana' },
  { key: 'month',     label: 'Mês' },
  { key: 'year',      label: 'Ano' },
  { key: 'custom',    label: 'Personalizado' },
]
