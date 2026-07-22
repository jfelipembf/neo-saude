import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { Textarea } from '@/components/Textarea/Textarea'
import { useBankAccounts } from '@/hooks/useFinance'
import { PAYMENT_METHOD_OPTIONS } from '@/constants'
import { parseBRL } from '@/utils/format'
import { toIsoDate } from '@/utils/date'
import type { SettlementInput } from '@/services/financeService'
import type { PaymentMethod } from '@/types/domain'
import styles from './finance.module.scss'

interface SettleModalProps {
  title: string
  confirmLabel: string
  dataLabel: string
  amountLabel: string
  amountHint?: string
  initialAmount: number
  /** Trava o campo de valor (baixa em lote: cada conta quita o PRÓPRIO
   *  líquido — o total exibido é só referência, não dá para editar). */
  amountReadOnly?: boolean
  confirmando: boolean
  onClose: () => void
  onConfirm: (settlement: SettlementInput) => void
}

/** Modal de baixa (Confirmar Pagamento / Recebimento) — usado pelas abas
 *  Contas a Pagar e Contas a Receber: data, forma, conta, valor e observação. */
export function SettleModal({
  title, confirmLabel, dataLabel: dateLabel, amountLabel, amountHint,
  initialAmount, amountReadOnly, confirmando: confirming, onClose, onConfirm,
}: SettleModalProps) {
  const { data: accounts } = useBankAccounts()

  const [dateIso, setDateIso] = useState(() => toIsoDate(new Date()))
  const [method, setMethod] = useState('')
  const [accountId, setAccountId] = useState('')
  const [amountText, setAmountText] = useState(() =>
    initialAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
  )
  const [notes, setNotes] = useState('')
  const [amountError, setAmountError] = useState('')

  const accountOptions = (accounts ?? []).map(c => ({ value: c.id, label: c.name }))

  function handleConfirm() {
    const amount = parseBRL(amountText)
    if (!Number.isFinite(amount) || amount <= 0) {
      setAmountError('Informe um valor válido.')
      return
    }
    onConfirm({
      date: dateIso.split('-').reverse().join('/'),
      method: (method || undefined) as PaymentMethod | undefined,
      bankAccountId: accountId || undefined,
      amount,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={confirming}>Cancelar</Button>
          <Button loading={confirming} onClick={handleConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <div className={styles.fields}>
        <Input label={dateLabel} type="date" value={dateIso} onChange={e => setDateIso(e.target.value)} />
        <Select
          label="Forma de pagamento"
          placeholder="Selecione..."
          options={PAYMENT_METHOD_OPTIONS}
          value={method}
          onChange={e => setMethod(e.target.value)}
        />
        <Select
          label="Conta bancária"
          placeholder="Selecione a conta..."
          options={accountOptions}
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
        />
        <Input
          label={amountLabel}
          iconLeft={<span className={styles.prefixo}>R$</span>}
          inputMode="decimal"
          value={amountText}
          onChange={e => { setAmountText(e.target.value); setAmountError('') }}
          error={amountError}
          hint={amountHint}
          readOnly={amountReadOnly}
        />
        <div className={styles.fieldFull}>
          <Textarea
            label="Observação"
            rows={2}
            placeholder="Nota interna sobre esta baixa (opcional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}
