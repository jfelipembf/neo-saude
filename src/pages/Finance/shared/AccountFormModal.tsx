import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Textarea } from '@/components/Textarea/Textarea'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/useToast'
import { useAddPayable, useAddPayableSeries } from '@/hooks/useFinance'
import { recurrenceDueDates } from '@/services/financeService'
import { parseBRL } from '@/utils/format'
import { toIsoDate, isoToBrDate } from '@/utils/date'
import styles from './finance.module.scss'

/** Categorias de despesa (conta a pagar). */
const PAYABLE_CATEGORIES = [
  'Fornecedores', 'Materiais e insumos', 'Aluguel', 'Salários e encargos',
  'Impostos e taxas', 'Água, luz e internet', 'Manutenção', 'Marketing', 'Outros',
]

const TIPO_OPTIONS = [
  { value: 'single', label: 'Única' },
  { value: 'recurring', label: 'Recorrente' },
] as const

const FREQ_OPTIONS = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'weekly', label: 'Semanal' },
] as const

interface AccountFormModalProps {
  onClose: () => void
}

/**
 * Modal "Nova conta a pagar": descrição, fornecedor, categoria, vencimento,
 * valor e observação — o mínimo dos sistemas do ramo (Omie/Conta Azul). Pode ser
 * ÚNICA ou RECORRENTE (mensal/semanal, com data de início e, opcionalmente, data
 * final): a recorrente gera uma conta por ocorrência, cada uma baixável sozinha.
 *
 * SÓ conta a PAGAR: título a receber nunca é digitado à mão — nasce no aceite
 * do orçamento (parcelas do contrato) ou no faturamento do procedimento.
 */
export function AccountFormModal({ onClose }: AccountFormModalProps) {
  const toast = useToast()
  const { mutate: addPayable, isPending: savingSingle } = useAddPayable()
  const { mutate: addSeries, isPending: savingSeries } = useAddPayableSeries()
  const saving = savingSingle || savingSeries

  const [description, setDescription] = useState('')
  const [supplier, setSupplier] = useState('')
  const [category, setCategory] = useState(PAYABLE_CATEGORIES[0])
  const [dueDateIso, setDueDateIso] = useState(() => toIsoDate(new Date()))
  const [amountText, setAmountText] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  // Recorrência.
  const [tipo, setTipo] = useState<'single' | 'recurring'>('single')
  const [frequency, setFrequency] = useState<'monthly' | 'weekly'>('monthly')
  const [hasEndDate, setHasEndDate] = useState(false)
  const [endDateIso, setEndDateIso] = useState('')

  const recurring = tipo === 'recurring'
  const toBr = (iso: string) => iso.split('-').reverse().join('/')

  // Prévia de quantas contas nascem (mesma regra do service).
  const preview = recurring
    ? recurrenceDueDates(toBr(dueDateIso), frequency, hasEndDate && endDateIso ? toBr(endDateIso) : undefined)
    : []

  function save() {
    if (!description.trim()) { setError('Informe a descrição.'); return }
    const amount = parseBRL(amountText)
    if (!amountText.trim() || Number.isNaN(amount) || amount <= 0) { setError('Informe o valor.'); return }
    if (!supplier.trim()) { setError('Informe o fornecedor.'); return }

    const base = { description: description.trim(), category, supplier: supplier.trim(), amount, notes: notes.trim() || undefined }
    const startBr = toBr(dueDateIso)

    if (recurring) {
      if (hasEndDate) {
        if (!endDateIso) { setError('Informe a data final ou desmarque a opção.'); return }
        if (endDateIso < dueDateIso) { setError('A data final deve ser depois da data de início.'); return }
      }
      addSeries(
        { ...base, dueDate: startBr, frequency, endDate: hasEndDate ? toBr(endDateIso) : undefined },
        {
          onSuccess: n => {
            toast.success(n === 1 ? 'Conta a pagar cadastrada!' : `${n} contas a pagar cadastradas!`)
            onClose()
          },
        },
      )
      return
    }

    addPayable(
      { ...base, dueDate: startBr },
      {
        onSuccess: () => { toast.success('Conta a pagar cadastrada!'); onClose() },
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
          placeholder="Ex: Aluguel do consultório"
          value={description}
          onChange={e => { setDescription(e.target.value); setError('') }}
          autoFocus
        />

        <div className={styles.formLinha2}>
          <Input
            label="Fornecedor"
            placeholder="Ex: Imobiliária Central"
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
            label={recurring ? 'Data de início' : 'Vencimento'}
            type="date"
            value={dueDateIso}
            onChange={e => { setDueDateIso(e.target.value); setError('') }}
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

        {/* ── Recorrência ── */}
        <div className={styles.recorrencia}>
          <div className={styles.recorrenciaTopo}>
            <span className={styles.recorrenciaRotulo}>Tipo de despesa</span>
            <SegmentedControl options={TIPO_OPTIONS} value={tipo} onChange={setTipo} />
          </div>

          {recurring && (
            <>
              <div className={styles.recorrenciaTopo}>
                <span className={styles.recorrenciaRotulo}>Frequência</span>
                <SegmentedControl options={FREQ_OPTIONS} value={frequency} onChange={setFrequency} />
              </div>

              <Toggle
                label="Definir data final"
                checked={hasEndDate}
                onChange={v => { setHasEndDate(v); setError('') }}
              />
              {hasEndDate && (
                <Input
                  label="Data final"
                  type="date"
                  value={endDateIso}
                  onChange={e => { setEndDateIso(e.target.value); setError('') }}
                />
              )}

              {preview.length > 0 && (
                <p className={styles.dica}>
                  {hasEndDate
                    ? `Serão criadas ${preview.length} contas (${frequency === 'monthly' ? 'mensais' : 'semanais'}), de ${isoToBrDate(preview[0])} a ${isoToBrDate(preview[preview.length - 1])}.`
                    : `Serão criadas as próximas ${preview.length} contas (${frequency === 'monthly' ? 'mensais' : 'semanais'}), a partir de ${isoToBrDate(preview[0])}. Você pode gerar novas depois.`}
                </p>
              )}
            </>
          )}
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
