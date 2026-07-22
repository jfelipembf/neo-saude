import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { PAYMENT_METHOD_LABEL } from '@/constants'
import { useProfessionalName } from '@/hooks/useDisplayNames'
import { stripTitle } from '@/utils/text'
import type { BilledTreatment, PaymentMethod } from '@/types/domain'
import styles from './PaymentModal.module.scss'

const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]

const CARD_BRAND_OPTIONS = ['Visa', 'Mastercard', 'Elo', 'Amex', 'Hipercard'].map(b => ({ value: b, label: b }))

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** '100,00' | '1.250,50' → número (NaN se inválido). */
function parseAmount(text: string) {
  return Number(text.replace(/\./g, '').replace(',', '.'))
}

/** Date → 'aaaa-mm-dd' local, para o input de data. */
function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** O que o modal devolve ao confirmar — quem chama decide onde persistir. */
export interface PaymentModalResult {
  method: PaymentMethod
  amount: number
  date: string           // dd/mm/aaaa
  cardBrand?: string
  authorizationCode?: string
  nsu?: string
  installments?: number      // só crédito
  bankAccountId?: string
}

export interface PaymentModalProps {
  /** Cobrança em aberto; null mantém o modal fechado. */
  charge: {
    /** Remonta o formulário a cada cobrança diferente. */
    id: string
    description: string
    amount: number
    /** Detalhamento; sem ele a própria cobrança vira o único item. */
    treatments?: BilledTreatment[]
  } | null
  patient?: { name: string; cpf?: string }
  /** Contas bancárias para escolher onde o dinheiro entra (opcional). */
  contas?: { value: string; label: string }[]
  confirmando?: boolean
  onConfirm: (payload: PaymentModalResult) => void
  onClose: () => void
}

/** Modal "Realizar pagamento": itens cobrados, forma, valor e data.
 *  É APRESENTACIONAL — não persiste nada; devolve os dados em `onConfirm`. */
export function PaymentModal({ charge, ...rest }: PaymentModalProps) {
  if (!charge) return null
  // key remonta o formulário a cada cobrança — o estado nasce pronto
  // (valor cheio + data de hoje) sem precisar de reset via efeito.
  return <PaymentForm key={charge.id} charge={charge} {...rest} />
}

type PaymentFormProps = Omit<PaymentModalProps, 'charge'> & {
  charge: NonNullable<PaymentModalProps['charge']>
}

