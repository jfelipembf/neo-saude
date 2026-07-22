import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { PAYMENT_METHOD_OPTIONS, isCardMethod } from '@/constants/payments'
import { useAcquirers } from '@/hooks/useFinance'
import { addMonths, isoToBrDate, localDate, toIsoDate } from '@/utils/date'
import { formatBRL, parseBRL } from '@/utils/format'
import { IconPlus, IconX } from '@/components/icons'
import type { PaymentMethod, PaymentPlanEntry } from '@/types/domain'
import styles from './ApproveQuoteDialog.module.scss'

/** Linha do plano em edição (textos crus dos campos; vira PaymentPlanEntry ao confirmar). */
interface PlanRowDraft {
  method: PaymentMethod
  amountText: string
  installments: string
  firstDue: string   // aaaa-mm-dd
  /** Só no cartão — ver `cardWithoutAcquirer`. */
  acquirerId?: string
}

interface ApproveQuoteDialogProps {
  open: boolean
  onClose: () => void
  /** Recebe o plano validado. O diálogo fica aberto até o pai fechar (no sucesso). */
  onConfirm: (plan: PaymentPlanEntry[]) => void
  quoteName: string
  total: number
  /** Parcelamento simulado no editor — pré-preenche a 1ª forma. */
  defaultInstallments?: number
  approving?: boolean
  /** Procedimentos avulsos AINDA EM ABERTO do paciente. Se o orçamento incluir
   *  algum deles, aprovar cobra em duplicidade — avisamos e deixamos decidir. */
  openProcedureCharges?: { description: string; amount: number; dueDate: string }[]
}

/** Valor em R$ no formato do campo (sem o prefixo "R$"). */
function toAmountText(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const INSTALLMENT_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: i === 0 ? 'À vista' : `${i + 1}x`,
}))

/**
 * Passo de CONDIÇÕES DE PAGAMENTO do aceite: o paciente pode combinar mais de
 * uma forma (entrada no cartão + resto parcelado no Pix, por exemplo); cada
 * linha define forma, valor, parcelas mensais e 1º vencimento. A soma das
 * linhas precisa fechar com o total do orçamento — é deste plano que nascem as
 * cobranças em Contas a Receber.
 */
export function ApproveQuoteDialog({ open, ...rest }: ApproveQuoteDialogProps) {
  if (!open) return null
  // A `key` remonta o formulário a cada abertura (e a cada mudança do total ou
  // do parcelamento simulado): o estado nasce pronto no initializer, sem efeito
  // de reset — que dispara render em cascata e é o que a regra
  // react-hooks/set-state-in-effect existe para evitar. Mesmo padrão do
  // PaymentModal, que remonta por `charge.id`.
  return <ApproveQuoteForm key={`${rest.total}·${rest.defaultInstallments ?? 1}`} {...rest} />
}

type ApproveQuoteFormProps = Omit<ApproveQuoteDialogProps, 'open'>

