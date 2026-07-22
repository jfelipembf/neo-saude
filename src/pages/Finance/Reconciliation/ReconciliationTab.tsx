import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { useToast } from '@/components/Toast/useToast'
import { usePagination } from '@/hooks/usePagination'
import { IconCheck } from '@/components/icons'
import { useReceivables, useAcquirers, useBankAccounts, useSettleReceivablesBatch } from '@/hooks/useFinance'
import { PAYMENT_METHOD_LABEL } from '@/constants'
import { formatBRL } from '@/utils/format'
import { parseBrDate, toShortDateWithYear } from '@/utils/date'
import type { Receivable } from '@/types/domain'
import shared from '../shared/finance.module.scss'

/** Um grupo = o que se espera cair na conta num mesmo dia, de uma mesma
 *  adquirente (é assim que a fatura da maquininha chega: um lote por dia). */
interface PayoutGroup {
  key: string
  acquirerId: string
  acquirerName: string
  payoutAccountName: string
  expectedDate: string     // dd/mm/aaaa — vencimento do título JÁ É a data do repasse
  items: Receivable[]
  grossAmount: number
  fee: number
  netAmount: number
  settledAmount: number    // o que já foi baixado (automática ou manualmente)
  pendingIds: string[]     // ainda não baixados
}

/**
 * Aba "Conciliação" — CONFERÊNCIA, não baixa.
 *
 * Desde que o recebível de cartão nasce com `due_date` = DATA PREVISTA DE
 * REPASSE e a rotina diária (private.run_finance_daily) baixa o crédito sozinha
 * nessa data, esta tela deixou de ser o ato de dar baixa e passou a ser a
 * pergunta que importa: O QUE CAIU × O QUE ERA ESPERADO.
 *
 * Duas consequências diretas no código desta tela:
 *  1. NÃO se soma `settlementDays` de novo. Antes a tela fazia
 *     `dueDate + settlementDays` porque o vencimento era a data da venda; hoje o
 *     banco já gravou o repasse. Somar outra vez jogaria o lote 30 dias adiante
 *     e a conferência nunca bateria com o extrato.
 *  2. O botão "Confirmar repasse" vira EXCEÇÃO, não rotina: só aparece quando a
 *     data prevista já passou e o título continua em aberto — ou seja, débito
 *     (que não tem baixa automática, porque o dinheiro pode não entrar) ou uma
 *     falha da rotina. Um lote ainda no futuro não tem o que confirmar.
 */
export function ReconciliationTab() {
  const toast = useToast()
  const { data: receivables, isLoading: loadingReceivables } = useReceivables()
  const { data: acquirers, isLoading: loadingAcquirers } = useAcquirers()
  const { data: bankAccounts } = useBankAccounts()
  const { mutate: settleBatch, isPending: settling } = useSettleReceivablesBatch()

  const acquirerById = new Map((acquirers ?? []).map(a => [a.id, a]))
  const accountNameById = new Map((bankAccounts ?? []).map(a => [a.id, a.name]))

  // Só o que passa por adquirente (cartão) entra em conciliação — pix/boleto
  // caem direto na conta, sem repasse de terceiro para conferir.
  // 'canceled' fica de fora: a venda foi desfeita, a adquirente não vai
  // repassar nada por ela. Somada, ela inflava o "Líquido esperado" de um lote
  // que nunca mais fecha — numa tela cujo trabalho é justamente comparar o
  // esperado com o que caiu, uma diferença permanente e inexplicável ensina o
  // usuário a ignorar a divergência.
  const cardReceivables = (receivables ?? []).filter(
    r => r.acquirerId && acquirerById.has(r.acquirerId) && r.status !== 'canceled',
  )

  const groups = new Map<string, PayoutGroup>()
  for (const r of cardReceivables) {
    const acquirer = acquirerById.get(r.acquirerId!)!
    const expectedDate = r.dueDate
    const key = `${acquirer.id}·${expectedDate}`
    const group = groups.get(key) ?? {
      key, acquirerId: acquirer.id, acquirerName: acquirer.name,
      payoutAccountName: acquirer.payoutAccountId ? accountNameById.get(acquirer.payoutAccountId) ?? '—' : '—',
      expectedDate, items: [], grossAmount: 0, fee: 0, netAmount: 0, settledAmount: 0, pendingIds: [],
    }
    group.items.push(r)
    group.grossAmount += r.grossAmount
    group.fee += r.fee
    group.netAmount += r.grossAmount - r.fee
    group.settledAmount += r.receivedAmount ?? 0
    if (r.status === 'pending' || r.status === 'overdue') group.pendingIds.push(r.id)
    groups.set(key, group)
  }

  const rows = [...groups.values()].sort((a, b) => parseBrDate(a.expectedDate).getTime() - parseBrDate(b.expectedDate).getTime())
  const totalExpected = rows.reduce((s, g) => s + g.netAmount, 0)
  const totalSettled = rows.reduce((s, g) => s + g.settledAmount, 0)
  const pagination = usePagination(rows)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  /** Repasse cuja data já passou e que continua em aberto: é o que precisa de
   *  olho humano — ou a adquirente não depositou, ou é débito esperando baixa. */
  const isLate = (g: PayoutGroup) => g.pendingIds.length > 0 && parseBrDate(g.expectedDate) < today

  if (loadingReceivables || loadingAcquirers) return <PageLoader />

  function confirmPayout(group: PayoutGroup) {
    const acquirer = acquirerById.get(group.acquirerId)
    settleBatch(
      {
        ids: group.pendingIds,
        settlement: {
          date: toShortDateWithYear(new Date()),
          bankAccountId: acquirer?.payoutAccountId,
          notes: `Repasse conferido manualmente — ${group.acquirerName}, previsto ${group.expectedDate}.`,
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
    { key: 'settled', label: 'Já caiu', render: g => <span className={shared.valor}>{formatBRL(g.settledAmount)}</span> },
    {
      key: 'actions', label: 'Situação',
      render: g => {
        if (g.pendingIds.length === 0) return <Badge status="paid" label="Conciliado" />
        if (!isLate(g)) return <Badge status="pending" label="Aguardando repasse" />
        return (
          <Button size="sm" iconLeft={<IconCheck />} loading={settling} onClick={() => confirmPayout(g)}>
            Confirmar repasse
          </Button>
        )
      },
    },
  ]

  return (
    <Table
      columns={columns}
      data={pagination.visible}
      rowKey={g => g.key}
      emptyMessage="Nenhum recebível de cartão para conciliar."
      toolbar={<PerPageSelect perPage={pagination.perPage} onChange={pagination.setPerPage} />}
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
            <span className={`${shared.resumoItem} ${shared.resumoDireita}`}>Já caiu <strong>{formatBRL(totalSettled)}</strong></span>
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
