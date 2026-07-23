import { Input } from '@/components/Input/Input'
import { PERIOD_PRESETS } from '@/utils/period'
import type { PeriodPreset } from '@/utils/period'
import styles from './PeriodFilter.module.scss'

interface PeriodFilterProps {
  preset: PeriodPreset
  onPreset: (p: PeriodPreset) => void
  customFrom: string
  customTo: string
  onCustom: (from: string, to: string) => void
}

/**
 * Seletor de período do Dashboard: Hoje · Ontem · Semana · Mês · Ano ·
 * Personalizado. Componente controlado — o estado (preset e datas) vive na
 * página, que traduz em janelas com `dashboardRange`.
 */
export function PeriodFilter({ preset, onPreset, customFrom, customTo, onCustom }: PeriodFilterProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.botoes} role="group" aria-label="Período">
        {PERIOD_PRESETS.map(p => (
          <button
            key={p.key}
            type="button"
            className={`${styles.btn} ${preset === p.key ? styles['btn--ativo'] : ''}`}
            aria-pressed={preset === p.key}
            onClick={() => onPreset(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <div className={styles.custom}>
          <Input
            size="sm" type="date" aria-label="De"
            value={customFrom}
            onChange={e => onCustom(e.target.value, customTo)}
          />
          <span className={styles.ate}>até</span>
          <Input
            size="sm" type="date" aria-label="Até"
            value={customTo}
            onChange={e => onCustom(customFrom, e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
