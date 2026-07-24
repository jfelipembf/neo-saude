import type { CSSProperties } from 'react'
import { useTheme } from '@/context/ThemeProvider'
import { useProfessionalName, useProfessionalColor } from '@/hooks/useDisplayNames'
import { maskedLuminance } from '@/utils/cardColor'
import { firstName, stripTitle } from '@/utils/text'
import { IconCheck } from '@/components/icons'
import type { ClassGroupOccurrence } from '@/types/domain'
import styles from './scheduleCards.module.scss'

interface ClassGroupCardProps {
  occurrence: ClassGroupOccurrence
  /** Oculta a linha de sala/local. */
  hideArea?: boolean
  /** Abre a chamada da turma (só oferecido pra fisioterapia — ver ScheduleBoard). */
  onClick?: () => void
  /** Modo "Matricular": esta turma está na seleção — sombra + selo diferentes
   *  simbolizando que o aluno será matriculado aqui ao confirmar. */
  selected?: boolean
}

/** Card de uma turma coletiva na grade da Agenda — mesmo visual do ClassCard
 *  (consulta de paciente), na cor CADASTRADA DO PROFISSIONAL responsável, mas
 *  sem paciente nem desfecho (turma não é uma consulta individual): mostra o
 *  nome da turma, o profissional e a capacidade máxima. */
export function ClassGroupCard({ occurrence, hideArea, onClick, selected }: ClassGroupCardProps) {
  const { theme } = useTheme()
  const professionalName = useProfessionalName()
  const professionalColor = useProfessionalColor()
  const professional = professionalName(occurrence.professionalId)
  const cardColor = professionalColor(occurrence.professionalId)
  const light = maskedLuminance(cardColor, theme) > 0.6

  return (
    <div
      className={[
        styles.card,
        light ? styles['card--onLight'] : '',
        onClick ? styles['card--clicavel'] : '',
        selected ? styles['card--selecionada'] : '',
      ].filter(Boolean).join(' ')}
      style={{ '--card-color': cardColor } as CSSProperties}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
    >
      {selected && (
        <span className={styles.selectedBadge} aria-hidden="true"><IconCheck /></span>
      )}
      <div className={styles.rail}>
        <span className={styles.timeStart}>{occurrence.startTime}</span>
        <span className={styles.timeEnd}>{occurrence.endTime}</span>
        {!hideArea && occurrence.roomName && (
          <span className={styles.railArea} title={occurrence.roomName}>{occurrence.roomName}</span>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.topline}>
          <span className={styles.title} title={occurrence.name}>{occurrence.name}</span>
        </div>

        {occurrence.professionalId && (
          <div className={styles.byline}>
            <span className={styles.prof} title={`Dr(a) ${stripTitle(professional)}`}>
              Dr(a) {firstName(professional)}
            </span>
          </div>
        )}

        <div className={styles.statusRow}>
          <span className={styles.badge} title="Matriculados / vagas">
            {occurrence.enrolledCount}/{occurrence.maxCapacity}
          </span>
        </div>
      </div>
    </div>
  )
}
