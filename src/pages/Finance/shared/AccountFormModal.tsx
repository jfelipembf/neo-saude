import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Textarea } from '@/components/Textarea/Textarea'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/Toast'
import { useAddPayable, useAddPayableSeries } from '@/hooks/useFinance'
import { useFinanceCategories } from '@/hooks/useFinanceCategories'
import { useCostCenters } from '@/hooks/useCostCenters'
import { recurrenceDueDates } from '@/services/financeService'
import { activeGroups, categoryPath } from '@/services/financeCategoryService'
import { activeOnly } from '@/services/costCenterService'
import { parseBRL } from '@/utils/format'
import { toIsoDate, isoToBrDate } from '@/utils/date'
import styles from './finance.module.scss'

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
  // Guarda o ID, não o texto: o texto é derivado na hora de salvar (rótulo
  // congelado). '' = ainda não escolheu.
  const [categoryId, setCategoryId] = useState('')
  const [costCenterId, setCostCenterId] = useState('')
  const [dueDateIso, setDueDateIso] = useState(() => toIsoDate(new Date()))
  const [amountText, setAmountText] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  // Plano de contas, lado DESPESA. O banco recusaria uma categoria de receita
  // aqui (FK composta com category_kind), então o filtro da tela e a trava do
  // banco dizem a mesma coisa — a tela só evita oferecer o que seria recusado.
  const { data: tree } = useFinanceCategories()
  const expenseGroups = activeGroups(tree ?? [], 'expense')

  // Opções em dois níveis: o grupo vira <optgroup>, as subcategorias viram as
  // opções. Grupo SEM subcategoria continua selecionável (é uma categoria
  // válida, só não detalhada) — senão ele apareceria como cabeçalho morto.
  const categoryOptions = expenseGroups.flatMap(group =>
    group.children.length > 0
      ? group.children.map(child => ({
          value: child.id,
          label: child.name,
          group: group.name,
        }))
      : [{ value: group.id, label: group.name, group: group.name }],
  )

  // Centros de custo ATIVOS. Clínica que nunca criou nenhum não vê o campo:
  // dimensão opcional que aparece como um seletor vazio só ensina que existe
  // algo faltando, e não há o que escolher.
  const { data: costCenters } = useCostCenters()
  const costCenterOptions = activeOnly(costCenters ?? [])

  /** Rótulo que vai CONGELADO na conta ("Despesas › Aluguel"). */
  function labelFor(id: string): string {
    for (const group of expenseGroups) {
      if (group.id === id) return categoryPath(group)
      const child = group.children.find(c => c.id === id)
      if (child) return categoryPath(group, child)
    }
    return ''
  }

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
    if (!categoryId) { setError('Escolha a categoria.'); return }

    const base = {
      description: description.trim(),
      // Os DOIS: o id classifica, o texto fica congelado para o dia em que a
      // categoria for renomeada.
      categoryId,
      category: labelFor(categoryId),
      // '' = "Nenhum" no seletor; a coluna aceita NULL.
      costCenterId: costCenterId || undefined,
      supplier: supplier.trim(),
      amount,
      notes: notes.trim() || undefined,
    }
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
            placeholder={categoryOptions.length > 0 ? 'Selecione...' : 'Nenhuma categoria de despesa ativa'}
            options={categoryOptions}
            value={categoryId}
            onChange={e => { setCategoryId(e.target.value); setError('') }}
          />
        </div>

        {costCenterOptions.length > 0 && (
          <Select
            label="Centro de custo"
            hint="Opcional — de qual parte da clínica é esta despesa."
            options={[
              { value: '', label: 'Nenhum' },
              ...costCenterOptions.map(c => ({ value: c.id, label: c.name })),
            ]}
            value={costCenterId}
            onChange={e => setCostCenterId(e.target.value)}
          />
        )}

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