function PaymentForm({ charge, patient, contas: accounts, confirmando: confirming, onConfirm, onClose }: PaymentFormProps) {

  const professionalName = useProfessionalName()
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [amountText, setAmountText] = useState(() =>
    charge.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
  )
  const [dateIso, setDateIso] = useState(todayIso())
  const [amountError, setAmountError] = useState('')
  const [accountId, setAccountId] = useState('')
  // Campos exclusivos de cartão (crédito/débito).
  const [brand, setBrand] = useState('')
  const [installments, setInstallments] = useState(1)
  const [authorization, setAuthorization] = useState('')
  const [nsu, setNsu] = useState('')
  const [brandError, setBrandError] = useState('')

  const isCard = method === 'credit' || method === 'debit'

  // "3× de R$ 50,00" calculado sobre o valor digitado.
  const currentAmount = parseAmount(amountText)
  const installmentOptions = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1
    const perInstallment = Number.isFinite(currentAmount) && currentAmount > 0
      ? ` de ${formatBRL(currentAmount / n)}`
      : ''
    return { value: String(n), label: n === 1 ? 'À vista' : `${n}×${perInstallment}` }
  })

  // Sem detalhamento cadastrado, a própria cobrança vira o único item da lista.
  const treatments = charge.treatments?.length
    ? charge.treatments
    : [{ name: charge.description, amount: charge.amount, professionalId: undefined }]

  function handleConfirm() {
    const amount = parseAmount(amountText)
    if (!Number.isFinite(amount) || amount <= 0) {
      setAmountError('Informe um valor válido.')
      return
    }
    if (isCard && !brand) {
      setBrandError('Selecione a bandeira do cartão.')
      return
    }
    onConfirm({
      method,
      amount,
      date: dateIso.split('-').reverse().join('/'),
      ...(isCard && {
        cardBrand: brand,
        authorizationCode: authorization.trim() || undefined,
        nsu: nsu.trim() || undefined,
      }),
      ...(method === 'credit' && { installments }),
      ...(accountId && { bankAccountId: accountId }),
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Realizar pagamento"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={confirming}>Cancelar</Button>
          <Button onClick={handleConfirm} loading={confirming}>Confirmar pagamento</Button>
        </>
      }
    >
      <div className={styles.corpo}>
        {patient && (
          <div className={styles.paciente}>
            <strong>{patient.name}</strong>
            {patient.cpf && <span>{patient.cpf}</span>}
          </div>
        )}

        <section className={styles.secao}>
          <h3>Tratamentos</h3>
          <ul className={styles.tratamentos}>
            {treatments.map((t, index) => (
              <li key={index} className={styles.tratamento}>
                <div className={styles.tratamentoInfo}>
                  <span className={styles.tratamentoNome}>{t.name}</span>
                  {t.professionalId && (
                    <span className={styles.tratamentoProf}>Dr(a) {stripTitle(professionalName(t.professionalId))}</span>
                  )}
                </div>
                <span className={styles.tratamentoValor}>{formatBRL(t.amount)}</span>
              </li>
            ))}
          </ul>
          <p className={styles.total}>
            Total a ser pago <strong>{formatBRL(charge.amount)}</strong>
          </p>
        </section>

        <p className={styles.novidade}>
          <strong>Novidade!</strong> Aproveite para configurar as maquininhas de cartão,
          taxas e o período de recebimento de cada uma.
        </p>

        <section className={styles.secao}>
          <h3>Forma de pagamento</h3>
          <div className={styles.formas} role="group" aria-label="Forma de pagamento">
            {PAYMENT_METHODS.map(type => (
              <button
                key={type}
                type="button"
                className={`${styles.formaBtn} ${method === type ? styles['formaBtn--ativa'] : ''}`}
                aria-pressed={method === type}
                onClick={() => { setMethod(type); setBrandError('') }}
              >
                {PAYMENT_METHOD_LABEL[type]}
              </button>
            ))}
          </div>

          {/* Dados da maquininha — só para cartão de crédito/débito. */}
          {isCard && (
            <div className={styles.cartao}>
              <div className={styles.campos}>
                <Select
                  label="Bandeira"
                  options={CARD_BRAND_OPTIONS}
                  placeholder="Selecione..."
                  value={brand}
                  onChange={e => { setBrand(e.target.value); setBrandError('') }}
                  error={brandError}
                />
                {method === 'credit' && (
                  <Select
                    label="Parcelas"
                    options={installmentOptions}
                    value={String(installments)}
                    onChange={e => setInstallments(Number(e.target.value))}
                  />
                )}
              </div>
              <div className={styles.campos}>
                <Input
                  label="Código de autorização"
                  placeholder="Ex.: A73H21"
                  value={authorization}
                  onChange={e => setAuthorization(e.target.value)}
                />
                <Input
                  label="NSU"
                  placeholder="Ex.: 004512"
                  inputMode="numeric"
                  value={nsu}
                  onChange={e => setNsu(e.target.value)}
                />
              </div>
            </div>
          )}
        </section>

        <div className={styles.campos}>
          <Input
            label="Valor pago"
            iconLeft={<span className={styles.prefixo}>R$</span>}
            inputMode="decimal"
            value={amountText}
            onChange={e => { setAmountText(e.target.value); setAmountError('') }}
            error={amountError}
          />
          <Input
            label="Data do pagamento"
            type="date"
            value={dateIso}
            onChange={e => setDateIso(e.target.value)}
          />
        </div>

        {/* Só aparece quando o chamador informa as contas (baixa do financeiro). */}
        {accounts && accounts.length > 0 && (
          <Select
            label="Conta bancária"
            placeholder="Selecione a conta..."
            options={accounts}
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
          />
        )}
      </div>
    </Modal>
  )
}
