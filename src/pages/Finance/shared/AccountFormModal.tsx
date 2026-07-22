import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/useToast'
import { useAddPayable, useAddReceivable } from '@/hooks/useFinance'
import { parseBRL } from '@/utils/format'
import { toIsoDate } from '@/utils/date'
import styles from './finance.module.scss'

/** Categorias de despesa (conta a pagar). */
const PAYABLE_CATEGORIES = [
  'Fornecedores', 'Materiais e insumos', 'Aluguel', 'Salários e encargos',
  'Impostos e taxas', 'Água, luz e internet', 'Manutenção', 'Marketing', 'Outros',
]

/** Origens de receita (conta a receber avulsa). */
const RECEIVABLE_SOURCES = [
  'Consultas', 'Procedimentos', 'Convênio', 'Vendas', 'Outros',
]

interface AccountFormModalProps {
  kind: 'payable' | 'receivable'
  onClose: () => void
}

/**
 * Modal "Nova conta a pagar/receber": descrição, favorecido (fornecedor/origem),
 * categoria, vencimento, valor e observação — o mínimo dos sistemas do ramo
 * (Omie/Conta Azul). A conta nasce em aberto (pending); a baixa é no SettleModal.
 */
export function AccountFormModal({ kind, onClose }: AccountFormModalProps) {
  const toast = useToast()
  const isPayable = kind === 'payable'
  const { mutate: addPayable, isPending: savingPayable } = useAddPayable()
  const { mutate: addReceivable, isPending: savingReceivable } = useAddReceivable()
  const saving = savingPayable || savingReceivable

  const [description, setDescription] = useState('')
  const [party, setParty] = useState('')   // fornecedor (pagar) ou origem (receber)
  const [category, setCategory] = useState(isPayable ? PAYABLE_CATEGORIES[0] : RECEIVABLE_SOURCES[0])
  const [dueDateIso, setDueDateIso] = useState(() => toIsoDate(new Date()))
  const [amountText, setAmountText] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  function save() {
    if (!description.trim()) {
      setError('Informe a descrição.')
      return
    }
    const amount = parseBRL(amountText)
    if (!amountText.trim() || Number.isNaN(amount) || amount <= 0) {
      setError('Informe o valor.')
      return
    }
    if (isPayable && !party.trim()) {
      setError('Informe o fornecedor.')
      return
    }

    const dueDate = dueDateIso.split('-').reverse().join('/')
    const opts = {
      onSuccess: () => {
        toast.success(isPayable ? 'Conta a pagar cadastrada!' : 'Conta a receber cadastrada!')
        onClose()
      },
    }

    if (isPayable) {
      addPayable(
        { description: description.trim(), category, supplier: party.trim(), dueDate, amount, notes: notes.trim() || undefined },
        opts,
      )
    } else {
      addReceivable(
        { description: description.trim(), source: category, dueDate, grossAmount: amount, notes: notes.trim() || undefined },
        opts,
      )
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isPayable ? 'Nova conta a pagar' : 'Nova conta a receber'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button loading={saving} onClick={save}>Cadastrar</Button>
        </>
      }
    >
      <div className={styles.formCorpo}>
        <Input
          label="Descrição"
          placeholder={isPayable ? 'Ex: Compra de resina composta' : 'Ex: Convênio Unimed — competência 07/2026'}
          value={description}
          onChange={e => { setDescription(e.target.value); setError('') }}
          autoFocus
        />

        <div className={styles.formLinha2}>
          <Input
            label={isPayable ? 'Fornecedor' : 'Pagador (opcional)'}
            placeholder={isPayable ? 'Ex: Dental Cremer' : 'Ex: Unimed'}
            value={party}
            onChange={e => { setParty(e.target.value); setError('') }}
          />
          <Select
            label={isPayable ? 'Categoria' : 'Origem'}
            options={(isPayable ? PAYABLE_CATEGORIES : RECEIVABLE_SOURCES).map(c => ({ value: c, label: c }))}
            value={category}
            onChange={e => setCategory(e.target.value)}
          />
        </div>

        <div className={styles.formLinha2}>
          <Input
            label="Vencimento"
            type="date"
            value={dueDateIso}
            onChange={e => setDueDateIso(e.target.value)}
          />
          <Input
            label="Valor"
            iconLeft={<span className={styles.prefixo}>R$</span>}
            inputMode="decimal"
            placeholder="0,00"
            value={amountText}
            onChange={e => { setAmountText(e.target.value); setError('') }}
          />
        </div>

        <Textarea
          label="Observação"
          placeholder="Anotações sobre a conta (opcional)"
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        {error && <p className={styles.erro}>{error}</p>}
      </div>
    </Modal>
  )
}
