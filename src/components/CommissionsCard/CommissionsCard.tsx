import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Spinner } from '@/components/Spinner/Spinner'
import { IconChevronLeft, IconChevronRight } from '@/components/icons'
import { useProfessionalQuoteConversion } from '@/hooks/useProfessionals'
import { formatBRL } from '@/utils/format'
import { initials } from '@/utils/text'
import styles from './CommissionsCard.module.scss'

function toIsoMonth(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Card "Comissões" do Dashboard: por profissional, quanto foi orçado no mês e
 * quanto disso já converteu (orçamento aprovado) — uma barra só, com as duas
 * cores: roxo é o orçado (o total da barra), verde é a fatia que converteu.
 * O seletor de mês segue o mesmo padrão do FinanceChart (setas + rótulo).
 */
export function CommissionsCard() {
  const [refMonth, setRefMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  const { data, isLoading } = useProfessionalQuoteConversion(toIsoMonth(refMonth))
  const rows = data ?? []

  const totalQuoted    = rows.reduce((sum, r) => sum + r.quoted, 0)
  const totalConverted = rows.reduce((sum, r) => sum + r.converted, 0)

  const monthLabel = refMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  function changeMonth(delta: number) {
    setRefMonth(d => new Date(d.getFullYear(), d.getMonth() + delta, 1))
  }

  return (
    <section className={styles.card} aria-label="Comissões">
      <header className={styles.header}>
        <h2 className={styles.title}>Comissões</h2>

        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => changeMonth(-1)}
            aria-label="Mês anterior"
          >
            <IconChevronLeft />
          </button>
          <span className={styles.navLabel}>{monthLabel}</span>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => changeMonth(1)}
            aria-label="Próximo mês"
          >
            <IconChevronRight />
          </button>
        </div>
      </header>

      <p className={styles.totalGeral}>
        <strong className={styles.totalOrcado}>{formatBRL(totalQuoted)}</strong> orçados no total ·{' '}
        <strong className={styles.totalConvertido}>{formatBRL(totalConverted)}</strong> convertidos
      </p>

      {isLoading ? (
        <div className={styles.loading}><Spinner /></div>
      ) : rows.length === 0 ? (
        <p className={styles.vazio}>Nenhum profissional ativo cadastrado.</p>
      ) : (
        <ul className={styles.lista}>
          {rows.map(r => {
            const pct = r.quoted > 0 ? Math.min(100, (r.converted / r.quoted) * 100) : 0
            return (
              <li key={r.professionalId} className={styles.item}>
                <div className={styles.itemTop}>
                  <span className={styles.avatar}>
                    {r.photoUrl
                      ? <img src={r.photoUrl} alt="" className={styles.avatarImg} />
                      : initials(r.name)}
                  </span>
                  <span className={styles.nome}>{r.name}</span>
                </div>

                <div className={styles.valores}>
                  <span>{formatBRL(r.quoted)} / <strong>{formatBRL(r.converted)}</strong></span>
                </div>

                <div
                  className={styles.bar}
                  role="img"
                  aria-label={`${formatBRL(r.quoted)} orçados, ${formatBRL(r.converted)} convertidos`}
                  style={{ '--commission-progress': `${pct}%` } as CSSProperties}
                >
                  <span className={styles.barFill} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
