import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { Spinner } from '@/components/Spinner/Spinner'
import { useReceivables } from '@/hooks/useFinance'
import { usePatients } from '@/hooks/usePatients'
import { useSession } from '@/context/SessionProvider'
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
 * Card do Dashboard com o que há para COBRAR: títulos vencidos e pendentes, do
 * mais atrasado para o mais recente. O detalhe fica no perfil do paciente.
 *
 * Lê `receivable`, e não `public.payment` — aquela tabela está congelada com
 * zero linhas, então este card mostrava "Nenhuma cobrança em aberto" para
 * qualquer clínica, inclusive com parcelas vencidas no banco.
 */
export function BillingCard() {
  const navigate = useNavigate()
  const { canView } = useSession()
  const { data: receivables, isLoading } = useReceivables()
  const { data: patients } = usePatients()

  const nameById = new Map((patients ?? []).map(p => [p.id, p.name]))

  // Em aberto = o que ainda entra no caixa (cancelado e pago ficam de fora).
  // debtor 'payer' porque este card É a fila de cobrança: parcela de cartão é
  // dívida da adquirente, já garantida, e ninguém liga para o paciente por ela.
  // Sem patientId não há a quem cobrar (aluguel de sala, repasse de convênio).
  const openCharges = (receivables ?? []).filter(
    r => (r.status === 'overdue' || r.status === 'pending') && r.debtor === 'payer' && r.patientId,
  )
  const list = [...openCharges].sort((a, b) => {
    // Vencidos primeiro; dentro de cada grupo, o mais antigo cobra primeiro.
    const overdueA = Number(a.status === 'overdue')
    const overdueB = Number(b.status === 'overdue')
    if (overdueA !== overdueB) return overdueB - overdueA
    return dateSortKey(a.dueDate) - dateSortKey(b.dueDate)
  })

  const total = list.reduce((sum, r) => sum + Math.max(r.grossAmount - r.fee - (r.receivedAmount ?? 0), 0), 0)
  const overdueCount = list.filter(r => r.status === 'overdue').length

  // Sem a feature de Financeiro a RLS devolveria lista vazia, e o card diria
  // "nenhuma cobrança em aberto" — mentira por omissão. Melhor não existir.
  if (!canView('finance')) return null

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
            {list.map(r => (
              <li key={r.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemPaciente}>{nameById.get(r.patientId!) ?? 'Paciente'}</span>
                  <span className={styles.itemDescricao}>{r.description}</span>
                  <span className={styles.itemData}><IconClock /> {r.dueDate}</span>
                </div>

                <span className={styles.itemDireita}>
                  <span className={styles.valor}>
                    {formatBRL(Math.max(r.grossAmount - r.fee - (r.receivedAmount ?? 0), 0))}
                  </span>
                  <Badge status={r.status} />
                </span>

                <button
                  type="button"
                  className={styles.verBtn}
                  onClick={() => navigate(buildRoute.patientProfile(r.patientId!))}
                  title="Abrir perfil do paciente"
                  aria-label={`Abrir perfil de ${nameById.get(r.patientId!) ?? 'paciente'}`}
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
