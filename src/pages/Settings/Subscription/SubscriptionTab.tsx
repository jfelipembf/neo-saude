import { Badge } from '@/components/Badge/Badge'
import { FormSection } from '@/components/FormSection/FormSection'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { usePagination } from '@/hooks/usePagination'
import { useAssinatura, useFaturas } from '@/hooks/useAssinatura'
import { formatarReais } from '@/utils/format'
import type { SubscriptionInvoice } from '@/types/domain'
import styles from './SubscriptionTab.module.scss'

const CICLO_LABEL = { mensal: 'por mês', anual: 'por ano' } as const

/**
 * Aba "Assinatura": o que a CLÍNICA paga para usar o Neo Saúde.
 * Não confundir com a página Financeiro, que é o caixa da clínica.
 */
export function SubscriptionTab() {
  const { data: assinatura, isLoading: carregandoPlano } = useAssinatura()
  const { data: faturas, isLoading: carregandoFaturas } = useFaturas()

  const pag = usePagination(faturas ?? [])

  if (carregandoPlano || carregandoFaturas || !assinatura) return <PageLoader />

  const colunas: TableColumn<SubscriptionInvoice>[] = [
    {
      key: 'competencia', label: 'Competência',
      render: f => <span className={styles.competencia}>{f.competencia}</span>,
    },
    { key: 'vencimento', label: 'Vencimento' },
    { key: 'pagamento',  label: 'Pagamento', render: f => f.pagamento ?? '—' },
    { key: 'forma',      label: 'Forma', render: f => f.formaPagamento ?? '—' },
    {
      key: 'valor', label: 'Valor',
      render: f => <span className={styles.valor}>{formatarReais(f.valor)}</span>,
    },
    { key: 'status', label: 'Status', render: f => <Badge status={f.status} /> },
  ]

  const totalPago = (faturas ?? [])
    .filter(f => f.status === 'pago')
    .reduce((soma, f) => soma + f.valor, 0)

  return (
    <div className={styles.coluna}>
      <FormSection
        title="Plano atual"
        description="Cobrança recorrente pelo acesso ao sistema."
        actions={<Badge status={assinatura.status} />}
      >
        <div className={styles.plano}>
          <div className={styles.preco}>
            <span className={styles.precoNome}>{assinatura.plano}</span>
            <span className={styles.precoValor}>
              {formatarReais(assinatura.valor)}
              <small>{CICLO_LABEL[assinatura.ciclo]}</small>
            </span>
          </div>

          <dl className={styles.pares}>
            <div className={styles.par}>
              <dt>Próxima cobrança</dt>
              <dd>{assinatura.proximaCobranca}</dd>
            </div>
            <div className={styles.par}>
              <dt>Cliente desde</dt>
              <dd>{assinatura.desde}</dd>
            </div>
            <div className={styles.par}>
              <dt>Forma de pagamento</dt>
              <dd>{assinatura.formaPagamento ?? '—'}</dd>
            </div>
            {assinatura.profissionaisIncluidos != null && (
              <div className={styles.par}>
                <dt>Profissionais</dt>
                <dd>
                  {assinatura.profissionaisEmUso ?? 0} de {assinatura.profissionaisIncluidos}
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
          columns={colunas}
          data={pag.visiveis}
          rowKey={f => f.id}
          emptyMessage="Nenhuma fatura emitida."
          toolbar={<PerPageSelect porPagina={pag.porPagina} onChange={pag.mudarPorPagina} ariaLabel="Faturas por página" />}
          footer={
            <div className={styles.rodape}>
              <span className={styles.resumo}>
                Total pago <strong>{formatarReais(totalPago)}</strong>
              </span>
              <Pagination
                page={pag.paginaAtual}
                totalPages={pag.totalPaginas}
                onChange={pag.setPagina}
                totalItems={pag.total}
                itemsPerPage={pag.porPagina}
              />
            </div>
          }
        />
      </FormSection>
    </div>
  )
}
