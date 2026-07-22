import { Fragment, useState } from 'react'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Pagination } from '@/components/Pagination/Pagination'
import { PaymentModal } from '@/components/PaymentModal/PaymentModal'
import { Select } from '@/components/Select/Select'
import { Spinner } from '@/components/Spinner/Spinner'
import { IconChevronRight, IconPrint, IconFinance, IconLock } from '@/components/icons'
import { useSession } from '@/context/SessionProvider'
import { usePatientReceivables, useSettleReceivable, useBankAccounts } from '@/hooks/useFinance'
import { useToast } from '@/components/Toast/useToast'
import { usePrintDocument } from '@/hooks/usePrintDocument'
import { esc } from '@/utils/printDocument'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { PAYMENT_METHOD_LABEL } from '@/constants'
import { formatBRL } from '@/utils/format'
import type { Receivable, PaymentStatus } from '@/types/domain'
import styles from './PaymentsTable.module.scss'

const FILTER_OPTIONS = [
  { value: 'all',    label: 'Todos os status' },
  { value: 'pending', label: 'Em aberto' },
  { value: 'overdue',  label: 'Atrasado' },
  { value: 'paid',     label: 'Pago' },
]

/** Restante a receber = líquido − o que já entrou (aceita baixa parcial). */
function remainingOf(r: Receivable) {
  return Math.max(r.grossAmount - r.fee - (r.receivedAmount ?? 0), 0)
}

/** Rótulo da linha: "3/6" quando é parcela, a origem quando é título único. */
function installmentLabel(r: Receivable) {
  return r.installmentNumber && r.installmentCount
    ? `${r.installmentNumber}/${r.installmentCount}`
    : '—'
}

/** Pares label/valor do detalhe expandido — só os que existem. */
function details(r: Receivable) {
  const pairs: { label: string; amount: string }[] = [
    { label: 'Bruto', amount: formatBRL(r.grossAmount) },
  ]
  if (r.fee > 0) pairs.push({ label: 'Taxa', amount: formatBRL(r.fee) })
  pairs.push({ label: 'Líquido', amount: formatBRL(r.grossAmount - r.fee) })
  if (r.receivedAmount) pairs.push({ label: 'Já recebido', amount: formatBRL(r.receivedAmount) })
  if (r.receivedAt) pairs.push({ label: 'Recebido em', amount: r.receivedAt })
  if (r.method) pairs.push({ label: 'Forma', amount: PAYMENT_METHOD_LABEL[r.method] })
  if (r.installmentCount) pairs.push({ label: 'Parcela', amount: installmentLabel(r) })
  return pairs
}

