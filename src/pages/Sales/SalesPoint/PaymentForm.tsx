import { useState, useMemo, useEffect } from 'react'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Select } from '@/components/Select/Select'
import { Input } from '@/components/Input/Input'
import { Button } from '@/components/Button/Button'
import { IconPlus } from '@/components/icons'
import { useAcquirers } from '@/hooks/useFinance'
import { AVAILABLE_CARD_BRANDS } from '@/constants/finance'
import { PAY_METHOD_OPTIONS } from './types'
import type { PayMethod, Payment } from './types'
import styles from './SalesPointPage.module.scss'

let seq = 0

const CARD_BRAND_OPTIONS = AVAILABLE_CARD_BRANDS.map(b => ({ value: b, label: b }))

interface Props {
  balance: number
  /** Limite de parcelas do item vendido (contrato). Sem contrato → 12. */
  maxInstallments?: number
  onAdd: (p: Payment) => void
}

/** Formulário de pagamento (uma forma por vez). Crédito/débito exigem
 *  adquirente (repasse com taxa via card_installment_plan) e bandeira; código
 *  de autorização é opcional. Parcelas só existe em crédito. */
export function PaymentForm({ balance, maxInstallments, onAdd }: Props) {
  const { data: acquirers } = useAcquirers()
  const [method, setMethod] = useState<PayMethod>('cash')
  const [installments, setInst] = useState('1')
  const [acquirerId, setAcquirerId] = useState('')
  const [cardBrand, setCardBrand] = useState('')
  const [authorizationCode, setAuthorizationCode] = useState('')
  const [amount, setAmount] = useState(balance)
  const [acquirerError, setAcquirerError] = useState('')
  const [brandError, setBrandError] = useState('')

  const isCard = method === 'credit' || method === 'debit'
  const acquirerOptions = (acquirers ?? []).map(a => ({ value: a.id, label: a.name }))
  const selectedAcquirer = (acquirers ?? []).find(a => a.id === acquirerId)
  const maxInst = Math.max(1, Math.min(12, maxInstallments || 12))

  // Parcelas de VERDADE da adquirente escolhida (acquirer_installment_rate) —
  // não um 1..N genérico. 1x não tem linha própria na tabela (é creditFee da
  // adquirente, ver comment de acquirer_installment_rate), então entra à mão.
  const installmentOptions = useMemo(() => {
    if (!selectedAcquirer) return [{ value: '1', label: '1x (à vista)' }]
    const fee = (n: number) => (n === 1 ? selectedAcquirer.creditFee : selectedAcquirer.installmentFees?.find(r => r.installments === n)?.fee)
    const counts = [1, ...(selectedAcquirer.installmentFees ?? []).map(r => r.installments)]
      .filter(n => n <= maxInst)
      .sort((a, b) => a - b)
    return counts.map(n => {
      const f = fee(n)
      return { value: String(n), label: n === 1 ? '1x (à vista)' : `${n}x${f != null ? ` (${f.toFixed(2)}%)` : ''}` }
    })
  }, [selectedAcquirer, maxInst])

  // Sugere o saldo devedor como valor do próximo pagamento.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setAmount(balance) }, [balance])
  // Adquirente trocou (ou parcela escolhida saiu da lista de novo): volta pra 1x.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!installmentOptions.some(o => o.value === installments)) setInst('1') }, [installmentOptions, installments])

  function add() {
    if (amount <= 0) return
    if (isCard && !acquirerId) { setAcquirerError('Selecione a adquirente.'); return }
    if (isCard && !cardBrand) { setBrandError('Selecione a bandeira.'); return }
    onAdd({
      uid: `pay-${seq++}`,
      method,
      amount,
      installments: method === 'credit' ? Number(installments) : 1,
      acquirerId: isCard ? acquirerId : undefined,
      cardBrand: isCard ? cardBrand : undefined,
      authorizationCode: isCard ? (authorizationCode.trim() || undefined) : undefined,
    })
    setAmount(0)
    setAcquirerId('')
    setCardBrand('')
    setAuthorizationCode('')
  }

  return (
    <div className={styles.payForm}>
      <span className={styles.blockTitle}>Pagamento</span>

      <SegmentedControl
        options={PAY_METHOD_OPTIONS}
        value={method}
        onChange={m => { setMethod(m); setAcquirerError(''); setBrandError('') }}
      />

      <div className={styles.payGrid}>
        {isCard && (
          <Select
            label="Adquirente"
            options={acquirerOptions}
            placeholder="Selecione..."
            value={acquirerId}
            onChange={e => { setAcquirerId(e.target.value); setAcquirerError('') }}
            error={acquirerError}
          />
        )}
        {isCard && (
          <Select
            label="Bandeira"
            options={CARD_BRAND_OPTIONS}
            placeholder="Selecione..."
            value={cardBrand}
            onChange={e => { setCardBrand(e.target.value); setBrandError('') }}
            error={brandError}
          />
        )}
        {method === 'credit' && (
          <Select label="Parcelas" options={installmentOptions} value={installments} onChange={e => setInst(e.target.value)} />
        )}
        {isCard && (
          <Input
            label="Código de autorização"
            placeholder="Ex.: A73H21"
            value={authorizationCode}
            onChange={e => setAuthorizationCode(e.target.value)}
          />
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
        <Button size="sm" iconLeft={<IconPlus />} onClick={add}>Adicionar</Button>
      </div>
    </div>
  )
}
