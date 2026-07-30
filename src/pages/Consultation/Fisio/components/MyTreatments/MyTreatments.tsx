import { CarePlanCard } from '@/components/CarePlanCard/CarePlanCard'
import { NoActiveTreatment } from '../NoActiveTreatment/NoActiveTreatment'
import type { CarePlan } from '@/services/carePlansService'
import styles from './MyTreatments.module.scss'

interface MyTreatmentsProps {
  planos: CarePlan[]
  onNovoTratamento: () => void
  /** Os três abaixo só se aplicam ao plano ATIVO — nunca há mais de um (índice
   *  único no banco), então não precisam saber a QUAL cartão se referem. */
  onContinuar: () => void
  onFinalizar: () => void
  onTrocarFoto: (url: string) => void
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
  planos, onNovoTratamento, onContinuar, onFinalizar, onTrocarFoto,
}: MyTreatmentsProps) {
  if (planos.length === 0) {
    return <NoActiveTreatment onNovoTratamento={onNovoTratamento} />
  }

  const ordenados = [...planos].sort((a, b) => {
    const peso = (p: CarePlan) => (p.status === 'active' ? 0 : 1)
    return peso(a) - peso(b) || b.inicioIso.localeCompare(a.inicioIso)
  })

  return (
    <section className={styles.raiz}>
      <header className={styles.cabecalho}>
        <h2 className={styles.titulo}>Meus tratamentos</h2>
        <span className={styles.contagem}>
          {planos.length} {planos.length === 1 ? 'tratamento' : 'tratamentos'}
        </span>
      </header>

      <div className={styles.lista}>
        {ordenados.map(plano => (
          <CarePlanCard
            key={plano.id}
            plano={plano}
            onFinalizar={plano.status === 'active' ? onFinalizar : undefined}
            onContinuar={plano.status === 'active' ? onContinuar : undefined}
            onTrocarFoto={plano.status === 'active' ? onTrocarFoto : undefined}
          />
        ))}
      </div>
    </section>
  )
}
