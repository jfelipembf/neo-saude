import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { useToast } from '@/components/Toast/useToast'
import { IconCheck } from '@/components/icons'
import { useReceivables, useAcquirers, useBankAccounts, useSettleReceivablesBatch } from '@/hooks/useFinance'
import { PAYMENT_METHOD_LABEL } from '@/constants'
import { formatBRL } from '@/utils/format'
import { addDays, parseBrDate, toShortDateWithYear } from '@/utils/date'
import type { Receivable } from '@/types/domain'
import shared from '../shared/finance.module.scss'

/** Um grupo = o que se espera cair na conta num mesmo dia, de uma mesma
 *  adquirente (é assim que a fatura da maquininha chega: um lote por dia). */
interface PayoutGroup {
  key: string
  acquirerId: string
  acquirerName: string
  payoutAccountName: string
  expectedDate: string     // dd/mm/aaaa
  items: Receivable[]
  grossAmount: number
  fee: number
  netAmount: number
  pendingIds: string[]     // ainda não conciliados — o que o botão confirma
}

/** Aba "Conciliação": agrupa os recebíveis de cartão por adquirente e data
 *  prevista de repasse (venda + D+N), comparando bruto/taxa/líquido esperado
 *  com o que a maquininha deve depositar na conta. */
export function ReconciliationTab() {
  const toast = useToast()
  const { data: receivables, isLoading: loadingReceivables } = useReceivables()
  const { data: acquirers, isLoading: loadingAcquirers } = useAcquirers()
  const { data: bankAccounts } = useBankAccounts()
  const { mutate: settleBatch, isPending: settling } = useSettleReceivablesBatch()

  if (loadingReceivables || loadingAcquirers) return <PageLoader />

  const acquirerById = new Map((acquirers ?? []).map(a => [a.id, a]))
  const accountNameById = new Map((bankAccounts ?? []).map(a => [a.id, a.name]))

  // Só o que passa por adquirente (cartão) entra em conciliação — pix/boleto
  // caem direto na conta, sem repasse de terceiro para conferir.
  const cardReceivables = (receivables ?? []).filter(r => r.acquirerId && acquirerById.has(r.acquirerId))

  const groups = new Map<string, PayoutGroup>()
  for (const r of cardReceivables) {
    const acquirer = acquirerById.get(r.acquirerId!)!
    const expectedDate = toShortDateWithYear(addDays(parseBrDate(r.dueDate), acquirer.settlementDays))
    const key = `${acquirer.id}·${expectedDate}`
    const group = groups.get(key) ?? {
      key, acquirerId: acquirer.id, acquirerName: acquirer.name,
      payoutAccountName: acquirer.payoutAccountId ? accountNameById.get(acquirer.payoutAccountId) ?? '—' : '—',
      expectedDate, items: [], grossAmount: 0, fee: 0, netAmount: 0, pendingIds: [],
    }
    group.items.push(r)
    group.grossAmount += r.grossAmount
    group.fee += r.fee
    group.netAmount += r.grossAmount - r.fee
    if (r.status === 'pending' || r.status === 'overdue') group.pendingIds.push(r.id)
    groups.set(key, group)
  }

  const rows = [...groups.values()].sort((a, b) => parseBrDate(a.expectedDate).getTime() - parseBrDate(b.expectedDate).getTime())
  const totalExpected = rows.reduce((s, g) => s + g.netAmount, 0)
  const totalPending = rows.reduce((s, g) => s + g.pendingIds.length, 0)

  function confirmPayout(group: PayoutGroup) {
    const acquirer = acquirerById.get(group.acquirerId)
    settleBatch(
      {
        ids: group.pendingIds,
        settlement: {
          date: toShortDateWithYear(new Date()),
          bankAccountId: acquirer?.payoutAccountId,
          notes: `Repasse conciliado — ${group.acquirerName}, previsto ${group.expectedDate}.`,
        },
      },
      { onSuccess: count => toast.success(`Repasse de ${group.acquirerName} confirmado (${count} recebível${count > 1 ? 'is' : ''}).`) },
    )
  }

  const columns: TableColumn<PayoutGroup>[] = [
    { key: 'acquirer', label: 'Adquirente', render: g => <span className={shared.celulaForte}>{g.acquirerName}</span> },
    { key: 'expectedDate', label: 'Repasse previsto' },
    { key: 'account', label: 'Conta de repasse', render: g => g.payoutAccountName },
    { key: 'count', label: 'Qtde', render: g => <span className={shared.contagem}>{g.items.length}</span> },
    { key: 'gross', label: 'Bruto', render: g => <span className={shared.valor}>{formatBRL(g.grossAmount)}</span> },
    { key: 'fee', label: 'Taxa', render: g => <span className={shared.neg}>{formatBRL(g.fee)}</span> },
    { key: 'net', label: 'Líquido esperado', render: g => <span className={`${shared.valor} ${shared.pos}`}>{formatBRL(g.netAmount)}</span> },
    {
      key: 'actions', label: 'Ação',
      render: g => g.pendingIds.length > 0 ? (
        <Button size="sm" iconLeft={<IconCheck />} loading={settling} onClick={() => confirmPayout(g)}>
          Confirmar repasse
        </Button>
      ) : <Badge status="paid" label="Conciliado" />,
    },
  ]

  return (
    <Table
      columns={columns}
      data={rows}
      rowKey={g => g.key}
      emptyMessage="Nenhum recebível de cartão para conciliar."
      renderExpanded={g => (
        <ul className={shared.detalheLista}>
          {g.items.map(item => (
            <li key={item.id} className={shared.detalheItem}>
              <span>{item.description}</span>
              <span className={shared.contagem}>{item.method ? PAYMENT_METHOD_LABEL[item.method] : '—'}</span>
              <span>{formatBRL(item.grossAmount - item.fee)}</span>
              <Badge status={item.status} />
            </li>
          ))}
        </ul>
      )}
      footer={
        <div className={shared.rodapeTabela}>
          <div className={shared.resumo}>
            <span className={shared.resumoItem}>Líquido esperado <strong className={shared.pos}>{formatBRL(totalExpected)}</strong></span>
            <span className={`${shared.resumoItem} ${shared.resumoDireita}`}>Pendentes de repasse <strong>{totalPending}</strong></span>
          </div>
        </div>
      }
    />
  )
}
