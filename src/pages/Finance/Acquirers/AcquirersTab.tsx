import { useState } from 'react'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { FormSection } from '@/components/FormSection/FormSection'
import { Input } from '@/components/Input/Input'
import { Select } from '@/components/Select/Select'
import { SideList } from '@/components/SideList/SideList'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/useToast'
import { useAcquirers, useBankAccounts, useSaveAcquirer } from '@/hooks/useFinance'
import { AVAILABLE_CARD_BRANDS } from '@/constants'
import { parsePercent } from '@/utils/format'
import type { InstallmentRate } from '@/types/domain'
import { InstallmentsEditor } from './InstallmentsEditor'
import shared from '../shared/finance.module.scss'
import styles from './AcquirersTab.module.scss'

interface AcquirerFormState {
  name: string
  active: boolean
  cardBrands: string[]
  creditFeeText: string
  debitFeeText: string
  installmentFees: InstallmentRate[]
  settlementDaysText: string
  payoutAccountId: string
  notes: string
}

const EMPTY_ACQUIRER_FORM: AcquirerFormState = {
  name: '', active: true, cardBrands: [], creditFeeText: '', debitFeeText: '',
  installmentFees: [], settlementDaysText: '1', payoutAccountId: '', notes: '',
}

/** Aba "Adquirentes": lista lateral + formulário de bandeiras, taxas e repasse. */
export function AcquirersTab() {
  const toast = useToast()
  const { data: acquirers, isLoading } = useAcquirers()
  const { data: accounts } = useBankAccounts()
  const { mutate: save, isPending: saving } = useSaveAcquirer()

  const [selected, setSelected] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState<AcquirerFormState>(EMPTY_ACQUIRER_FORM)
  const [nameError, setNameError] = useState('')
  const [newBrand, setNewBrand] = useState('')

  if (isLoading) return <PageLoader />

  const list = acquirers ?? []
  const formVisible = selected !== null || isNew

  // Chips exibidos: as bandeiras conhecidas + qualquer custom já selecionada.
  const displayedBrands = [
    ...AVAILABLE_CARD_BRANDS,
    ...form.cardBrands.filter(b => !AVAILABLE_CARD_BRANDS.includes(b)),
  ]

  const items = list.map(a => ({
    id: a.id,
    label: a.name,
    sublabel: `${a.cardBrands.length} bandeira(s) · D+${a.settlementDays}`
      + (a.status === 'active' ? '' : ' · Inativa'),
  }))

  const accountOptions = (accounts ?? []).map(c => ({ value: c.id, label: c.name }))

  function set<K extends keyof AcquirerFormState>(field: K, value: AcquirerFormState[K]) {
    setForm(current => ({ ...current, [field]: value }))
    if (field === 'name') setNameError('')
  }

  function toggleBrand(brand: string) {
    setForm(current => ({
      ...current,
      cardBrands: current.cardBrands.includes(brand)
        ? current.cardBrands.filter(b => b !== brand)
        : [...current.cardBrands, brand],
    }))
  }

  /** Adiciona uma bandeira fora da lista padrão (já entra selecionada). */
  function addBrand() {
    const name = newBrand.trim()
    if (!name) return
    const existing = displayedBrands.find(b => b.toLowerCase() === name.toLowerCase())
    if (existing) {
      // Já conhecida: só garante a seleção, sem duplicar o chip.
      if (!form.cardBrands.includes(existing)) toggleBrand(existing)
    } else {
      setForm(current => ({ ...current, cardBrands: [...current.cardBrands, name] }))
    }
    setNewBrand('')
  }

  function selectAcquirer(id: string) {
    const acquirer = list.find(a => a.id === id)
    if (!acquirer) return
    setSelected(id)
    setIsNew(false)
    setNameError('')
    setNewBrand('')
    setForm({
      name: acquirer.name,
      active: acquirer.status === 'active',
      cardBrands: [...acquirer.cardBrands],
      creditFeeText: String(acquirer.creditFee).replace('.', ','),
      debitFeeText: String(acquirer.debitFee).replace('.', ','),
      installmentFees: (acquirer.installmentFees ?? []).map(t => ({ ...t })),
      settlementDaysText: String(acquirer.settlementDays),
      payoutAccountId: acquirer.payoutAccountId ?? '',
      notes: acquirer.notes ?? '',
    })
  }

  function handleNew() {
    setSelected(null)
    setIsNew(true)
    setForm(EMPTY_ACQUIRER_FORM)
    setNameError('')
    setNewBrand('')
  }

  function handleCancel() {
    setSelected(null)
    setIsNew(false)
    setForm(EMPTY_ACQUIRER_FORM)
    setNameError('')
    setNewBrand('')
  }

  function handleSave() {
    if (!form.name.trim()) {
      setNameError('Dê um nome à adquirente.')
      return
    }
    const creditFee = parsePercent(form.creditFeeText || '0')
    const debitFee  = parsePercent(form.debitFeeText || '0')
    const days      = Number(form.settlementDaysText || '1')
    save(
      {
        id: selected,
        payload: {
          name: form.name.trim(),
          cardBrands: form.cardBrands,
          creditFee: Number.isFinite(creditFee) ? creditFee : 0,
          debitFee: Number.isFinite(debitFee) ? debitFee : 0,
          // Só linhas válidas entram (parcelas ≥ 2 e taxa ≥ 0), ordenadas.
          installmentFees: form.installmentFees
            .filter(t => t.installments >= 2 && t.fee >= 0)
            .sort((a, b) => a.installments - b.installments),
          settlementDays: Number.isFinite(days) && days > 0 ? days : 1,
          payoutAccountId: form.payoutAccountId || undefined,
          status: form.active ? 'active' : 'inactive',
          notes: form.notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Adquirente salva!')
          handleCancel()
        },
      },
    )
  }

  return (
    <div className={shared.layout}>
      <SideList
        title="Adquirentes"
        size="lg"
        items={items}
        selectedId={selected}
        onSelect={id => selectAcquirer(String(id))}
        onAdd={handleNew}
        searchPlaceholder="Buscar adquirente..."
        emptyText="Nenhuma adquirente cadastrada"
      />

      <div className={shared.formArea}>
        {!formVisible ? (
          <EmptyState
            title="Nenhuma adquirente selecionada"
            description="Selecione uma adquirente na lista ao lado ou crie uma nova clicando em +."
          />
        ) : (
          <>
            <div className={shared.formRoot}>
              <FormSection
                title="Dados da Adquirente"
                actions={<Toggle label="Status" checked={form.active} onChange={v => set('active', v)} />}
              >
                <div className={shared.fields}>
                  <div className={shared.fieldFull}>
                    <Input
                      label="Nome da adquirente / maquininha"
                      placeholder="Ex.: Stone, Cielo, PagBank..."
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      error={nameError}
                    />
                  </div>
                  <Select
                    label="Conta de repasse"
                    placeholder="Selecione a conta..."
                    options={accountOptions}
                    value={form.payoutAccountId}
                    onChange={e => set('payoutAccountId', e.target.value)}
                  />
                  <Input
                    label="Prazo de repasse (D+N)"
                    type="number"
                    min={1}
                    hint="Dias até o dinheiro cair (1 = D+1)."
                    value={form.settlementDaysText}
                    onChange={e => set('settlementDaysText', e.target.value)}
                  />
                </div>
              </FormSection>

              <FormSection title="Bandeiras e Taxas">
                <div className={shared.fields}>
                  <div className={shared.fieldFull}>
                    <span className={styles.subLabel}>Bandeiras aceitas</span>
                    <div className={styles.chips} role="group" aria-label="Bandeiras aceitas">
                      {displayedBrands.map(b => (
                        <button
                          key={b}
                          type="button"
                          className={`${styles.chip} ${form.cardBrands.includes(b) ? styles['chip--ativa'] : ''}`}
                          aria-pressed={form.cardBrands.includes(b)}
                          onClick={() => toggleBrand(b)}
                        >
                          {b}
                        </button>
                      ))}
                    </div>

                    {/* Bandeira fora da lista: digitar e adicionar (entra selecionada). */}
                    <div className={styles.novaBandeira}>
                      <Input
                        size="sm"
                        placeholder="Outra bandeira..."
                        value={newBrand}
                        onChange={e => setNewBrand(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBrand() } }}
                        aria-label="Nova bandeira"
                      />
                      <Button size="sm" variant="outline" onClick={addBrand} disabled={!newBrand.trim()}>
                        + Adicionar
                      </Button>
                    </div>
                  </div>
                  <Input
                    label="Taxa crédito à vista (%)"
                    inputMode="decimal"
                    placeholder="3,19"
                    value={form.creditFeeText}
                    onChange={e => set('creditFeeText', e.target.value)}
                  />
                  <Input
                    label="Taxa débito (%)"
                    inputMode="decimal"
                    placeholder="1,45"
                    value={form.debitFeeText}
                    onChange={e => set('debitFeeText', e.target.value)}
                  />

                  <div className={shared.fieldFull}>
                    <span className={styles.subLabel}>Crédito parcelado — taxa (%) por nº de parcelas</span>
                    <InstallmentsEditor
                      rows={form.installmentFees}
                      onChange={rows => set('installmentFees', rows)}
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection title="Observações">
                <Input label="Observações" placeholder="Opcional" value={form.notes} onChange={e => set('notes', e.target.value)} />
              </FormSection>
            </div>

            {/* Ações no rodapé do formulário. */}
            <div className={shared.acoesBar}>
              <Button variant="ghost" onClick={handleCancel} disabled={saving}>Cancelar</Button>
              <Button loading={saving} onClick={handleSave}>Salvar</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
