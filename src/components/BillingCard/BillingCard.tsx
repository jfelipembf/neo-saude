import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { Spinner } from '@/components/Spinner/Spinner'
import { usePayments } from '@/hooks/usePayments'
import { usePatients } from '@/hooks/usePatients'
import { APP_ROUTES, buildRoute } from '@/constants'
import { formatBRL } from '@/utils/format'
import { IconClock, IconEye } from '@/components/icons'
import styles from './BillingCard.module.scss'

/** dd/mm/aaaa → número ordenável (aaaammdd). */
function dateSortKey(date: string) {
  const [day, month, year] = date.split('/').map(Number)
  return year * 10000 + month * 100 + day
}

/**
 * Card do Dashboard com o que há para cobrar: pagamentos vencidos e pendentes,
 * do mais atrasado para o mais recente. O detalhe fica no perfil do paciente.
 */
export function BillingCard() {
  const navigate = useNavigate()
  const { data: payments, isLoading } = usePayments()
  const { data: patients } = usePatients()

  const nameById = new Map((patients ?? []).map(p => [p.id, p.name]))

  // Em aberto = o que ainda entra no caixa (cancelado e pago ficam de fora).
  const openPayments = (payments ?? []).filter(p => p.status === 'overdue' || p.status === 'pending')
  const list = [...openPayments].sort((a, b) => {
    // Vencidos primeiro; dentro de cada grupo, o mais antigo cobra primeiro.
    const overdueA = Number(a.status === 'overdue')
    const overdueB = Number(b.status === 'overdue')
    if (overdueA !== overdueB) return overdueB - overdueA
    return dateSortKey(a.date) - dateSortKey(b.date)
  })

  const total = list.reduce((sum, p) => sum + p.amount, 0)
  const overdueCount = list.filter(p => p.status === 'overdue').length

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>Cobranças</h2>
        <div className={styles.headerDireita}>
          {overdueCount > 0 && (
            <span className={styles.contagem}>{overdueCount} vencida{overdueCount > 1 ? 's' : ''}</span>
          )}
          <Button variant="ghost" size="sm" onClick={() => navigate(APP_ROUTES.FINANCE)}>
            Ver todas
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className={styles.carregando}><Spinner /></div>
      ) : (
        <>
          <ul className={styles.lista}>
            {list.length === 0 && (
              <li className={styles.vazio}>Nenhuma cobrança em aberto.</li>
            )}
            {list.map(p => (
              <li key={p.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemPaciente}>{nameById.get(p.patientId) ?? 'Paciente'}</span>
                  <span className={styles.itemDescricao}>{p.description}</span>
                  <span className={styles.itemData}><IconClock /> {p.date}</span>
                </div>

                <span className={styles.itemDireita}>
                  <span className={styles.valor}>{formatBRL(p.amount)}</span>
                  <Badge status={p.status} />
                </span>

                <button
                  type="button"
                  className={styles.verBtn}
                  onClick={() => navigate(buildRoute.patientProfile(p.patientId))}
                  title="Abrir perfil do paciente"
                  aria-label={`Abrir perfil de ${nameById.get(p.patientId) ?? 'paciente'}`}
                >
                  <IconEye />
                </button>
              </li>
            ))}
          </ul>

          {list.length > 0 && (
            <footer className={styles.rodape}>
              <span className={styles.rodapeLabel}>Total em aberto</span>
              <strong className={styles.rodapeValor}>{formatBRL(total)}</strong>
            </footer>
          )}
        </>
      )}
    </section>
  )
}
