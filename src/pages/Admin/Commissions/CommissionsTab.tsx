import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { FormSection } from '@/components/FormSection/FormSection'
import { Input } from '@/components/Input/Input'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Select } from '@/components/Select/Select'
import { SideList } from '@/components/SideList/SideList'
import { Textarea } from '@/components/Textarea/Textarea'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/useToast'
import { useCommissions, useSaveCommission } from '@/hooks/useCommissions'
import { useProfessionals } from '@/hooks/useProfessionals'
import { formatBRL, parseBRL } from '@/utils/format'
import type { CommissionBase, ProfessionalCommission, CommissionPayout, CommissionType } from '@/types/domain'
import styles from './CommissionsTab.module.scss'

const TYPE_OPTIONS: { value: CommissionType; label: string }[] = [
  { value: 'percentage', label: 'Percentual' },
  { value: 'fixed', label: 'Valor fixo' },
]

const PAYOUT_OPTIONS: { value: CommissionPayout; label: string }[] = [
  { value: 'fixed_day',       label: 'Dia fixo do mês' },
  { value: 'per_visit', label: 'No dia do atendimento' },
]

const BASE_OPTIONS = [
  { value: 'received',  label: 'Sobre o recebido (o que o paciente pagou)' },
  { value: 'performed', label: 'Sobre o realizado (produção, mesmo sem receber)' },
]

// Até o dia 28: um dia de repasse que existe em todos os meses.
const DAY_OPTIONS = Array.from({ length: 28 }, (_, i) => ({
  value: String(i + 1),
  label: `Dia ${i + 1}`,
}))

interface CommissionFormState {
  type: CommissionType
  amountText: string
  base: CommissionBase
  payout: CommissionPayout
  payoutDay: string
  active: boolean
  notes: string
}

const DEFAULT_FORM: CommissionFormState = {
  type: 'percentage',
  amountText: '',
  base: 'received',
  payout: 'fixed_day',
  payoutDay: '5',
  active: true,
  notes: '',
}

function formFromCommission(c: ProfessionalCommission): CommissionFormState {
  return {
    type: c.type,
    amountText: String(c.amount).replace('.', ','),
    base: c.base,
    payout: c.payout,
    payoutDay: String(c.payoutDay ?? 5),
    active: c.status === 'active',
    notes: c.notes ?? '',
  }
}

/** Resumo da regra para o sublabel da lista (ex.: "40% sobre o recebido · dia 5"). */
function commissionSummary(c: ProfessionalCommission) {
  const amount = c.type === 'percentage'
    ? `${String(c.amount).replace('.', ',')}%`
    : `${formatBRL(c.amount)}/procedimento`
  const base = c.type === 'percentage' ? (c.base === 'received' ? ' sobre o recebido' : ' sobre o realizado') : ''
  const when = c.payout === 'fixed_day' ? ` · dia ${c.payoutDay}` : ' · no atendimento'
  return `${amount}${base}${when}${c.status === 'active' ? '' : ' · Inativa'}`
}

/**
 * Aba "Comissões": como e quando cada profissional recebe — percentual ou
 * valor fixo, sobre o recebido ou o realizado, em dia fixo do mês ou no dia
 * do atendimento (modelo dos softwares do ramo).
 */
