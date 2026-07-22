import { useState } from 'react'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import type { SegmentOption } from '@/components/SegmentedControl/SegmentedControl'
import { UnbilledTab } from '../Unbilled/UnbilledTab'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { useToast } from '@/components/Toast/useToast'
import { IconCheck, IconUndo, IconX } from '@/components/icons'
import {
  useReceivables, useSettleReceivable, useCancelReceivable, useReverseReceivable,
  useSettleReceivablesBatch, useBankAccounts, useUnbilledSessions,
} from '@/hooks/useFinance'
import { usePagination } from '@/hooks/usePagination'
import { usePatientName } from '@/hooks/useDisplayNames'
import { PAYMENT_METHOD_LABEL } from '@/constants'
import { formatBRL } from '@/utils/format'
import type { Receivable } from '@/types/domain'
import { PaymentModal } from '@/components/PaymentModal/PaymentModal'
import { SettleModal } from '../shared/SettleModal'
import shared from '../shared/finance.module.scss'

/** Restante a receber = líquido − o que já entrou (baixas parciais). */
function remainingOf(c: Receivable) {
  return c.grossAmount - c.fee - (c.receivedAmount ?? 0)
}

/** Aba "Contas a Receber": listagem, settlement (inclusive parcial), baixa em
 *  lote, estorno e cancelamento. Inclui a visão "A faturar" (produção executada
 *  sem cobrança) — tudo que é dinheiro a entrar mora numa aba só. */
