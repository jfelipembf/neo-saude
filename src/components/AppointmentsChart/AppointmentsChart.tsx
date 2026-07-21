import { useState } from 'react'
import { Spinner } from '@/components/Spinner/Spinner'
import { IconChevronEsquerda, IconChevronDireita } from '@/components/icons'
import { useSerieConsultas } from '@/hooks/useConsultas'
import type { ChartPeriod } from '@/types/domain'
import styles from './AppointmentsChart.module.scss'

const PERIODOS: { id: ChartPeriod; label: string }[] = [
  { id: 'semana', label: 'Semana' },
  { id: 'mes',    label: 'Mês' },
  { id: 'ano',    label: 'Ano' },
]

/** Teto "limpo" do eixo Y: múltiplo de 4 → o tick do meio é sempre inteiro. */
function tetoEixo(max: number) {
  return Math.max(4, Math.ceil(max / 4) * 4)
}

/** Date → 'aaaa-mm' (chave do mês de referência). */
function toMesIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Gráfico de barras do total de consultas, com filtro semana/mês/ano e seletor de mês. */
export function AppointmentsChart() {
  const [periodo, setPeriodo] = useState<ChartPeriod>('semana')
  const [mesRef, setMesRef] = useState(() => {
    const hoje = new Date()
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  })

  const { data: serie, isLoading, isPlaceholderData } = useSerieConsultas(periodo, toMesIso(mesRef))

  const pontos = serie ?? []
  const teto = tetoEixo(Math.max(...pontos.map(p => p.valor), 0))
  const total = pontos.reduce((soma, p) => soma + p.valor, 0)

  // Na visão anual o seletor avança de ano em ano; nas demais, de mês em mês.
  function mudarMes(delta: number) {
    setMesRef(d => periodo === 'ano'
      ? new Date(d.getFullYear() + delta, d.getMonth(), 1)
      : new Date(d.getFullYear(), d.getMonth() + delta, 1))
  }

  const rotuloMes = periodo === 'ano'
    ? String(mesRef.getFullYear())
    : mesRef.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <section className={styles.card} aria-label="Gráfico de consultas">
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Consultas</h2>
          <p className={styles.subtitle}>{total} no período</p>
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
      </div>

      {isLoading ? (
        <div className={styles.loading}><Spinner /></div>
      ) : (
        <div className={`${styles.chart} ${isPlaceholderData ? styles['chart--stale'] : ''}`}>
          <div className={styles.plot}>
            {/* Linhas-guia (teto e meio); a base é o próprio eixo do plot. */}
            {[100, 50].map(pct => (
              <div key={pct} className={styles.gridline} style={{ bottom: `${pct}%` }}>
                <span className={styles.tick}>{Math.round((teto * pct) / 100)}</span>
              </div>
            ))}
            <span className={`${styles.tick} ${styles['tick--zero']}`}>0</span>

            <div className={styles.bars}>
              {pontos.map(p => (
                <div key={p.rotulo} className={styles.slot}>
                  <button
                    type="button"
                    className={styles.bar}
                    style={{ height: `${(p.valor / teto) * 100}%` }}
                    data-tooltip={`${p.valor} consultas · ${p.rotulo}`}
                    aria-label={`${p.rotulo}: ${p.valor} consultas`}
                  />
                </div>
              ))}
            </div>
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
