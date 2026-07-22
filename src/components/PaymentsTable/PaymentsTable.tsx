import { Fragment, useState } from 'react'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Pagination } from '@/components/Pagination/Pagination'
import { PaymentModal } from '@/components/PaymentModal/PaymentModal'
import { Select } from '@/components/Select/Select'
import { Spinner } from '@/components/Spinner/Spinner'
import { IconChevronRight, IconPrint, IconFinance } from '@/components/icons'
import { usePatientPayments, useReceivePayment } from '@/hooks/usePayments'
import { useToast } from '@/components/Toast/useToast'
import { usePrintDocument } from '@/hooks/usePrintDocument'
import { esc } from '@/utils/printDocument'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { PAYMENT_METHOD_LABEL } from '@/constants'
import type { PaymentEntry, Payment, PaymentStatus } from '@/types/domain'
import styles from './PaymentsTable.module.scss'

const FILTER_OPTIONS = [
  { value: 'all',    label: 'Todos os status' },
  { value: 'pending', label: 'Em aberto' },
  { value: 'overdue',  label: 'Atrasado' },
  { value: 'paid',     label: 'Pago' },
]

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Resumo das formas para a linha fechada: "Pix + Crédito". */
function summarizeMethods(entries: PaymentEntry[]) {
  if (entries.length === 0) return '—'
  return entries.map(f => PAYMENT_METHOD_LABEL[f.method]).join(' + ')
}

/** Pares label/valor exibidos no detalhe de uma forma (só os que existem). */
function entryDetails(f: PaymentEntry) {
  const pairs: { label: string; amount: string }[] = [{ label: 'Valor', amount: formatBRL(f.amount) }]
  if (f.date) pairs.push({ label: 'Recebido em', amount: f.date })
  if (f.installments) {
    pairs.push({
      label: 'Parcelas',
      amount: f.installments === 1 ? 'À vista' : `${f.installments}× de ${formatBRL(f.amount / f.installments)}`,
    })
  }
  if (f.cardBrand)    pairs.push({ label: 'Bandeira',    amount: f.cardBrand })
  if (f.authorizationCode) pairs.push({ label: 'Autorização', amount: f.authorizationCode })
  if (f.nsu)         pairs.push({ label: 'NSU',         amount: f.nsu })
  return pairs
}

/** Miolo do recibo — o cabeçalho da clínica e o rodapé vêm da base de impressão. */
function receiptBody(payment: Payment, patientName?: string) {
  const rows = payment.entries
    .map(f => `<tr><td>${esc(PAYMENT_METHOD_LABEL[f.method])}${f.installments && f.installments > 1 ? ` (${f.installments}×)` : ''}${f.cardBrand ? ` · ${esc(f.cardBrand)}` : ''}${f.authorizationCode ? ` · aut. ${esc(f.authorizationCode)}` : ''}</td><td class="valor">${formatBRL(f.amount)}</td></tr>`)
    .join('')

  return `
    ${patientName ? `<p><strong>Patient:</strong> ${esc(patientName)}</p>` : ''}
    <p><strong>Referente a:</strong> ${esc(payment.description)}<br><strong>Data:</strong> ${esc(payment.date)}</p>
    <table>
      ${rows}
      <tr class="total"><td>Total</td><td class="valor">${formatBRL(payment.amount)}</td></tr>
    </table>
    <p class="clausula">Recibo sem valor fiscal.</p>`
}

interface PaymentsTableProps {
  patientId: string
  /** Nome exibido no recibo impresso e no modal de pagamento. */
  patientName?: string
  /** CPF exibido no modal de pagamento. */
  patientCpf?: string
}