export function ReceivableTab() {
  const toast = useToast()
  // Visão da aba: títulos emitidos ou produção a faturar (rede de segurança).
  const [view, setView] = useState<'titulos' | 'unbilled'>('titulos')
  const { data: unbilled } = useUnbilledSessions()
  const viewOptions: SegmentOption<'titulos' | 'unbilled'>[] = [
    { value: 'titulos', label: 'Títulos' },
    { value: 'unbilled', label: `A faturar${unbilled?.length ? ` (${unbilled.length})` : ''}` },
  ]
  const { data: receivables, isLoading } = useReceivables()
  const { mutate: settle, isPending: settling } = useSettleReceivable()
  const { mutate: cancel } = useCancelReceivable()
  const { mutate: reverse } = useReverseReceivable()
  const { mutate: settleBatch, isPending: settlingBatch } = useSettleReceivablesBatch()
  // Contas BANCÁRIAS (onde o dinheiro entra) — não confundir com as a receber.
  const { data: bankAccounts } = useBankAccounts()
  const accountOptions = (bankAccounts ?? []).map(c => ({ value: c.id, label: c.name }))
  // Devedor do título: o domínio guarda só o id, o nome é resolvido na hora de
  // mostrar (ver hooks/useDisplayNames).
  const patientName = usePatientName()

  const list = receivables ?? []
  const pagination = usePagination(list)

  const [toSettle, setToSettle] = useState<Receivable | null>(null)
  const [toCancel, setToCancel] = useState<Receivable | null>(null)
  const [toReverse, setToReverse] = useState<Receivable | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [batchOpen, setBatchOpen] = useState(false)

  if (isLoading) return <PageLoader />

  const isOpen = (c: Receivable) => c.status === 'pending' || c.status === 'overdue'
  const toReceive = list.filter(isOpen).reduce((s, c) => s + remainingOf(c), 0)
  const received = list.reduce((s, c) => s + (c.receivedAmount ?? (c.status === 'paid' ? c.grossAmount - c.fee : 0)), 0)

  const openInPage = pagination.visible.filter(isOpen)
  const allSelected = openInPage.length > 0 && openInPage.every(c => selected.has(c.id))
  const selectedList = list.filter(c => selected.has(c.id))
  const selectedTotal = selectedList.reduce((s, c) => s + Math.max(remainingOf(c), 0), 0)

  function toggleOne(id: string) {
    setSelected(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllInPage() {
    setSelected(current => {
      const next = new Set(current)
      if (allSelected) openInPage.forEach(c => next.delete(c.id))
      else openInPage.forEach(c => next.add(c.id))
      return next
    })
  }

  const columns: TableColumn<Receivable>[] = [
    {
      key: 'select', label: '',
      render: c => isOpen(c) && (
        <input
          type="checkbox"
          className={shared.checkbox}
          checked={selected.has(c.id)}
          onChange={() => toggleOne(c.id)}
          aria-label={`Selecionar ${c.description}`}
        />
      ),
    },
    { key: 'description', label: 'Descrição', render: c => <span className={shared.celulaForte}>{c.description}</span> },
    {
      key: 'patient', label: 'Paciente',
      // Sem paciente é caso legítimo (aluguel de sala, repasse de convênio) —
      // por isso traço, e não vazio.
      render: c => c.patientId
        ? patientName(c.patientId)
        : <span className={shared.traco}>—</span>,
    },
    { key: 'dueDate',  label: 'Vencimento' },
    { key: 'receivedAt', label: 'Recebimento', render: c => c.receivedAt ?? '—' },
    { key: 'method',      label: 'Forma', render: c => c.method ? PAYMENT_METHOD_LABEL[c.method] : '—' },
    { key: 'source',      label: 'Origem' },
    { key: 'grossAmount', label: 'Bruto', render: c => <span className={shared.valor}>{formatBRL(c.grossAmount)}</span> },
    { key: 'fee',        label: 'Taxa', render: c => c.fee > 0 ? <span className={shared.neg}>{formatBRL(c.fee)}</span> : <span className={shared.traco}>—</span> },
    {
      key: 'net', label: 'Líquido',
      // A coluna mostra o RESTANTE a receber (líquido − parciais).
      render: c => <span className={`${shared.valor} ${shared.pos}`}>{formatBRL(Math.max(remainingOf(c), 0))}</span>,
    },
    { key: 'status',      label: 'Status', render: c => <Badge status={c.status} /> },
    {
      key: 'actions', label: 'Ação',
      render: c => (
        <span className={shared.acoes}>
          {isOpen(c) && (
            <>
              <button
                type="button"
                className={`${shared.acaoBtn} ${shared['acaoBtn--confirmar']}`}
                title="Dar baixa"
                aria-label={`Dar baixa em ${c.description}`}
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
              title="Estornar recebimento"
              aria-label={`Estornar recebimento de ${c.description}`}
              onClick={() => setToReverse(c)}
            >
              <IconUndo />
            </button>
          )}
        </span>
      ),
    },
  ]

  const switcher = (
    <div className={shared.subVisao}>
      <SegmentedControl options={viewOptions} value={view} onChange={setView} />
    </div>
  )

  // Visão "A faturar": procedimentos executados sem cobrança, com o botão que
  // gera o título — o outro caminho legítimo de nascimento de um recebível
  // (o primeiro é o aceite do orçamento).
  if (view === 'unbilled') {
    return (
      <>
        {switcher}
        <UnbilledTab />
      </>
    )
  }

  return (
    <>
      {switcher}
      <Table
        columns={columns}
        data={pagination.visible}
        rowKey={c => c.id}
        emptyMessage="Nenhuma conta a receber."
        toolbar={
          <>
            <label className={shared.barraLote}>
              <input
                type="checkbox"
                className={shared.checkbox}
                checked={allSelected}
                onChange={toggleAllInPage}
                disabled={openInPage.length === 0}
                aria-label="Selecionar todas as contas em aberto desta página"
              />
              {selected.size > 0 ? (
                <span className={shared.barraLoteTexto}>
                  <strong>{selected.size}</strong> selecionada{selected.size > 1 ? 's' : ''} · {formatBRL(selectedTotal)}
                </span>
              ) : (
                <span className={shared.barraLoteTexto}>Selecionar em aberto</span>
              )}
            </label>
            <div className={shared.barraDireita}>
              {selected.size > 0 && (
                <Button size="sm" iconLeft={<IconCheck />} onClick={() => setBatchOpen(true)}>
                  Dar baixa em lote
                </Button>
              )}
              {/* SEM "Nova conta a receber": título de paciente NASCE no aceite do
                  orçamento (parcelas) ou no faturamento do procedimento — nunca
                  digitado aqui, senão vira recebível sem contrato por trás. */}
              <PerPageSelect perPage={pagination.perPage} onChange={pagination.setPerPage} />
            </div>
          </>
        }
        footer={
          <div className={shared.rodapeTabela}>
            <div className={shared.resumo}>
              <span className={shared.resumoItem}>A receber <strong className={shared.pos}>{formatBRL(toReceive)}</strong></span>
              <span className={shared.resumoItem}>Recebido <strong>{formatBRL(received)}</strong></span>
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

      {/* ── Modal de pagamento (o mesmo do perfil do paciente) ──
          Recebimento parcial mantém a conta em aberto com o restante. */}
      <PaymentModal
        charge={toSettle && {
          id: toSettle.id,
          description: toSettle.description,
          amount: Math.max(remainingOf(toSettle), 0),
        }}
        contas={accountOptions}
        confirmando={settling}
        onConfirm={payload => {
          if (!toSettle) return
          settle(
            {
              id: toSettle.id,
              // O modal fala em "tipo"; a settlement do financeiro chama de "forma".
              settlement: { ...payload, method: payload.method },
            },
            { onSuccess: () => { toast.success('Recebimento registrado!'); setToSettle(null) } },
          )
        }}
        onClose={() => setToSettle(null)}
      />

      {/* ── Cancelar recebimento ── */}
      <ConfirmDialog
        open={toCancel !== null}
        onClose={() => setToCancel(null)}
        onConfirm={() => {
          if (toCancel) cancel(toCancel.id, { onSuccess: () => toast.success('Recebimento cancelado.') })
        }}
        title="Cancelar Recebimento"
        message={toCancel ? `Deseja cancelar "${toCancel.description}"?` : ''}
        variant="danger"
      />

      {/* ── Estornar recebimento (recepção deu baixa errada) ── */}
      <ConfirmDialog
        open={toReverse !== null}
        onClose={() => setToReverse(null)}
        onConfirm={() => {
          if (toReverse) {
            reverse(toReverse.id, { onSuccess: () => { toast.success('Recebimento estornado.'); setToReverse(null) } })
          }
        }}
        title="Estornar Recebimento"
        message={toReverse ? `"${toReverse.description}" volta para aberto. Confirma o estorno?` : ''}
        variant="danger"
      />

      {/* ── Baixa em lote: uma data/forma/conta para todas as selecionadas ──
          Sempre baixa o valor CHEIO — quem precisa de parcial usa a linha. */}
      {batchOpen && (
        <SettleModal
          title="Dar Baixa em Lote"
          confirmLabel={`Confirmar ${selected.size} recebimento${selected.size > 1 ? 's' : ''}`}
          dataLabel="Data do recebimento"
          amountLabel="Total selecionado"
          amountHint="Cada conta quita pelo próprio valor líquido — este total é só referência."
          initialAmount={selectedTotal}
          amountReadOnly
          confirmando={settlingBatch}
          onClose={() => setBatchOpen(false)}
          onConfirm={settlement =>
            settleBatch(
              {
                ids: [...selected],
                settlement: {
                  date: settlement.date,
                  method: settlement.method,
                  bankAccountId: settlement.bankAccountId,
                  notes: settlement.notes,
                },
              },
              {
                onSuccess: count => {
                  toast.success(`${count} recebimento${count > 1 ? 's' : ''} confirmado${count > 1 ? 's' : ''}!`)
                  setSelected(new Set())
                  setBatchOpen(false)
                },
              },
            )
          }
        />
      )}
    </>
  )
}
