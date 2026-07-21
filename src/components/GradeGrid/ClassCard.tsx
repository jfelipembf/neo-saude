import type { CSSProperties } from 'react'
import { useTheme } from '@/context/ThemeProvider'
import { IconChevronDireita } from '@/components/icons'
import type { GradeSessao } from '@/types/domain'
import styles from './ClassCard.module.scss'

interface ClassCardProps {
  sessao: GradeSessao
  onClick?: () => void
  /** Mostra uma setinha no hover indicando que o card abre uma ação. */
  showArrow?: boolean
  /** Oculta a linha de sala/local. */
  hideArea?: boolean
}

function firstName(nome: string) {
  return nome.trim().split(' ')[0]
}

// Máscara aplicada sobre a cor no CSS (--grade-card-scrim em _themes.scss) — o
// contraste do texto é decidido sobre a cor JÁ mascarada. Mantenha em sincronia.
const SCRIM = {
  dark:  { r: 13, g: 21, b: 18, a: 0.35 },
  light: { r: 255, g: 255, b: 255, a: 0.38 },
} as const

/** Luminância percebida (BT.601, 0..1) da cor da atividade APÓS a máscara do tema. */
function maskedLuminance(cor: string | undefined, theme: 'dark' | 'light'): number {
  const m = (cor ?? '').trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m) return 0   // cor desconhecida → assume escura (texto claro)
  const h = m[1].length === 3 ? [...m[1]].map(c => c + c).join('') : m[1]
  const n = parseInt(h, 16)
  const s = SCRIM[theme]
  const r = ((n >> 16) & 255) * (1 - s.a) + s.r * s.a
  const g = ((n >> 8) & 255) * (1 - s.a) + s.g * s.a
  const b = (n & 255) * (1 - s.a) + s.b * s.a
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/** Card de um atendimento na grade — preenchido na COR da atividade (sob a
 *  máscara do tema), com o horário inicial em evidência. */
export function ClassCard({ sessao, onClick, showArrow, hideArea }: ClassCardProps) {
  const { theme } = useTheme()
  const cancelada = sessao.status === 'cancelada'
  // Cancelada vira cinza (texto claro); nas demais o texto segue a luminância da cor mascarada.
  const light = !cancelada && maskedLuminance(sessao.cor, theme) > 0.6

  return (
    <div
      className={[
        styles.card,
        light ? styles['card--onLight'] : '',
        cancelada ? styles['card--cancelada'] : '',
        onClick ? styles['card--clicavel'] : '',
      ].filter(Boolean).join(' ')}
      style={{ '--card-color': sessao.cor } as CSSProperties}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
    >
      {showArrow && onClick && (
        <span className={styles.arrow} aria-hidden="true"><IconChevronDireita /></span>
      )}

      {/* ── Horário em evidência: início grande, fim miúdo; sala no rodapé ── */}
      <div className={styles.rail}>
        <span className={styles.timeStart}>{sessao.horaInicio}</span>
        <span className={styles.timeEnd}>{sessao.horaFim}</span>
        {!hideArea && sessao.sala && (
          <span className={styles.railArea} title={sessao.sala}>{sessao.sala}</span>
        )}
      </div>

      {/* ── Corpo: paciente em destaque, Dr(a) logo abaixo ── */}
      <div className={styles.body}>
        <div className={styles.topline}>
          <span className={styles.title} title={`${sessao.paciente} · ${sessao.atividade}`}>
            {sessao.paciente}
          </span>
          {cancelada && <span className={styles.badge}>Canc.</span>}
        </div>

        {sessao.profissional && (
          <div className={styles.byline}>
            <span className={styles.prof} title={`Dr(a) ${sessao.profissional}`}>
              Dr(a) {firstName(sessao.profissional)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
