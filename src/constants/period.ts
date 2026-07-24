// ─────────────────────────────────────────────────────────────────────────────
// Presets de período do Dashboard/Financeiro — opção fixa de UI (rótulos pt-BR).
// O tipo `PeriodPreset` e o cálculo das janelas continuam em utils/period.ts:
// trazer o tipo para cá criaria o ciclo constants → utils → constants.
// ─────────────────────────────────────────────────────────────────────────────
import type { PeriodPreset } from '@/utils/period'

export const PERIOD_PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: 'today',     label: 'Hoje' },
  { key: 'yesterday', label: 'Ontem' },
  { key: 'week',      label: 'Semana' },
  { key: 'month',     label: 'Mês' },
  { key: 'year',      label: 'Ano' },
  { key: 'custom',    label: 'Personalizado' },
]
