import { useState, useMemo, useEffect } from 'react'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Select } from '@/components/Select/Select'
import { Input } from '@/components/Input/Input'
import { Button } from '@/components/Button/Button'
import { IconPlus } from '@/components/icons'
import { PAY_METHOD_OPTIONS } from './types'
import type { PayMethod, Payment } from './types'
import styles from './SalesPointPage.module.scss'

let seq = 0

interface Props {
  balance: number
  /** Limite de parcelas do item vendido (contrato). Sem contrato → 12. */
  maxInstallments?: number
  onAdd: (p: Payment) => void
}

/** Formulário de pagamento (uma forma por vez) — UI mock, sem taxas/adquirente. */
export function PaymentForm({ balance, maxInstallments, onAdd }: Props) {
  const [method, setMethod] = useState<PayMethod>('cash')
  const [installments, setInst] = useState('1')
  const [amount, setAmount] = useState(balance)

  const maxInst = Math.max(1, Math.min(12, maxInstallments || 12))
  const installmentOptions = useMemo(
    () => Array.from({ length: maxInst }, (_, i) => ({ value: String(i + 1), label: `${i + 1}x` })),
    [maxInst],
  )

  // Sugere o saldo devedor como valor do próximo pagamento.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setAmount(balance) }, [balance])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (Number(installments) > maxInst) setInst('1') }, [maxInst, installments])

  function add() {
    if (amount <= 0) return
    onAdd({
      uid: `pay-${seq++}`,
      method,
      amount,
      installments: method === 'credit' ? Number(installments) : 1,
    })
    setAmount(0)
  }

  return (
    <div className={styles.payForm}>
      <span className={styles.blockTitle}>Pagamento</span>

      <SegmentedControl options={PAY_METHOD_OPTIONS} value={method} onChange={setMethod} />

      <div className={styles.payGrid}>
        {method === 'credit' && (
          <Select label="Parcelas" options={installmentOptions} value={installments} onChange={e => setInst(e.target.value)} />
        )}
        <Input
          label="Valor do pagamento (R$)"
          type="number"
          min={0}
          step="0.01"
          value={amount || ''}
          onChange={e => setAmount(Number(e.target.value) || 0)}
        />
      </div>

      <div className={styles.payFooter}>
        <span className={styles.feeHint}>Sem taxa (demonstração)</span>
        <Button size="sm" iconLeft={<IconPlus />} onClick={add}>Adicionar</Button>
      </div>
    </div>
  )
}
