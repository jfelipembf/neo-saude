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

/** Líquido da venda = bruto − taxa da adquirente. É o valor ESPERADO da venda
 *  (não o já recebido — este aparece no detalhe expandido): a aba agora lista
 *  por competência, então uma venda pendente de repasse também tem líquido. */
const netOf = (c: Receivable) => c.grossAmount - c.fee

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
 * Aba "Vendas": o que foi VENDIDO no período — regime de COMPETÊNCIA, pela
 * data da venda (mesmo seletor Hoje/Ontem/… do Dashboard e MESMA definição do
 * card "Faturamento"). Venda no cartão aparece no dia da venda, com status
 * pendente até o repasse da adquirente cair (baixa automática do cron).
 * A tabela expansível abre todos os detalhes financeiros do título.
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
    { key: 'competenceDate', label: 'Data da venda', hideOnMobile: true, render: c => c.competenceDate || '—' },
    {
      key: 'patient', label: 'Paciente',
      // Venda sem paciente é legítima (repasse de convênio, aluguel) — traço, não vazio.
      render: c => c.patientId ? patientName(c.patientId) : <span className={shared.traco}>—</span>,
    },
    { key: 'description', label: 'Descrição', render: c => <span className={shared.celulaForte}>{c.description}</span> },
    { key: 'method', label: 'Forma', hideOnMobile: true, render: c => c.method ? PAYMENT_METHOD_LABEL[c.method] : <span className={shared.traco}>—</span> },
    { key: 'source', label: 'Origem', hideOnMobile: true },
    { key: 'gross', label: 'Bruto', hideOnMobile: true, render: c => <span className={shared.valor}>{formatBRL(c.grossAmount)}</span> },
    { key: 'net', label: 'Líquido', render: c => <span className={`${shared.valor} ${shared.pos}`}>{formatBRL(netOf(c))}</span> },
    // Cartão pendente de repasse: o PACIENTE já pagou (dívida é da adquirente)
    // — o rótulo diz isso, em vez de um "Pendente" que soaria como inadimplência.
    {
      key: 'status', label: 'Status',
      render: c => c.debtor === 'acquirer' && (c.status === 'pending' || c.status === 'overdue')
        ? <Badge status="pending" label="Aguardando repasse" />
        : <Badge status={c.status} />,
    },
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
            emptyMessage="Nenhuma venda no período."
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
                  {c.cardBrand && <Campo label="Bandeira" valor={c.cardBrand} />}
                  {c.authorizationCode && <Campo label="Autorização" valor={c.authorizationCode} />}
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
