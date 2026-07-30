import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { IconClock, IconPlus } from '@/components/icons'

interface NoActiveTreatmentProps {
  onNovoTratamento: () => void
}

/**
 * O paciente não tem tratamento em andamento.
 *
 * Compõe o `EmptyState` do projeto em vez de desenhar outro: o vazio de uma
 * tela tem de parecer o vazio de todas, senão cada tela ensina de novo que ali
 * não há nada. O que é exclusivo da fisioterapia é o TEXTO e a ação — por isso
 * este componente mora em Fisio/components e não em Components.
 */
export function NoActiveTreatment({ onNovoTratamento }: NoActiveTreatmentProps) {
  return (
    <EmptyState
      icon={<IconClock />}
      title="Nenhum tratamento ativo"
      description="Abra um tratamento para registrar as sessões deste paciente."
      action={
        <Button iconLeft={<IconPlus />} onClick={onNovoTratamento}>
          Novo tratamento
        </Button>
      }
    />
  )
}
