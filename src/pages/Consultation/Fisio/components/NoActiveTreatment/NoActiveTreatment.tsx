import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { IconClock, IconPlus } from '@/components/icons'
import styles from './NoActiveTreatment.module.scss'

interface NoActiveTreatmentProps {
  onNovoTratamento: () => void
  /** Trocada quando o vazio aparece no lugar de uma SEÇÃO travada (prontuário,
   *  sinais vitais, testes, avaliações, diagnóstico): ali o profissional não
   *  veio procurar tratamento nenhum, veio escrever — a linha precisa dizer
   *  por que a tela dele não abriu. */
  description?: string
}

/**
 * O paciente não tem tratamento em andamento.
 *
 * Compõe o `EmptyState` do projeto em vez de desenhar outro: o vazio de uma
 * tela tem de parecer o vazio de todas, senão cada tela ensina de novo que ali
 * não há nada. O que é exclusivo da fisioterapia é o TEXTO e a ação — por isso
 * este componente mora em Fisio/components e não em Components.
 */
export function NoActiveTreatment({ onNovoTratamento, description }: NoActiveTreatmentProps) {
  return (
    <div className={styles.raiz}>
      <EmptyState
        icon={<IconClock />}
        title="Nenhum tratamento ativo"
        description={description ?? 'Abra um tratamento para registrar as sessões deste paciente.'}
        action={
          <Button iconLeft={<IconPlus />} onClick={onNovoTratamento}>
            Novo tratamento
          </Button>
        }
      />
    </div>
  )
}
