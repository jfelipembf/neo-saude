import { Badge } from '@/components/Badge/Badge'
import { FormSection } from '@/components/FormSection/FormSection'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { usePagination } from '@/hooks/usePagination'
import { useSubscription, useInvoices } from '@/hooks/useSubscription'
import { formatBRL } from '@/utils/format'
import type { SubscriptionInvoice } from '@/types/domain'
import styles from './SubscriptionTab.module.scss'

const CYCLE_LABEL = { monthly: 'por mês', yearly: 'por ano' } as const

/**
 * Aba "Assinatura": o que a CLÍNICA paga para usar o Neo Saúde.
 * Não confundir com a página Financeiro, que é o caixa da clínica.
 */
export function SubscriptionTab() {
  const { data: subscription, isLoading: loadingPlan } = useSubscription()
  const { data: invoices, isLoading: loadingInvoices } = useInvoices()

  const pagination = usePagination(invoices ?? [])

  if (loadingPlan || loadingInvoices || !subscription) return <PageLoader />

  const columns: TableColumn<SubscriptionInvoice>[] = [
    {
      key: 'competencia', label: 'Competência',
      render: f => <span className={styles.competencia}>{f.referenceMonth}</span>,
    },
    { key: 'dueDate', label: 'Vencimento' },
    { key: 'pagamento',  label: 'Pagamento', render: f => f.paidAt ?? '—' },
    { key: 'forma',      label: 'Forma', render: f => f.paymentMethod ?? '—' },
    {
      key: 'valor', label: 'Valor',
      render: f => <span className={styles.valor}>{formatBRL(f.amount)}</span>,
    },
    { key: 'status', label: 'Status', render: f => <Badge status={f.status} /> },
  ]

  const totalPaid = (invoices ?? [])
    .filter(f => f.status === 'paid')
    .reduce((sum, f) => sum + f.amount, 0)

  return (
    <div className={styles.coluna}>
      <FormSection
        title="Plano atual"
        description="Cobrança recorrente pelo acesso ao sistema."
        actions={<Badge status={subscription.status} />}
      >
        <div className={styles.plano}>
          <div className={styles.preco}>
            <span className={styles.precoNome}>{subscription.plan}</span>
            <span className={styles.precoValor}>
              {formatBRL(subscription.amount)}
              <small>{CYCLE_LABEL[subscription.cycle]}</small>
            </span>
          </div>

          <dl className={styles.pares}>
            <div className={styles.par}>
              <dt>Próxima cobrança</dt>
              <dd>{subscription.nextBilling}</dd>
            </div>
            <div className={styles.par}>
              <dt>Cliente desde</dt>
              <dd>{subscription.since}</dd>
            </div>
            <div className={styles.par}>
              <dt>Forma de pagamento</dt>
              <dd>{subscription.paymentMethod ?? '—'}</dd>
            </div>
            {subscription.includedProfessionals != null && (
              <div className={styles.par}>
                <dt>Profissionais</dt>
                <dd>
                  {subscription.professionalsInUse ?? 0} de {subscription.includedProfessionals}
                  <span className={styles.parDica}> incluídos no plano</span>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </FormSection>

      <FormSection
        title="Histórico de faturas"
        description="Pagamentos feitos pela clínica para manter o acesso ao app."
      >
        <Table
          columns={columns}
          data={pagination.visible}
          rowKey={f => f.id}
          emptyMessage="Nenhuma fatura emitida."
          toolbar={<PerPageSelect perPage={pagination.perPage} onChange={pagination.setPerPage} ariaLabel="Faturas por página" />}
          footer={
            <div className={styles.rodape}>
              <span className={styles.resumo}>
                Total pago <strong>{formatBRL(totalPaid)}</strong>
              </span>
              <Pagination
                page={pagination.currentPage}
                totalPages={pagination.totalPages}
                onChange={pagination.setPage}
                totalItems={pagination.total}
                itemsPerPage={pagination.perPage}
              />
            </div>
          }
        />
      </FormSection>
    </div>
  )
}
