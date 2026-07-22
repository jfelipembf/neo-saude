import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/useToast'
import { useAddPayable } from '@/hooks/useFinance'
import { parseBRL } from '@/utils/format'
import { toIsoDate } from '@/utils/date'
import styles from './finance.module.scss'

/** Categorias de despesa (conta a pagar). */
const PAYABLE_CATEGORIES = [
  'Fornecedores', 'Materiais e insumos', 'Aluguel', 'Salários e encargos',
  'Impostos e taxas', 'Água, luz e internet', 'Manutenção', 'Marketing', 'Outros',
]

interface AccountFormModalProps {
  onClose: () => void
}

/**
 * Modal "Nova conta a pagar": descrição, fornecedor, categoria, vencimento,
 * valor e observação — o mínimo dos sistemas do ramo (Omie/Conta Azul). A conta
 * nasce em aberto (pending); a baixa é no SettleModal.
 *
 * SÓ conta a PAGAR: título a receber nunca é digitado à mão — nasce no aceite
 * do orçamento (parcelas do contrato) ou no faturamento do procedimento.
 */
export function AccountFormModal({ onClose }: AccountFormModalProps) {
  const toast = useToast()
  const { mutate: addPayable, isPending: saving } = useAddPayable()

  const [description, setDescription] = useState('')
  const [supplier, setSupplier] = useState('')
  const [category, setCategory] = useState(PAYABLE_CATEGORIES[0])
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
    if (!supplier.trim()) {
      setError('Informe o fornecedor.')
      return
    }

    const dueDate = dueDateIso.split('-').reverse().join('/')
    addPayable(
      { description: description.trim(), category, supplier: supplier.trim(), dueDate, amount, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Conta a pagar cadastrada!')
          onClose()
        },
      },
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Nova conta a pagar"
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
          placeholder="Ex: Compra de resina composta"
          value={description}
          onChange={e => { setDescription(e.target.value); setError('') }}
          autoFocus
        />

        <div className={styles.formLinha2}>
          <Input
            label="Fornecedor"
            placeholder="Ex: Dental Cremer"
            value={supplier}
            onChange={e => { setSupplier(e.target.value); setError('') }}
          />
          <Select
            label="Categoria"
            options={PAYABLE_CATEGORIES.map(c => ({ value: c, label: c }))}
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
