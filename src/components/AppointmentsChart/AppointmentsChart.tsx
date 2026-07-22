import { useState } from 'react'
import { Spinner } from '@/components/Spinner/Spinner'
import { IconChevronLeft, IconChevronRight } from '@/components/icons'
import { useAppointmentSeries } from '@/hooks/useAppointments'
import type { ChartPeriod } from '@/types/domain'
import styles from './AppointmentsChart.module.scss'

const PERIODS: { id: ChartPeriod; label: string }[] = [
  { id: 'week', label: 'Semana' },
  { id: 'month',    label: 'Mês' },
  { id: 'year',    label: 'Ano' },
]

/** Teto "limpo" do eixo Y: múltiplo de 4 → o tick do meio é sempre inteiro. */
function axisCeiling(max: number) {
  return Math.max(4, Math.ceil(max / 4) * 4)
}

/** Date → 'aaaa-mm' (chave do mês de referência). */
function toMonthIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Gráfico de barras do total de consultas, com filtro semana/mês/ano e seletor de mês. */
export function AppointmentsChart() {
  const [period, setPeriod] = useState<ChartPeriod>('week')
  const [refMonth, setRefMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  const { data: series, isLoading, isPlaceholderData } = useAppointmentSeries(period, toMonthIso(refMonth))

  const points = series ?? []
  const ceiling = axisCeiling(Math.max(...points.map(p => p.value), 0))
  const total = points.reduce((sum, p) => sum + p.value, 0)

  // Na visão anual o seletor avança de ano em ano; nas demais, de mês em mês.
  function changeMonth(delta: number) {
    setRefMonth(d => period === 'year'
      ? new Date(d.getFullYear() + delta, d.getMonth(), 1)
      : new Date(d.getFullYear(), d.getMonth() + delta, 1))
  }

  const monthLabel = period === 'year'
    ? String(refMonth.getFullYear())
    : refMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <section className={styles.card} aria-label="Gráfico de consultas">
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Consultas</h2>
          <p className={styles.subtitle}>{total} no período</p>
        </div>

        <div className={styles.filtro} role="group" aria-label="Período do gráfico">
          {PERIODS.map(p => (
            <button
              key={p.id}
              type="button"
              className={`${styles.filtroBtn} ${period === p.id ? styles['filtroBtn--active'] : ''}`}
              aria-pressed={period === p.id}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <div className={styles.nav}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => changeMonth(-1)}
          aria-label={period === 'year' ? 'Ano anterior' : 'Mês anterior'}
        >
          <IconChevronLeft />
        </button>
        <span className={styles.navLabel}>{monthLabel}</span>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => changeMonth(1)}
          aria-label={period === 'year' ? 'Próximo ano' : 'Próximo mês'}
        >
          <IconChevronRight />
        </button>
      </div>

      {isLoading ? (
        <div className={styles.loading}><Spinner /></div>
      ) : (
        <div className={`${styles.chart} ${isPlaceholderData ? styles['chart--stale'] : ''}`}>
          <div className={styles.plot}>
            {/* Linhas-guia (teto e meio); a base é o próprio eixo do plot. */}
            {[100, 50].map(pct => (
              <div key={pct} className={styles.gridline} style={{ bottom: `${pct}%` }}>
                <span className={styles.tick}>{Math.round((ceiling * pct) / 100)}</span>
              </div>
            ))}
            <span className={`${styles.tick} ${styles['tick--zero']}`}>0</span>

            <div className={styles.bars}>
              {points.map(p => (
                <div key={p.label} className={styles.slot}>
                  <button
                    type="button"
                    className={styles.bar}
                    style={{ height: `${(p.value / ceiling) * 100}%` }}
                    data-tooltip={`${p.value} consultas · ${p.label}`}
                    aria-label={`${p.label}: ${p.value} consultas`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.xAxis}>
            {points.map(p => (
              <span key={p.label} className={styles.xLabel}>{p.label}</span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
