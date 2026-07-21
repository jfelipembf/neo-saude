import { useState } from 'react'
import { Spinner } from '@/components/Spinner/Spinner'
import { IconChevronEsquerda, IconChevronDireita } from '@/components/icons'
import { useSerieFinanceira } from '@/hooks/useFinanceiro'
import type { ChartPeriod } from '@/types/domain'
import styles from './FinanceChart.module.scss'

const PERIODOS: { id: ChartPeriod; label: string }[] = [
  { id: 'semana', label: 'Semana' },
  { id: 'mes',    label: 'Mês' },
  { id: 'ano',    label: 'Ano' },
]

/** Teto "limpo" do eixo Y em R$: múltiplo de 400 → tick do meio sempre redondo. */
function tetoEixo(max: number) {
  return Math.max(400, Math.ceil(max / 400) * 400)
}

function formatarReais(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

/** Tick compacto do eixo: 12000 → "12k", 2400 → "2,4k". */
function tickCompacto(v: number) {
  if (v < 1000) return String(v)
  return `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
}

function toMesIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Gráfico de linhas de ganhos × gastos, com filtro semana/mês/ano e seletor de mês. */
export function FinanceChart() {
  const [periodo, setPeriodo] = useState<ChartPeriod>('semana')
  const [mesRef, setMesRef] = useState(() => {
    const hoje = new Date()
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  })
  const [ativo, setAtivo] = useState<number | null>(null)

  const { data: serie, isLoading, isPlaceholderData } = useSerieFinanceira(periodo, toMesIso(mesRef))

  const pontos = serie ?? []
  const n = pontos.length
  const teto = tetoEixo(Math.max(...pontos.flatMap(p => [p.ganhos, p.gastos]), 0))
  const saldo = pontos.reduce((soma, p) => soma + p.ganhos - p.gastos, 0)

  // Slots centrados como no gráfico de barras: rótulos e pontos na mesma malha.
  const xPct = (i: number) => ((i + 0.5) / n) * 100
  const yPct = (v: number) => 100 - (v / teto) * 100

  function mudarMes(delta: number) {
    setMesRef(d => periodo === 'ano'
      ? new Date(d.getFullYear() + delta, d.getMonth(), 1)
      : new Date(d.getFullYear(), d.getMonth() + delta, 1))
  }

  const rotuloMes = periodo === 'ano'
    ? String(mesRef.getFullYear())
    : mesRef.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  // Tooltip não estoura o card: encosta na borda nos primeiros/últimos slots.
  const tooltipShift = ativo === null ? '-50%'
    : ativo / n < 0.25 ? '0%'
    : ativo / n > 0.75 ? '-100%'
    : '-50%'

  return (
    <section className={styles.card} aria-label="Gráfico financeiro">
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Financeiro</h2>
          <p className={styles.subtitle}>Saldo de {formatarReais(saldo)} no período</p>
        </div>

        <div className={styles.filtro} role="group" aria-label="Período do gráfico">
          {PERIODOS.map(p => (
            <button
              key={p.id}
              type="button"
              className={`${styles.filtroBtn} ${periodo === p.id ? styles['filtroBtn--active'] : ''}`}
              aria-pressed={periodo === p.id}
              onClick={() => setPeriodo(p.id)}
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
          onClick={() => mudarMes(-1)}
          aria-label={periodo === 'ano' ? 'Ano anterior' : 'Mês anterior'}
        >
          <IconChevronEsquerda />
        </button>
        <span className={styles.navLabel}>{rotuloMes}</span>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => mudarMes(1)}
          aria-label={periodo === 'ano' ? 'Próximo ano' : 'Próximo mês'}
        >
          <IconChevronDireita />
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
          <div className={styles.plot} onPointerLeave={() => setAtivo(null)}>
            {[100, 50].map(pct => (
              <div key={pct} className={styles.gridline} style={{ bottom: `${pct}%` }}>
                <span className={styles.tick}>{tickCompacto((teto * pct) / 100)}</span>
              </div>
            ))}
            <span className={`${styles.tick} ${styles['tick--zero']}`}>0</span>

            <svg className={styles.linhas} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polyline
                className={styles['linha--ganhos']}
                points={pontos.map((p, i) => `${xPct(i)},${yPct(p.ganhos)}`).join(' ')}
              />
              <polyline
                className={styles['linha--gastos']}
                points={pontos.map((p, i) => `${xPct(i)},${yPct(p.gastos)}`).join(' ')}
              />
            </svg>

            {pontos.map((p, i) => (
              <span
                key={`g-${p.rotulo}`}
                className={`${styles.dot} ${styles['dot--ganhos']} ${ativo === i ? styles['dot--ativo'] : ''}`}
                style={{ left: `${xPct(i)}%`, top: `${yPct(p.ganhos)}%` }}
              />
            ))}
            {pontos.map((p, i) => (
              <span
                key={`d-${p.rotulo}`}
                className={`${styles.dot} ${styles['dot--gastos']} ${ativo === i ? styles['dot--ativo'] : ''}`}
                style={{ left: `${xPct(i)}%`, top: `${yPct(p.gastos)}%` }}
              />
            ))}

            {ativo !== null && (
              <div className={styles.crosshair} style={{ left: `${xPct(ativo)}%` }} />
            )}

            {/* Alvos de interação: um por posição do eixo X (hover e foco por teclado). */}
            <div className={styles.hits}>
              {pontos.map((p, i) => (
                <button
                  key={p.rotulo}
                  type="button"
                  className={styles.hit}
                  onPointerEnter={() => setAtivo(i)}
                  onFocus={() => setAtivo(i)}
                  onBlur={() => setAtivo(null)}
                  aria-label={`${p.rotulo}: ganhos ${formatarReais(p.ganhos)}, gastos ${formatarReais(p.gastos)}`}
                />
              ))}
            </div>

            {ativo !== null && (
              <div
                className={styles.tooltip}
                style={{ left: `${xPct(ativo)}%`, transform: `translateX(${tooltipShift})` }}
              >
                <span className={styles.tooltipTitulo}>{pontos[ativo].rotulo}</span>
                <span className={styles.tooltipRow}>
                  <span className={`${styles.chave} ${styles['chave--ganhos']}`} />
                  <strong>{formatarReais(pontos[ativo].ganhos)}</strong> Ganhos
                </span>
                <span className={styles.tooltipRow}>
                  <span className={`${styles.chave} ${styles['chave--gastos']}`} />
                  <strong>{formatarReais(pontos[ativo].gastos)}</strong> Gastos
                </span>
              </div>
            )}
          </div>

          <div className={styles.xAxis}>
            {pontos.map(p => (
              <span key={p.rotulo} className={styles.xLabel}>{p.rotulo}</span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
