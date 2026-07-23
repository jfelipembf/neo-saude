import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Badge } from '@/components/Badge/Badge'
import { PeriodFilter } from '@/components/PeriodFilter/PeriodFilter'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { useSales } from '@/hooks/useSales'
import { useBankAccounts } from '@/hooks/useFinance'
import { usePagination } from '@/hooks/usePagination'
import { usePatientName } from '@/hooks/useDisplayNames'
import { dashboardRange } from '@/utils/period'
import type { PeriodPreset } from '@/utils/period'
import { PAYMENT_METHOD_LABEL } from '@/constants'
import { formatBRL } from '@/utils/format'
import type { Receivable } from '@/types/domain'
import shared from '../shared/finance.module.scss'
import styles from './SalesTab.module.scss'

/** O que de fato ENTROU no título: a baixa parcial acumula em receivedAmount;
 *  sem ela, o líquido é bruto − taxa (o caso da venda quitada de uma vez). */
const netOf = (c: Receivable) => c.receivedAmount ?? (c.grossAmount - c.fee)

/** Um par rótulo/valor da grade de detalhes (aceita texto ou children, ex.: Badge). */
function Campo({ label, valor, children }: { label: string; valor?: string; children?: ReactNode }) {
  return (
    <div className={styles.campo}>
      <dt className={styles.rotulo}>{label}</dt>
      <dd className={styles.dado}>{children ?? valor}</dd>
    </div>
  )
}

/**
 * Aba "Vendas": os recebíveis QUITADOS do período (mesmo seletor Hoje/Ontem/…
 * do Dashboard), com a quebra por forma de pagamento no topo e a tabela
 * expansível que abre TODOS os detalhes financeiros do título.
 */
export function SalesTab() {
  const [preset, setPreset] = useState<PeriodPreset>('today')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const range = dashboardRange(preset, customFrom, customTo)

  const { data: sales, isLoading } = useSales(range)
  const { data: bankAccounts } = useBankAccounts()
  const patientName = usePatientName()

  const list = useMemo(() => sales ?? [], [sales])
  const pagination = usePagination(list)

  // bankAccountId → nome (o detalhe mostra o banco onde o dinheiro entrou).
  const bankName = useMemo(() => {
    const byId = new Map((bankAccounts ?? []).map(b => [b.id, b.name]))
    return (id?: string) => (id ? byId.get(id) ?? '—' : '—')
  }, [bankAccounts])

  // Totais do período (rodapé da tabela).
  const totalGross = list.reduce((s, c) => s + c.grossAmount, 0)
  const totalFee = list.reduce((s, c) => s + c.fee, 0)
  const totalNet = list.reduce((s, c) => s + netOf(c), 0)

  const columns: TableColumn<Receivable>[] = [
    { key: 'receivedAt', label: 'Recebimento', render: c => c.receivedAt ?? '—' },
    {
      key: 'patient', label: 'Paciente',
      // Venda sem paciente é legítima (repasse de convênio, aluguel) — traço, não vazio.
      render: c => c.patientId ? patientName(c.patientId) : <span className={shared.traco}>—</span>,
    },
    { key: 'description', label: 'Descrição', render: c => <span className={shared.celulaForte}>{c.description}</span> },
    { key: 'method', label: 'Forma', render: c => c.method ? PAYMENT_METHOD_LABEL[c.method] : <span className={shared.traco}>—</span> },
    { key: 'source', label: 'Origem' },
    { key: 'gross', label: 'Bruto', render: c => <span className={shared.valor}>{formatBRL(c.grossAmount)}</span> },
    { key: 'net', label: 'Líquido', render: c => <span className={`${shared.valor} ${shared.pos}`}>{formatBRL(netOf(c))}</span> },
  ]

  return (
    <>
      <div className={styles.cabecalho}>
        <PeriodFilter
          preset={preset}
          onPreset={setPreset}
          customFrom={customFrom}
          customTo={customTo}
          onCustom={(from, to) => { setCustomFrom(from); setCustomTo(to) }}
        />
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          <Table
            columns={columns}
            data={pagination.visible}
            rowKey={c => c.id}
            emptyMessage="Nenhuma venda recebida no período."
            toolbar={
              <div className={styles.toolbar}>
                <PerPageSelect perPage={pagination.perPage} onChange={pagination.setPerPage} />
              </div>
            }
            renderExpanded={c => (
              <div className={styles.detalhe}>
                <dl className={styles.grade}>
                  <Campo label="Código" valor={c.code} />
                  <Campo label="Origem" valor={c.source} />
                  <Campo label="Forma de pagamento" valor={c.method ? PAYMENT_METHOD_LABEL[c.method] : '—'} />
                  <Campo label="Parcela" valor={c.installmentNumber && c.installmentCount ? `${c.installmentNumber} de ${c.installmentCount}` : '—'} />
                  <Campo label="Vencimento" valor={c.dueDate || '—'} />
                  <Campo label="Recebimento" valor={c.receivedAt ?? '—'} />
                  <Campo label="Conta bancária" valor={bankName(c.bankAccountId)} />
                  <Campo label="Valor bruto" valor={formatBRL(c.grossAmount)} />
                  <Campo label="Taxa" valor={c.fee > 0 ? formatBRL(c.fee) : '—'} />
                  <Campo label="Valor líquido" valor={formatBRL(netOf(c))} />
                  <Campo label="Recebido" valor={c.receivedAmount != null ? formatBRL(c.receivedAmount) : '—'} />
                  <Campo label="Status"><Badge status={c.status} /></Campo>
                </dl>
                {c.notes && <p className={styles.obs}><strong>Observações:</strong> {c.notes}</p>}
              </div>
            )}
            footer={
              <div className={shared.rodapeTabela}>
                <div className={shared.resumo}>
                  <span className={shared.resumoItem}>Bruto <strong>{formatBRL(totalGross)}</strong></span>
                  <span className={shared.resumoItem}>Taxas <strong className={shared.neg}>{formatBRL(totalFee)}</strong></span>
                  <span className={shared.resumoItem}>Líquido <strong className={shared.pos}>{formatBRL(totalNet)}</strong></span>
                  <span className={`${shared.resumoItem} ${shared.resumoDireita}`}>Vendas <strong>{list.length}</strong></span>
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
        </>
      )}
    </>
  )
}
