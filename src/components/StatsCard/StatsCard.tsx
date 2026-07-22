import type { CSSProperties, ReactNode } from 'react'
import styles from './StatsCard.module.scss'

interface StatsCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  /** Texto auxiliar (ex.: "+12% vs. mês anterior"). */
  hint?: string
  /** Tom do hint: positivo (verde), negativo (vermelho) ou neutro. */
  trend?: 'up' | 'down' | 'neutral'
  /**
   * Meta do período, JÁ FORMATADA para leitura (ex.: 20 ou "R$ 15.000").
   * Três estados, e a diferença entre os dois primeiros é o ponto:
   *
   *   `undefined` — o cartão NÃO acompanha meta ("Consultas hoje" não tem, e
   *                 nem pode ter: não existe métrica de meta para "hoje").
   *                 O bloco não é renderizado.
   *   `null`      — o cartão acompanha meta e ela NÃO foi cadastrada. Bloco
   *                 renderizado com "Meta: não definida" e barra vazia.
   *   valor       — a meta cadastrada.
   */
  meta?: string | number | null
  /** Progresso da meta em % (0–100). Se omitido e value/meta forem numéricos, é calculado. */
  progress?: number
}

export function StatsCard({ label, value, icon, hint, trend = 'neutral', meta, progress }: StatsCardProps) {
  // `undefined` some, `null` fica: ver a doc de `meta` acima.
  const tracksGoal = meta !== undefined
  const hasGoal = meta !== undefined && meta !== null

  const pctAuto = typeof value === 'number' && typeof meta === 'number' && meta > 0
    ? Math.round((value / meta) * 100)
    : 0
  // NÃO capado: quem faturou 150% da meta lê "150%", não um "100%" que
  // esconderia o quanto a meta foi superada.
  const pct = Math.max(0, progress ?? pctAuto)
  // A BARRA, sim, para em 100% — é o que cabe no traço desenhado.
  const barPct = Math.min(100, pct)

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        {icon && <div className={styles.icon}>{icon}</div>}
      </div>
      <span className={styles.value}>{value}</span>
      {hint && <span className={`${styles.hint} ${styles[`hint--${trend}`]}`}>{hint}</span>}

      {tracksGoal && (
        <div className={styles.meta}>
          <div className={styles.metaRow}>
            {hasGoal
              ? <span>Meta: {meta}</span>
              : <span className={styles.metaEmpty}>Meta: não definida</span>}
            {hasGoal && <span className={styles.metaPct}>{pct}%</span>}
          </div>

          {/* A largura vem por CSS custom property (o `width` mora no
              .module.scss) — estilo inline é proibido no projeto. */}
          <div
            className={styles.bar}
            style={{ '--stats-progress': `${barPct}%` } as CSSProperties}
            // Sem meta cadastrada NÃO há progresso a informar. Um
            // role="progressbar" com aria-valuenow=0 faria o leitor de tela
            // anunciar "0 por cento" — uma medição real de um alvo que não
            // existe. Então o role só existe quando existe meta; sem ela a
            // barra é decoração (aria-hidden) e quem carrega a informação é o
            // texto "Meta: não definida", que é lido normalmente.
            {...(hasGoal
              ? {
                  role: 'progressbar' as const,
                  'aria-valuenow': barPct,
                  'aria-valuemin': 0,
                  'aria-valuemax': 100,
                  // Diz a verdade quando a meta foi superada, já que
                  // aria-valuenow está preso ao teto de 100.
                  'aria-valuetext': `${pct}% da meta de ${meta}`,
                  'aria-label': `Progresso da meta de ${label}`,
                }
              : { 'aria-hidden': true })}
          >
            <span className={styles.barFill} />
          </div>
        </div>
      )}
    </div>
  )
}