/** Tabela de pagamentos: filtro por status, paginação, detalhe expansível, receber e recibo. */
export function PaymentsTable({ patientId, patientName, patientCpf }: PaymentsTableProps) {
  const { data: payments, isLoading } = usePatientPayments(patientId)
  const { mutate: receive, isPending: receiving } = useReceivePayment()
  const toast = useToast()
  const printDocument = usePrintDocument()

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [toReceive, setToReceive] = useState<Payment | null>(null)
  const [filter, setFilter] = useState<'all' | PaymentStatus>('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(5)

  if (isLoading) {
    return <div className={styles.loading}><Spinner /></div>
  }

  const list = payments ?? []

  if (list.length === 0) {
    return (
      <EmptyState
        title="Nenhum pagamento registrado"
        description="Cobranças, recibos e histórico financeiro do paciente ficarão aqui."
      />
    )
  }

  const filtered = filter === 'all' ? list : list.filter(p => p.status === filter)
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  // O filtro pode encolher a lista: nunca fica numa página que não existe mais.
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  function toggle(id: string) {
    setExpanded(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className={styles.root}>
      <div className={styles.wrapper}>
        <div className={styles.toolbar}>
          <PerPageSelect perPage={perPage} onChange={n => { setPerPage(n); setPage(1) }} />
          <Select
            size="sm"
            options={FILTER_OPTIONS}
            value={filter}
            onChange={e => { setFilter(e.target.value as 'all' | PaymentStatus); setPage(1) }}
            aria-label="Filtrar pagamentos por status"
            className={styles.filtro}
          />
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thSeta} aria-label="Expandir" />
              <th>Data</th>
              <th>Descrição</th>
              <th>Payment</th>
              <th className={styles.thValor}>Valor</th>
              <th>Status</th>
              <th className={styles.thAcoes}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td className={styles.vazio} colSpan={7}>Nenhum pagamento com esse status.</td>
              </tr>
            )}
            {visible.map(payment => {
              const isOpen = expanded.has(payment.id)
              const isUnpaid = payment.status !== 'paid'
              return (
                <Fragment key={payment.id}>
                  <tr className={styles.linha} onClick={() => toggle(payment.id)}>
                    <td className={styles.tdSeta}>
                      <button
                        type="button"
                        className={`${styles.setaBtn} ${isOpen ? styles['setaBtn--aberta'] : ''}`}
                        onClick={e => { e.stopPropagation(); toggle(payment.id) }}
                        aria-expanded={isOpen}
                        aria-label={`${isOpen ? 'Recolher' : 'Ver'} detalhes do pagamento de ${payment.date}`}
                      >
                        <IconChevronRight />
                      </button>
                    </td>
                    <td>{payment.date}</td>
                    <td>{payment.description}</td>
                    <td className={styles.tdFormas}>{summarizeMethods(payment.entries)}</td>
                    <td className={styles.tdValor}>{formatBRL(payment.amount)}</td>
                    <td><Badge status={payment.status} /></td>
                    <td className={styles.tdAcoes}>
                      {isUnpaid ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          iconLeft={<IconFinance />}
                          title="Receber pagamento"
                          aria-label={`Receber pagamento de ${payment.date}`}
                          onClick={e => { e.stopPropagation(); setToReceive(payment) }}
                        />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          iconLeft={<IconPrint />}
                          title="Imprimir recibo"
                          aria-label={`Imprimir recibo de ${payment.date}`}
                          onClick={e => {
                            e.stopPropagation()
                            printDocument({
                              title: 'Recibo de pagamento',
                              subtitle: payment.description,
                              body: receiptBody(payment, patientName),
                              width: 520,
                            })
                          }}
                        />
                      )}
                    </td>
                  </tr>

                  {isOpen && (
                    <tr className={styles.detalheRow}>
                      <td colSpan={7}>
                        <div className={styles.detalhe}>
                          {payment.entries.length === 0 ? (
                            <p className={styles.semFormas}>
                              Nenhum recebimento registrado — pagamento {payment.status === 'overdue' ? 'overdue' : 'em aberto'}.
                            </p>
                          ) : (
                            payment.entries.map((f, index) => (
                              <div key={index} className={styles.forma}>
                                <span className={styles.formaTipo}>{PAYMENT_METHOD_LABEL[f.method]}</span>
                                <dl className={styles.formaDados}>
                                  {entryDetails(f).map(pair => (
                                    <div key={pair.label} className={styles.par}>
                                      <dt>{pair.label}</dt>
                                      <dd>{pair.amount}</dd>
                                    </div>
                                  ))}
                                </dl>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>

        <div className={styles.rodape}>
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onChange={setPage}
            totalItems={filtered.length}
            itemsPerPage={perPage}
          />
        </div>
      </div>

      <PaymentModal
        charge={toReceive && {
          id: toReceive.id,
          description: toReceive.description,
          amount: toReceive.amount,
          treatments: toReceive.treatments,
        }}
        patient={patientName ? { name: patientName, cpf: patientCpf } : undefined}
        confirmando={receiving}
        onConfirm={payload => {
          if (!toReceive) return
          receive({ id: toReceive.id, payload }, {
            onSuccess: () => { toast.success('Pagamento registrado!'); setToReceive(null) },
          })
        }}
        onClose={() => setToReceive(null)}
      />
    </div>
  )
}
