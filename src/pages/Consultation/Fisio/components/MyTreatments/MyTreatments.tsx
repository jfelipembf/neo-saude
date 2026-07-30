import { Button } from '@/components/Button/Button'
import { CarePlanCard } from '@/components/CarePlanCard/CarePlanCard'
import { IconPlus } from '@/components/icons'
import { NoActiveTreatment } from '../NoActiveTreatment/NoActiveTreatment'
import type { CarePlan } from '@/services/carePlansService'
import styles from './MyTreatments.module.scss'

interface MyTreatmentsProps {
  planos: CarePlan[]
  onNovoTratamento: () => void
  /** Os dois abaixo só se aplicam ao plano ATIVO — nunca há mais de um (índice
   *  único no banco), então não precisam saber a QUAL cartão se referem. */
  onFinalizar: () => void
  onTrocarFoto: (url: string) => void
  /** Diferente dos três acima, vale para QUALQUER cartão — ativo ou encerrado.
   *  Por isso recebe o plano: precisa saber de qual relatório se trata. */
  onGerarRelatorio: (plano: CarePlan) => void
  /** Id do plano cujo relatório está sendo gerado, ou `null`. */
  gerandoRelatorio: string | null
}

/**
 * MEUS TRATAMENTOS — o ativo e todo o histórico, juntos.
 *
 * É a MESMA leitura do cartão que já aparecia sozinho na tela: aqui ele só
 * ganha companhia. Os encerrados vêm em LEITURA (sem botão de continuar, sem
 * upload de foto) — depois da alta o tratamento é registro, não campo — mas
 * aparecem JUNTO com o ativo, não escondidos atrás de uma aba: "ele já tratou
 * isso antes?" é a primeira pergunta de um retorno, e a resposta muda a
 * conduta de hoje.
 *
 * ATIVO NA FRENTE, encerrados depois pelo início mais recente — tratamento em
 * andamento é trabalho de hoje; um de anos atrás não deveria empurrá-lo para
 * a segunda linha só por ordem de criação.
 */
export function MyTreatments({
  planos, onNovoTratamento, onFinalizar, onTrocarFoto,
  onGerarRelatorio, gerandoRelatorio,
}: MyTreatmentsProps) {
  if (planos.length === 0) {
    return <NoActiveTreatment onNovoTratamento={onNovoTratamento} />
  }

  // Índice único no banco garante no máximo UM ativo — mas pode não haver
  // NENHUM: é o paciente que já recebeu alta de um tratamento e volta depois
  // com outra queixa. `NoActiveTreatment` acima só cobre quem NUNCA teve
  // tratamento nenhum; aqui, com histórico na lista, o botão precisa voltar
  // no cabeçalho para esse caso não ficar sem saída.
  const temAtivo = planos.some(p => p.status === 'active')

  const ordenados = [...planos].sort((a, b) => {
    const peso = (p: CarePlan) => (p.status === 'active' ? 0 : 1)
    return peso(a) - peso(b) || b.inicioIso.localeCompare(a.inicioIso)
  })

  return (
    <section className={styles.raiz}>
      <header className={styles.cabecalho}>
        <div className={styles.cabecalhoTexto}>
          <h2 className={styles.titulo}>Meus tratamentos</h2>
          <span className={styles.contagem}>
            {planos.length} {planos.length === 1 ? 'tratamento' : 'tratamentos'}
          </span>
        </div>
        {!temAtivo && (
          <Button iconLeft={<IconPlus />} onClick={onNovoTratamento}>Novo tratamento</Button>
        )}
      </header>

      <div className={styles.lista}>
        {ordenados.map(plano => (
          <CarePlanCard
            key={plano.id}
            plano={plano}
            onFinalizar={plano.status === 'active' ? onFinalizar : undefined}
            onTrocarFoto={plano.status === 'active' ? onTrocarFoto : undefined}
            onGerarRelatorio={() => onGerarRelatorio(plano)}
            gerandoRelatorio={gerandoRelatorio === plano.id}
          />
        ))}
      </div>
    </section>
  )
}
