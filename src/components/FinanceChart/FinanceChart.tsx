import { useState } from 'react'
import { Spinner } from '@/components/Spinner/Spinner'
import { IconChevronLeft, IconChevronRight } from '@/components/icons'
import { useFinanceSeries } from '@/hooks/useFinance'
import type { ChartPeriod } from '@/types/domain'
import styles from './FinanceChart.module.scss'

const PERIODS: { id: ChartPeriod; label: string }[] = [
  { id: 'week', label: 'Semana' },
  { id: 'month',    label: 'Mês' },
  { id: 'year',    label: 'Ano' },
]

/** Teto "limpo" do eixo Y em R$: múltiplo de 400 → tick do meio sempre redondo. */
function axisCeiling(max: number) {
  return Math.max(400, Math.ceil(max / 400) * 400)
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

/** Tick compacto do eixo: 12000 → "12k", 2400 → "2,4k". */
function compactTick(v: number) {
  if (v < 1000) return String(v)
  return `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
}

function toIsoMonth(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Gráfico de linhas de ganhos × gastos, com filtro semana/mês/ano e seletor de mês. */
export function FinanceChart() {
  const [period, setPeriod] = useState<ChartPeriod>('week')
  const [refMonth, setRefMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [active, setActive] = useState<number | null>(null)

  const { data: series, isLoading, isPlaceholderData } = useFinanceSeries(period, toIsoMonth(refMonth))

  const points = series ?? []
  const n = points.length
  const ceiling = axisCeiling(Math.max(...points.flatMap(p => [p.income, p.expenses]), 0))
  const balance = points.reduce((sum, p) => sum + p.income - p.expenses, 0)

  // Slots centrados como no gráfico de barras: rótulos e pontos na mesma malha.
  const xPct = (i: number) => ((i + 0.5) / n) * 100
  const yPct = (v: number) => 100 - (v / ceiling) * 100

  function changeMonth(delta: number) {
    setRefMonth(d => period === 'year'
      ? new Date(d.getFullYear() + delta, d.getMonth(), 1)
      : new Date(d.getFullYear(), d.getMonth() + delta, 1))
  }

  const monthLabel = period === 'year'
    ? String(refMonth.getFullYear())
    : refMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  // Tooltip não estoura o card: encosta na borda nos primeiros/últimos slots.
  const tooltipShift = active === null ? '-50%'
    : active / n < 0.25 ? '0%'
    : active / n > 0.75 ? '-100%'
    : '-50%'

  return (
    <section className={styles.card} aria-label="Gráfico financeiro">
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Financeiro</h2>
          <p className={styles.subtitle}>Saldo de {formatBRL(balance)} no período</p>
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

        <div className={styles.legenda}>
          <span className={styles.legendaItem}>
            <span className={`${styles.chave} ${styles['chave--ganhos']}`} /> Ganhos
          </span>
          <span className={styles.legendaItem}>
            <span className={`${styles.chave} ${styles['chave--gastos']}`} /> Gastos
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loading}><Spinner /></div>
      ) : (
        <div className={`${styles.chart} ${isPlaceholderData ? styles['chart--stale'] : ''}`}>
          <div className={styles.plot} onPointerLeave={() => setActive(null)}>
            {[100, 50].map(pct => (
              <div key={pct} className={styles.gridline} style={{ bottom: `${pct}%` }}>
                <span className={styles.tick}>{compactTick((ceiling * pct) / 100)}</span>
              </div>
            ))}
            <span className={`${styles.tick} ${styles['tick--zero']}`}>0</span>

            <svg className={styles.linhas} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polyline
                className={styles['linha--ganhos']}
                points={points.map((p, i) => `${xPct(i)},${yPct(p.income)}`).join(' ')}
              />
              <polyline
                className={styles['linha--gastos']}
                points={points.map((p, i) => `${xPct(i)},${yPct(p.expenses)}`).join(' ')}
              />
            </svg>

            {points.map((p, i) => (
              <span
                key={`g-${p.label}`}
                className={`${styles.dot} ${styles['dot--ganhos']} ${active === i ? styles['dot--ativo'] : ''}`}
                style={{ left: `${xPct(i)}%`, top: `${yPct(p.income)}%` }}
              />
            ))}
            {points.map((p, i) => (
              <span
                key={`d-${p.label}`}
                className={`${styles.dot} ${styles['dot--gastos']} ${active === i ? styles['dot--ativo'] : ''}`}
                style={{ left: `${xPct(i)}%`, top: `${yPct(p.expenses)}%` }}
              />
            ))}

            {active !== null && (
              <div className={styles.crosshair} style={{ left: `${xPct(active)}%` }} />
            )}

            {/* Alvos de interação: um por posição do eixo X (hover e foco por teclado). */}
            <div className={styles.hits}>
              {points.map((p, i) => (
                <button
                  key={p.label}
                  type="button"
                  className={styles.hit}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  aria-label={`${p.label}: ganhos ${formatBRL(p.income)}, gastos ${formatBRL(p.expenses)}`}
                />
              ))}
            </div>

            {active !== null && (
              <div
                className={styles.tooltip}
                style={{ left: `${xPct(active)}%`, transform: `translateX(${tooltipShift})` }}
              >
                <span className={styles.tooltipTitulo}>{points[active].label}</span>
                <span className={styles.tooltipRow}>
                  <span className={`${styles.chave} ${styles['chave--ganhos']}`} />
                  <strong>{formatBRL(points[active].income)}</strong> Ganhos
                </span>
                <span className={styles.tooltipRow}>
                  <span className={`${styles.chave} ${styles['chave--gastos']}`} />
                  <strong>{formatBRL(points[active].expenses)}</strong> Gastos
                </span>
              </div>
            )}
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