/** Miolo do recibo — cabeçalho da clínica e rodapé vêm da base de impressão. */
function receiptBody(r: Receivable, patientName?: string) {
  return `
    ${patientName ? `<p><strong>Paciente:</strong> ${esc(patientName)}</p>` : ''}
    <p><strong>Referente a:</strong> ${esc(r.description)}<br>
       <strong>Origem:</strong> ${esc(r.source)}<br>
       <strong>Recebido em:</strong> ${esc(r.receivedAt ?? r.dueDate)}</p>
    <table>
      <tr><td>${esc(r.method ? PAYMENT_METHOD_LABEL[r.method] : 'Recebimento')}</td><td class="valor">${formatBRL(r.receivedAmount ?? r.grossAmount - r.fee)}</td></tr>
      <tr class="total"><td>Total</td><td class="valor">${formatBRL(r.receivedAmount ?? r.grossAmount - r.fee)}</td></tr>
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

/**
 * Aba "Pagamentos" do perfil do paciente: o EXTRATO FINANCEIRO dele.
 *
 * Lê `receivable` — o razão vigente —, e não `public.payment`, que está
 * congelada com zero linhas e nenhum escritor em todo o src/. Enquanto lia de
 * lá, esta aba vinha vazia para todo mundo, inclusive para o paciente com
 * parcela de contrato aprovado vencendo: o histórico existia no banco e a tela
 * do paciente jurava que não havia nada.
 */
export function PaymentsTable({ patientId, patientName, patientCpf }: PaymentsTableProps) {
  const { canView, canEdit } = useSession()
  const { data: receivables, isLoading } = usePatientReceivables(patientId)
  const { mutate: settle, isPending: settling } = useSettleReceivable()
  const { data: bankAccounts } = useBankAccounts()
  const toast = useToast()
  const printDocument = usePrintDocument()

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [toSettle, setToSettle] = useState<Receivable | null>(null)
  const [filter, setFilter] = useState<'all' | PaymentStatus>('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(5)

  // O extrato é do módulo Financeiro. Sem a permissão, a RLS devolveria lista
  // VAZIA — indistinguível de "não há nada". Dizer o motivo é o mínimo.
  if (!canView('finance')) {
    return (
      <EmptyState
        icon={<IconLock />}
        title="Extrato financeiro restrito"
        description="Ver cobranças e recebimentos deste paciente depende da permissão de Financeiro."
      />
    )
  }

  if (isLoading) {
    return <div className={styles.loading}><Spinner /></div>
  }

  const list = receivables ?? []

  if (list.length === 0) {
    return (
      <EmptyState
        title="Nenhuma cobrança registrada"
        description="Procedimentos com valor e parcelas de orçamento aprovado aparecem aqui automaticamente."
      />
    )
  }

  const filtered = filter === 'all' ? list : list.filter(r => r.status === filter)
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  // O filtro pode encolher a lista: nunca fica numa página que não existe mais.
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  // 🚨 `debtor === 'payer'` NÃO é detalhe de exibição: este é o número que a
  // recepção lê em voz alta quando o paciente pergunta "quanto eu devo?".
  // Parcela de cartão é dívida da ADQUIRENTE — a venda já foi garantida pela
  // maquininha, e a baixa acontece sozinha na data do repasse. Somá-la aqui
  // fazia o paciente que pagou R$ 1.000 em 3x aparecer devendo R$ 945 no
  // balcão, exatamente a cobrança indevida que o resto do módulo evita.
  const open = list.filter(r => (r.status === 'pending' || r.status === 'overdue') && r.debtor === 'payer')
  const totalOpen = open.reduce((sum, r) => sum + remainingOf(r), 0)
  // Repasses ainda por cair: dinheiro da clínica, não dívida do paciente — por
  // isso aparece separado, e não somado ao que ele deve.
  const pendingTransfers = list.filter(
    r => (r.status === 'pending' || r.status === 'overdue') && r.debtor === 'acquirer',
  )
  const totalTransfers = pendingTransfers.reduce((sum, r) => sum + remainingOf(r), 0)

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
      {/* O número que o paciente pergunta no balcão: quanto ele deve HOJE.
          Só conta título de 'payer' — parcela de cartão é dívida da adquirente. */}
      <p className={styles.saldo}>
        Em aberto <strong className={totalOpen > 0 ? styles.saldoDevendo : undefined}>{formatBRL(totalOpen)}</strong>
        <span className={styles.saldoMeta}>
          {open.length} {open.length === 1 ? 'cobrança' : 'cobranças'} de {list.length} no histórico
          {totalTransfers > 0 && ` · ${formatBRL(totalTransfers)} em repasse de cartão (não é dívida dele)`}
        </span>
      </p>

      <div className={styles.wrapper}>
        <div className={styles.toolbar}>
          <PerPageSelect perPage={perPage} onChange={n => { setPerPage(n); setPage(1) }} />
          <Select
            size="sm"
            options={FILTER_OPTIONS}
            value={filter}
            onChange={e => { setFilter(e.target.value as 'all' | PaymentStatus); setPage(1) }}
            aria-label="Filtrar cobranças por status"
            className={styles.filtro}
          />
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thSeta} aria-label="Expandir" />
              <th>Vencimento</th>
              <th>Descrição</th>
              <th>Origem</th>
              <th className={styles.thValor}>Em aberto</th>
              <th>Status</th>
              <th className={styles.thAcoes}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td className={styles.vazio} colSpan={7}>Nenhuma cobrança com esse status.</td>
              </tr>
            )}
            {visible.map(charge => {
              const isOpen = expanded.has(charge.id)
              const unpaid = charge.status === 'pending' || charge.status === 'overdue'
              // Cartão: quem deve é a adquirente e a baixa acontece sozinha na
              // data do repasse. Oferecer "receber" aqui convidaria a recepção a
              // cobrar o paciente por uma venda que a maquininha já garantiu.
              const byAcquirer = charge.debtor === 'acquirer'
              return (
                <Fragment key={charge.id}>
                  <tr className={styles.linha} onClick={() => toggle(charge.id)}>
                    <td className={styles.tdSeta}>
                      <button
                        type="button"
                        className={`${styles.setaBtn} ${isOpen ? styles['setaBtn--aberta'] : ''}`}
                        onClick={e => { e.stopPropagation(); toggle(charge.id) }}
                        aria-expanded={isOpen}
                        aria-label={`${isOpen ? 'Recolher' : 'Ver'} detalhes de ${charge.description}`}
                      >
                        <IconChevronRight />
                      </button>
                    </td>
                    <td>{charge.dueDate}</td>
                    <td>{charge.description}</td>
                    <td className={styles.tdFormas}>{charge.source}</td>
                    <td className={styles.tdValor}>{formatBRL(remainingOf(charge))}</td>
                    <td><Badge status={charge.status} /></td>
                    <td className={styles.tdAcoes}>
                      {unpaid && !byAcquirer && canEdit('finance') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          iconLeft={<IconFinance />}
                          title="Receber pagamento"
                          aria-label={`Receber pagamento de ${charge.description}`}
                          onClick={e => { e.stopPropagation(); setToSettle(charge) }}
                        />
                      )}
                      {unpaid && byAcquirer && (
                        <span className={styles.aguardando}>Repasse em {charge.dueDate}</span>
                      )}
                      {charge.status === 'paid' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          iconLeft={<IconPrint />}
                          title="Imprimir recibo"
                          aria-label={`Imprimir recibo de ${charge.description}`}
                          onClick={e => {
                            e.stopPropagation()
                            printDocument({
                              title: 'Recibo de pagamento',
                              subtitle: charge.description,
                              body: receiptBody(charge, patientName),
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
                          <div className={styles.forma}>
                            <span className={styles.formaTipo}>
                              {byAcquirer ? 'Cartão — dívida da adquirente' : 'Cobrança'}
                            </span>
                            <dl className={styles.formaDados}>
                              {details(charge).map(pair => (
                                <div key={pair.label} className={styles.par}>
                                  <dt>{pair.label}</dt>
                                  <dd>{pair.amount}</dd>
                                </div>
                              ))}
                            </dl>
                            {byAcquirer && (
                              <p className={styles.semFormas}>
                                A venda já foi garantida pela maquininha: a baixa acontece sozinha na
                                data prevista de repasse e o paciente não tem o que ser cobrado.
                              </p>
                            )}
                            {charge.notes && <p className={styles.semFormas}>{charge.notes}</p>}
                          </div>
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

      {/* Mesma baixa da aba Contas a Receber — inclusive parcial, que mantém a
          cobrança em aberto pelo restante. */}
      <PaymentModal
        charge={toSettle && {
          id: toSettle.id,
          description: toSettle.description,
          amount: remainingOf(toSettle),
        }}
        patient={patientName ? { name: patientName, cpf: patientCpf } : undefined}
        contas={(bankAccounts ?? []).map(a => ({ value: a.id, label: a.name }))}
        confirmando={settling}
        onConfirm={payload => {
          if (!toSettle) return
          settle(
            { id: toSettle.id, settlement: { ...payload, method: payload.method } },
            { onSuccess: () => { toast.success('Recebimento registrado!'); setToSettle(null) } },
          )
        }}
        onClose={() => setToSettle(null)}
      />
    </div>
  )
}
