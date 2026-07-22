import { useState } from 'react'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Badge } from '@/components/Badge/Badge'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { useToast } from '@/components/Toast/useToast'
import { IconCheck, IconUndo, IconX } from '@/components/icons'
import { usePayables, useSettlePayable, useCancelPayable, useReversePayable } from '@/hooks/useFinance'
import { usePagination } from '@/hooks/usePagination'
import { formatBRL } from '@/utils/format'
import type { Payable } from '@/types/domain'
import { SettleModal } from '../shared/SettleModal'
import shared from '../shared/finance.module.scss'

/** Aba "Contas a Pagar": listagem, settlement e cancelamento de despesas. */
export function PayableTab() {
  const toast = useToast()
  const { data: payables, isLoading } = usePayables()
  const { mutate: settle, isPending: settling } = useSettlePayable()
  const { mutate: cancel } = useCancelPayable()
  const { mutate: reverse } = useReversePayable()

  const list = payables ?? []
  const pagination = usePagination(list)

  const [toSettle, setToSettle] = useState<Payable | null>(null)
  const [toCancel, setToCancel] = useState<Payable | null>(null)
  const [toReverse, setToReverse] = useState<Payable | null>(null)

  if (isLoading) return <PageLoader />

  const isOpen = (c: Payable) => c.status === 'pending' || c.status === 'overdue'
  const toPay = list.filter(isOpen).reduce((s, c) => s + c.amount, 0)
  const paid  = list.filter(c => c.status === 'paid').reduce((s, c) => s + (c.paidAmount ?? c.amount), 0)

  const columns: TableColumn<Payable>[] = [
    { key: 'descricao',  label: 'Descrição', render: c => <span className={shared.celulaForte}>{c.description}</span> },
    { key: 'category',  label: 'Categoria' },
    { key: 'dueDate', label: 'Vencimento' },
    { key: 'pagamento',  label: 'Pagamento', render: c => c.paidAt ?? '—' },
    { key: 'supplier', label: 'Fornecedor' },
    { key: 'valor',      label: 'Valor', render: c => <span className={shared.valor}>{formatBRL(c.amount)}</span> },
    { key: 'status',     label: 'Status', render: c => <Badge status={c.status} /> },
    {
      key: 'acoes', label: 'Ação',
      render: c => (
        <span className={shared.acoes}>
          {isOpen(c) && (
            <>
              <button
                type="button"
                className={`${shared.acaoBtn} ${shared['acaoBtn--confirmar']}`}
                title="Dar settlement"
                aria-label={`Dar settlement em ${c.description}`}
                onClick={() => setToSettle(c)}
              >
                <IconCheck />
              </button>
              <button
                type="button"
                className={`${shared.acaoBtn} ${shared['acaoBtn--cancelar']}`}
                title="Cancelar"
                aria-label={`Cancelar ${c.description}`}
                onClick={() => setToCancel(c)}
              >
                <IconX />
              </button>
            </>
          )}
          {c.status === 'paid' && (
            <button
              type="button"
              className={`${shared.acaoBtn} ${shared['acaoBtn--estornar']}`}
              title="Estornar baixa"
              aria-label={`Estornar baixa de ${c.description}`}
              onClick={() => setToReverse(c)}
            >
              <IconUndo />
            </button>
          )}
        </span>
      ),
    },
  ]

  return (
    <>
      <Table
        columns={columns}
        data={pagination.visible}
        rowKey={c => c.id}
        emptyMessage="Nenhuma conta a pagar."
        toolbar={<PerPageSelect perPage={pagination.perPage} onChange={pagination.setPerPage} />}
        footer={
          <div className={shared.rodapeTabela}>
            <div className={shared.resumo}>
              <span className={shared.resumoItem}>A pagar <strong className={shared.neg}>{formatBRL(toPay)}</strong></span>
              <span className={shared.resumoItem}>Pago <strong className={shared.pos}>{formatBRL(paid)}</strong></span>
              <span className={`${shared.resumoItem} ${shared.resumoDireita}`}>Registros <strong>{list.length}</strong></span>
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

      {/* ── Modal: dar settlement ── */}
      {toSettle && (
        <SettleModal
          key={toSettle.id}
          title="Confirmar Pagamento"
          confirmLabel="Confirmar Pagamento"
          dataLabel="Data do pagamento"
          amountLabel="Valor pago"
          amountHint="Altere apenas se diferente do valor original."
          initialAmount={toSettle.amount}
          confirmando={settling}
          onClose={() => setToSettle(null)}
          onConfirm={settlement =>
            settle(
              { id: toSettle.id, settlement: settlement },
              { onSuccess: () => { toast.success('Pagamento confirmado!'); setToSettle(null) } },
            )
          }
        />
      )}

      {/* ── Cancelar despesa ── */}
      <ConfirmDialog
        open={toCancel !== null}
        onClose={() => setToCancel(null)}
        onConfirm={() => {
          if (toCancel) cancel(toCancel.id, { onSuccess: () => toast.success('Despesa cancelada.') })
        }}
        title="Cancelar Despesa"
        message={toCancel ? `Deseja cancelar "${toCancel.description}"?` : ''}
        variant="danger"
      />

      {/* ── Estornar baixa (recepção confirmou errado) ── */}
      <ConfirmDialog
        open={toReverse !== null}
        onClose={() => setToReverse(null)}
        onConfirm={() => {
          if (toReverse) {
            reverse(toReverse.id, { onSuccess: () => { toast.success('Baixa estornada.'); setToReverse(null) } })
          }
        }}
        title="Estornar Baixa"
        message={toReverse ? `"${toReverse.description}" volta para pendente. Confirma o estorno?` : ''}
        variant="danger"
      />
    </>
  )
}
