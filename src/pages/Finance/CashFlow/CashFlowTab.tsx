import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { useCashFlow } from '@/hooks/useFinance'
import { usePagination } from '@/hooks/usePagination'
import { formatBRL } from '@/utils/format'
import type { CashFlowDay } from '@/types/domain'
import shared from '../shared/finance.module.scss'

/** Linha da tabela: o dia do serviço + os acumulados calculados aqui. */
type CashFlowRow = CashFlowDay & { net: number; projected: number }

/** Aba "Fluxo de caixa": projeção diária cumulativa a partir do saldo atual. */
export function CashFlowTab() {
  const { data, isLoading } = useCashFlow()

  const baseBalance = data?.baseBalance ?? 0
  const days = data?.days ?? []

  // Saldo projetado cumulativo a partir do saldo base.
  const rows: CashFlowRow[] = []
  let accumulated = baseBalance
  for (const d of days) {
    const net = d.inflows - d.outflows
    accumulated += net
    rows.push({ ...d, net, projected: accumulated })
  }

  const pagination = usePagination(rows)

  if (isLoading) return <PageLoader />

  const totalInflows  = days.reduce((s, d) => s + d.inflows, 0)
  const totalOutflows = days.reduce((s, d) => s + d.outflows, 0)
  const projected     = rows.length ? rows[rows.length - 1].projected : baseBalance

  const columns: TableColumn<CashFlowRow>[] = [
    {
      key: 'data', label: 'Data',
      render: d => (
        <span className={shared.celulaForte}>
          {d.date} <span className={shared.contagem}>({d.entryCount})</span>
        </span>
      ),
    },
    { key: 'entradas', label: 'Entradas', render: d => d.inflows > 0 ? <span className={shared.pos}>{formatBRL(d.inflows)}</span> : <span className={shared.traco}>—</span> },
    { key: 'saidas',   label: 'Saídas',   render: d => d.outflows > 0 ? <span className={shared.neg}>{formatBRL(d.outflows)}</span> : <span className={shared.traco}>—</span> },
    {
      key: 'liquido', label: 'Líquido',
      render: d => (
        <span className={`${shared.valor} ${d.net >= 0 ? shared.pos : shared.neg}`}>
          {d.net >= 0 ? '+' : ''}{formatBRL(d.net)}
        </span>
      ),
    },
    {
      key: 'projetado', label: 'Saldo projetado',
      render: d => (
        <span className={`${shared.valor} ${d.projected < 0 ? shared.neg : ''}`}>{formatBRL(d.projected)}</span>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={pagination.visible}
      rowKey={d => d.id}
      emptyMessage="Sem projeção no período."
      toolbar={<PerPageSelect perPage={pagination.perPage} onChange={pagination.setPerPage} />}
      footer={
        <div className={shared.rodapeTabela}>
          <div className={shared.resumo}>
            <span className={shared.resumoItem}>Saldo atual <strong>{formatBRL(baseBalance)}</strong></span>
            <span className={shared.resumoItem}>Entradas <strong className={shared.pos}>{formatBRL(totalInflows)}</strong></span>
            <span className={shared.resumoItem}>Saídas <strong className={shared.neg}>{formatBRL(totalOutflows)}</strong></span>
            <span className={`${shared.resumoItem} ${shared.resumoDireita}`}>Projetado <strong>{formatBRL(projected)}</strong></span>
          </div>
          <div className={shared.rodapePaginacao}>
            <Pagination
              page={pagination.currentPage}
              totalPages={pagination.totalPages}
              onChange={pagination.setPage}
              totalItems={pagination.total}
              itemsPerPage={pagination.perPage}
            />
          </div>
        </div>
      }
    />
  )
}
