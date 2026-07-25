import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Spinner } from '@/components/Spinner/Spinner'
import { IconChevronLeft, IconChevronRight } from '@/components/icons'
import { useSession } from '@/context/SessionProvider'
import { useProfessionalPhysioCommission, useProfessionalQuoteConversion } from '@/hooks/useProfessionals'
import { toIsoMonth } from '@/utils/date'
import { formatBRL } from '@/utils/format'
import { initials } from '@/utils/text'
import styles from './CommissionsCard.module.scss'

/** Uma linha do card, no formato comum às duas especialidades: um total (a
 *  barra inteira) e uma fatia dele (o preenchimento por cima). */
interface CommissionRow {
  professionalId: string
  name: string
  photoUrl?: string
  total: number
  slice: number
}

/**
 * Card "Comissões" do Dashboard — o que ele mostra depende da especialidade
 * da clínica, porque as duas não vendem do mesmo jeito:
 *
 *   · Demais especialidades: orçado × convertido (professional_quote_conversion)
 *     — plano de tratamento proposto → aprovado, o fluxo de orçamento.
 *   · Fisioterapia: vendido × comissão (professional_physio_commission) —
 *     não existe orçamento aqui, o paciente compra pacote/contrato direto no
 *     Ponto de Venda. "Vendido" é produção por SESSÃO REALIZADA (não a venda
 *     inteira de uma vez) e "Comissão" é vendido × percentual cadastrado no
 *     profissional. Ver o comment da função no banco para a fórmula completa.
 *
 * A barra é a mesma peça visual nos dois casos — troca só o que ela mede: o
 * total (roxo, a barra inteira) e a fatia (verde, o preenchimento).
 */
export function CommissionsCard() {
  const { specialty } = useSession()
  const isPhysio = specialty === 'physiotherapy'

  const [refMonth, setRefMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const monthIso = toIsoMonth(refMonth)

  // Só UM dos dois busca de verdade — `enabled` desliga o outro (ver o
  // comment do hook: sem isto ele chamaria a RPC errada a cada carregamento).
  const quoteConversion = useProfessionalQuoteConversion(monthIso, !isPhysio)
  const physioCommission = useProfessionalPhysioCommission(monthIso, isPhysio)

  const isLoading = isPhysio ? physioCommission.isLoading : quoteConversion.isLoading
  const rows: CommissionRow[] = isPhysio
    ? (physioCommission.data ?? []).map(r => ({
        professionalId: r.professionalId, name: r.name, photoUrl: r.photoUrl,
        total: r.sold, slice: r.commission,
      }))
    : (quoteConversion.data ?? []).map(r => ({
        professionalId: r.professionalId, name: r.name, photoUrl: r.photoUrl,
        total: r.quoted, slice: r.converted,
      }))

  const totalLabel = isPhysio ? 'vendidos' : 'orçados no total'
  const sliceLabel  = isPhysio ? 'em comissão' : 'convertidos'

  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0)
  const grandSlice = rows.reduce((sum, r) => sum + r.slice, 0)

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
        <strong className={styles.totalOrcado}>{formatBRL(grandTotal)}</strong> {totalLabel} ·{' '}
        <strong className={styles.totalConvertido}>{formatBRL(grandSlice)}</strong> {sliceLabel}
      </p>

      {isLoading ? (
        <div className={styles.loading}><Spinner /></div>
      ) : rows.length === 0 ? (
        <p className={styles.vazio}>Nenhum profissional ativo cadastrado.</p>
      ) : (
        <ul className={styles.lista}>
          {rows.map(r => {
            const pct = r.total > 0 ? Math.min(100, (r.slice / r.total) * 100) : 0
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
                  <span>{formatBRL(r.total)} / <strong>{formatBRL(r.slice)}</strong></span>
                </div>

                <div
                  className={styles.bar}
                  role="img"
                  aria-label={`${formatBRL(r.total)} ${totalLabel}, ${formatBRL(r.slice)} ${sliceLabel}`}
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