export function CommissionsTab() {
  const toast = useToast()
  const { data: professionals, isLoading: loadingProfessionals } = useProfessionals()
  const { data: commissions, isLoading: loadingCommissions } = useCommissions()
  const { mutate: save, isPending: saving } = useSaveCommission()

  const [selected, setSelected] = useState<string | null>(null)
  const [form, setForm] = useState<CommissionFormState>(DEFAULT_FORM)
  const [valueError, setValueError] = useState('')

  if (loadingProfessionals || loadingCommissions) return <PageLoader />

  // Ordem alfabética pelo nome (pt-BR: acentos não bagunçam a ordenação).
  const list = [...(professionals ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  const ruleById = new Map((commissions ?? []).map(c => [c.professionalId, c]))

  const items = list.map(p => {
    const rule = ruleById.get(p.id)
    return {
      id: p.id,
      label: p.name,
      sublabel: rule ? commissionSummary(rule) : `${p.specialty} · Sem comissão configurada`,
    }
  })

  function set<K extends keyof CommissionFormState>(field: K, value: CommissionFormState[K]) {
    setForm(current => ({ ...current, [field]: value }))
    if (field === 'amountText' || field === 'type') setValueError('')
  }

  function selectProfessional(id: string) {
    const rule = ruleById.get(id)
    setForm(rule ? formFromCommission(rule) : DEFAULT_FORM)
    setValueError('')
    setSelected(id)
  }

  function handleCancel() {
    setSelected(null)
    setForm(DEFAULT_FORM)
    setValueError('')
  }

  function handleSave() {
    const value = parseBRL(form.amountText || '')
    if (!form.amountText.trim() || Number.isNaN(value) || value <= 0) {
      setValueError(form.type === 'percentage' ? 'Informe o percentual.' : 'Informe o valor.')
      return
    }
    if (form.type === 'percentage' && value > 100) {
      setValueError('Percentual não pode passar de 100%.')
      return
    }
    save(
      {
        professionalId: selected!,
        payload: {
          type: form.type,
          amount: value,
          base: form.base,
          payout: form.payout,
          payoutDay: form.payout === 'fixed_day' ? Number(form.payoutDay) : undefined,
          status: form.active ? 'active' : 'inactive',
          notes: form.notes.trim() || undefined,
        },
      },
      { onSuccess: () => toast.success('Comissão salva!') },
    )
  }

  const isPercentage = form.type === 'percentage'
  const professional = list.find(p => p.id === selected)

  return (
    <div className={styles.layout}>
      <SideList
        title="Profissionais"
        size="lg"
        items={items}
        selectedId={selected}
        onSelect={id => selectProfessional(String(id))}
        hideSearch
        emptyText="Nenhum profissional cadastrado"
      />

      <div className={styles.formArea}>
        {!selected ? (
          <EmptyState
            title="Nenhum profissional selecionado"
            description="Selecione um profissional na lista ao lado para configurar como e quando ele recebe a comissão."
          />
        ) : (
          <>
            <div className={styles.formRoot}>
              <FormSection
                title={`Regra de comissão — ${professional?.name ?? ''}`}
                actions={<Toggle label="Comissão ativa" checked={form.active} onChange={v => set('active', v)} />}
              >
                <div className={styles.fields}>
                  <div className={styles.fieldFull}>
                    <span className={styles.subLabel}>Tipo de comissão</span>
                    <SegmentedControl
                      options={TYPE_OPTIONS}
                      value={form.type}
                      onChange={v => set('type', v)}
                    />
                  </div>

                  <Input
                    label={isPercentage ? 'Percentual (%)' : 'Valor por procedimento'}
                    iconLeft={isPercentage ? undefined : <span className={styles.prefixo}>R$</span>}
                    inputMode="decimal"
                    placeholder={isPercentage ? 'Ex: 40' : 'Ex: 80,00'}
                    value={form.amountText}
                    onChange={e => set('amountText', e.target.value)}
                    error={valueError}
                  />

                  {isPercentage && (
                    <Select
                      label="Base de cálculo"
                      options={BASE_OPTIONS}
                      value={form.base}
                      onChange={e => set('base', e.target.value as CommissionBase)}
                    />
                  )}

                  <p className={`${styles.dica} ${styles.fieldFull}`}>
                    {isPercentage
                      ? form.base === 'received'
                        ? 'Sobre o recebido: a comissão só é gerada quando o paciente paga — protege o fluxo de caixa em tratamentos parcelados.'
                        : 'Sobre o realizado: a comissão é gerada pela produção, mesmo que o paciente ainda não tenha pago.'
                      : 'Valor fixo: o profissional recebe o mesmo valor por procedimento realizado, independente do preço cobrado.'}
                  </p>
                </div>
              </FormSection>

              <FormSection title="Repasse — quando o profissional recebe">
                <div className={styles.fields}>
                  <div className={styles.fieldFull}>
                    <SegmentedControl
                      options={PAYOUT_OPTIONS}
                      value={form.payout}
                      onChange={v => set('payout', v)}
                    />
                  </div>

                  {form.payout === 'fixed_day' && (
                    <Select
                      label="Dia do repasse"
                      options={DAY_OPTIONS}
                      value={form.payoutDay}
                      onChange={e => set('payoutDay', e.target.value)}
                    />
                  )}

                  <p className={`${styles.dica} ${styles.fieldFull}`}>
                    {form.payout === 'fixed_day'
                      ? 'As comissões do período acumulam e são pagas todo mês nesse dia (até o dia 28, que existe em todos os meses).'
                      : 'A comissão entra a pagar no dia de cada atendimento — repasse imediato, sem acúmulo mensal.'}
                  </p>
                </div>
              </FormSection>

              <FormSection title="Observações">
                <Textarea
                  placeholder="Regras combinadas, exceções por procedimento, descontos de materiais..."
                  rows={3}
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                />
              </FormSection>
            </div>

            <div className={styles.acoesBar}>
              <Button variant="ghost" onClick={handleCancel} disabled={saving}>Cancelar</Button>
              <Button loading={saving} onClick={handleSave}>Salvar</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
