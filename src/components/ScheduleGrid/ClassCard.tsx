import type { CSSProperties } from 'react'
import { useTheme } from '@/context/ThemeProvider'
import { usePatientName, useProfessionalName, useProfessionalColor } from '@/hooks/useDisplayNames'
import { IconChevronRight } from '@/components/icons'
import type { ScheduledAppointment } from '@/types/domain'
import { firstName, stripTitle } from '@/utils/text'
import { maskedLuminance } from '@/utils/cardColor'
import styles from './scheduleCards.module.scss'

interface ClassCardProps {
  appointment: ScheduledAppointment
  onClick?: () => void
  /** Mostra uma setinha no hover indicando que o card abre uma ação. */
  showArrow?: boolean
  /** Oculta a linha de sala/local. */
  hideArea?: boolean
}

/** Card de um atendimento na grade — preenchido na COR CADASTRADA DO
 *  PROFISSIONAL (perfil dele), não na da atividade — todo card do mesmo
 *  profissional fica consistente e acompanha sozinho se a cor mudar depois.
 *  `slot.color` (atividade) só entra como reserva, se o profissional não
 *  tiver cor definida. Horário inicial em evidência. */
export function ClassCard({ appointment: slot, onClick, showArrow, hideArea }: ClassCardProps) {
  const { theme } = useTheme()
  const patientName = usePatientName()
  const professionalName = useProfessionalName()
  const professionalColor = useProfessionalColor()
  const patient = patientName(slot.patientId)
  const professional = professionalName(slot.professionalId)
  const cardColor = professionalColor(slot.professionalId) ?? slot.color
  const canceled = slot.status === 'canceled'
  // Cancelada vira cinza (texto claro); nas demais o texto segue a luminância da cor mascarada.
  const light = !canceled && maskedLuminance(cardColor, theme) > 0.6

  return (
    <div
      className={[
        styles.card,
        light ? styles['card--onLight'] : '',
        canceled ? styles['card--cancelada'] : '',
        onClick ? styles['card--clicavel'] : '',
      ].filter(Boolean).join(' ')}
      style={{ '--card-color': cardColor } as CSSProperties}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
    >
      {showArrow && onClick && (
        <span className={styles.arrow} aria-hidden="true"><IconChevronRight /></span>
      )}

      {/* ── Horário em evidência: início grande, fim miúdo; sala no rodapé ── */}
      <div className={styles.rail}>
        <span className={styles.timeStart}>{slot.startTime}</span>
        <span className={styles.timeEnd}>{slot.endTime}</span>
        {!hideArea && slot.room && (
          <span className={styles.railArea} title={slot.room}>{slot.room}</span>
        )}
      </div>

      {/* ── Corpo: paciente em destaque numa linha própria; Dr(a) na sua,
          sem disputar espaço com o nome. ── */}
      <div className={styles.body}>
        <div className={styles.topline}>
          <span className={styles.title} title={`${patient} · ${slot.activity}`}>
            {patient}
          </span>
        </div>

        {slot.professionalId && (
          <div className={styles.byline}>
            <span className={styles.prof} title={`Dr(a) ${stripTitle(professional)}`}>
              Dr(a) {firstName(professional)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