function ApproveQuoteForm({
  onClose, onConfirm, quoteName, total, defaultInstallments, approving, openProcedureCharges = [],
}: ApproveQuoteFormProps) {
  const chargesTotal = openProcedureCharges.reduce((sum, c) => sum + c.amount, 0)
  // Cada abertura começa do zero: uma linha com o total no Pix, parcelado como simulado.
  const [rows, setRows] = useState<PlanRowDraft[]>(() => [{
    method: 'pix',
    amountText: toAmountText(total),
    installments: String(Math.min(12, Math.max(1, defaultInstallments ?? 1))),
    firstDue: toIsoDate(new Date()),
  }])

  const { data: acquirers } = useAcquirers()
  const activeAcquirers = (acquirers ?? []).filter(a => a.status === 'active')

  const totalCents = Math.round(total * 100)
  const parsed = rows.map(r => {
    const amount = parseBRL(r.amountText || '')
    const cents = Number.isFinite(amount) ? Math.round(amount * 100) : 0
    return { ...r, cents, count: Math.max(1, Number(r.installments) || 1) }
  })
  const sumCents = parsed.reduce((sum, r) => sum + r.cents, 0)
  const diffCents = totalCents - sumCents
  const rowsValid = parsed.every(r => r.cents > 0 && r.firstDue)

  // Mesma trava que o lançamento do procedimento já fazia (TreatmentsPanel):
  // no cartão, quem deve as parcelas é a ADQUIRENTE. Sem ela o título nasceria
  // como dívida do paciente, viraria 'overdue' e o cobraria na Inadimplência
  // por uma venda que a maquininha já garantiu. Aqui o estrago seria maior — é
  // no contrato que estão os valores altos.
  const cardWithoutAcquirer = parsed.some(r => isCardMethod(r.method) && !r.acquirerId)
  const canConfirm = rowsValid && diffCents === 0 && !cardWithoutAcquirer && !approving

  // Prévia das cobranças: quantas nascem e o intervalo de vencimentos. As datas
  // mensais só valem para as formas do PACIENTE; no cartão quem paga é a
  // adquirente, na data de repasse (D+N) calculada no servidor — por isso o
  // intervalo mensal só aparece quando NÃO há cartão no plano.
  const hasCard = parsed.some(r => isCardMethod(r.method))
  const installmentTotal = parsed.reduce((sum, r) => sum + r.count, 0)
  const dueDates = parsed.filter(r => r.firstDue && !isCardMethod(r.method)).flatMap(r =>
    Array.from({ length: r.count }, (_, k) => toIsoDate(addMonths(localDate(r.firstDue), k))))
  dueDates.sort()
  const firstDueBr = isoToBrDate(dueDates[0])
  const lastDueBr = isoToBrDate(dueDates[dueDates.length - 1])

  function patchRow(index: number, patch: Partial<PlanRowDraft>) {
    setRows(current => current.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  /** Trocar a forma acerta a adquirente: obrigatória no cartão, inexistente fora dele. */
  function changeMethod(index: number, method: PaymentMethod) {
    patchRow(index, {
      method,
      acquirerId: isCardMethod(method)
        ? rows[index].acquirerId ?? activeAcquirers[0]?.id
        : undefined,
    })
  }

  // A linha nova já nasce com o que falta para fechar o total. Nasce no Pix, e
  // não no crédito: um padrão que exige adquirente travaria o botão Aprovar
  // sozinho, e o dono não tem nenhuma cadastrada ainda.
  function addRow() {
    setRows(current => [...current, {
      method: 'pix',
      amountText: diffCents > 0 ? toAmountText(diffCents / 100) : '',
      installments: '1',
      firstDue: toIsoDate(new Date()),
    }])
  }

  function confirm() {
    onConfirm(parsed.map(r => ({
      method: r.method,
      amount: r.cents / 100,
      installments: r.count,
      firstDueDate: r.firstDue,
      acquirerId: isCardMethod(r.method) ? r.acquirerId : undefined,
    })))
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Aprovar orçamento"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={approving}>Cancelar</Button>
          <Button onClick={confirm} loading={approving} disabled={!canConfirm}>Aprovar</Button>
        </>
      }
    >
      <div className={styles.corpo}>
        <p className={styles.intro}>
          Defina como <strong>{quoteName}</strong> será pago. O paciente pode combinar mais de
          uma forma — cada linha gera suas parcelas em Contas a Receber.
        </p>

        {/* Aviso de dupla cobrança: procedimento avulso já cobrado que pode
            estar dentro deste orçamento. Não bloqueia — quem decide é a clínica. */}
        {openProcedureCharges.length > 0 && (
          <div className={styles.avisoDupla} role="alert">
            <strong>Atenção — risco de cobrança em duplicidade</strong>
            <p>
              Este paciente já tem {openProcedureCharges.length === 1
                ? '1 procedimento avulso em aberto'
                : `${openProcedureCharges.length} procedimentos avulsos em aberto`} ({formatBRL(chargesTotal)}).
              Se este orçamento inclui algum deles, aprovar vai cobrar duas vezes.
            </p>
            <ul className={styles.avisoLista}>
              {openProcedureCharges.map((c, i) => (
                <li key={i}>
                  {c.description} — {formatBRL(c.amount)}{c.dueDate ? ` · venc. ${c.dueDate}` : ''}
                </li>
              ))}
            </ul>
            <p>Confira antes de aprovar. Se for outro tratamento, pode seguir normalmente.</p>
          </div>
        )}

        <div className={styles.linhas}>
          {rows.map((row, i) => (
            <div key={i} className={styles.grupoLinha}>
            <div className={styles.linha}>
              <Select
                label="Forma"
                options={PAYMENT_METHOD_OPTIONS}
                value={row.method}
                onChange={e => changeMethod(i, e.target.value as PaymentMethod)}
              />
              <Input
                label="Valor"
                iconLeft={<span className={styles.prefixo}>R$</span>}
                inputMode="decimal"
                placeholder="0,00"
                value={row.amountText}
                onChange={e => patchRow(i, { amountText: e.target.value })}
              />
              <Select
                label="Parcelas"
                options={INSTALLMENT_OPTIONS}
                value={row.installments}
                onChange={e => patchRow(i, { installments: e.target.value })}
              />
              <Input
                label="1º vencimento"
                type="date"
                value={row.firstDue}
                onChange={e => patchRow(i, { firstDue: e.target.value })}
              />
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<IconX />}
                title="Remover forma"
                aria-label={`Remover forma de pagamento ${i + 1}`}
                disabled={rows.length === 1}
                onClick={() => setRows(current => current.filter((_, j) => j !== i))}
                className={styles.remover}
              />
            </div>

            {/* No cartão a dívida é da adquirente, não do paciente — e é ela
                que define taxa, data de repasse e a saída da Inadimplência. */}
            {isCardMethod(row.method) && (
              activeAcquirers.length === 0 ? (
                <p className={styles.aviso}>
                  Nenhuma adquirente ativa cadastrada. Sem ela, esta parcela nasceria como dívida
                  DO PACIENTE e ele seria cobrado na Inadimplência por uma venda que a maquininha
                  já garantiu. Cadastre em Financeiro → Adquirentes, ou escolha outra forma.
                </p>
              ) : (
                <Select
                  label="Adquirente"
                  options={activeAcquirers.map(a => ({ value: a.id, label: a.name }))}
                  value={row.acquirerId ?? ''}
                  onChange={e => patchRow(i, { acquirerId: e.target.value })}
                  className={styles.adquirente}
                />
              )
            )}
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" iconLeft={<IconPlus />} onClick={addRow} className={styles.adicionar}>
          Adicionar forma
        </Button>

        <div className={styles.resumo}>
          <span className={styles.resumoTotal}>Total do orçamento: {formatBRL(total)}</span>
          {rowsValid && diffCents !== 0 && (
            <span className={styles.erro}>
              {diffCents > 0
                ? `Faltam ${formatBRL(diffCents / 100)} para fechar o total.`
                : `As formas excedem o total em ${formatBRL(-diffCents / 100)}.`}
            </span>
          )}
          {/* Botão desabilitado sem motivo escrito é o usuário clicando à toa. */}
          {rowsValid && diffCents === 0 && cardWithoutAcquirer && (
            <span className={styles.erro}>
              Escolha a adquirente da linha no cartão para aprovar.
            </span>
          )}
          {canConfirm && (
            <span className={styles.previa}>
              {installmentTotal === 1
                ? 'Será gerada 1 cobrança em Contas a Receber'
                : `Serão geradas ${installmentTotal} cobranças em Contas a Receber`}
              {firstDueBr && (lastDueBr && lastDueBr !== firstDueBr
                ? ` — vencimentos de ${firstDueBr} a ${lastDueBr}`
                : ` — vencimento em ${firstDueBr}`)}
              {hasCard && ' · as parcelas no cartão caem na data de repasse da adquirente, já com a taxa'}.
            </span>
          )}
        </div>
      </div>
    </Modal>
  )
}
