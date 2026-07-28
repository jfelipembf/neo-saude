import { AvailabilityPanel } from './AvailabilityPanel'
import shared from '../shared/profile.module.scss'

interface AvailabilityTabProps {
  professionalId: string
}

/**
 * Aba "Disponibilidade": a grade recorrente de quando o profissional atende.
 *
 * Vivia como um segmento dentro da aba Agenda, alternando com as consultas.
 * São duas perguntas diferentes — "o que está marcado?" e "quando ele pode
 * atender?" — e a segunda é EDIÇÃO de configuração, não leitura de agenda.
 * Escondida atrás de um botão dentro de outra aba, ela só era encontrada por
 * quem já sabia que existia.
 */
export function AvailabilityTab({ professionalId }: AvailabilityTabProps) {
  return (
    <section className={shared.formCard} aria-label="Disponibilidade">
      <div className={shared.detalheHead}>
        <h2 className={shared.formTitulo}>Disponibilidade</h2>
      </div>
      <AvailabilityPanel professionalId={professionalId} />
    </section>
  )
}
