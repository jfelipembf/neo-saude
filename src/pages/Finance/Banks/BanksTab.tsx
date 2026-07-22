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
import { useBankAccounts, useSaveBankAccount } from '@/hooks/useFinance'
import { ACCOUNT_TYPE_OPTIONS, ACCOUNT_TYPE_LABEL } from '@/constants'
import { parseBRL } from '@/utils/format'
import type { BankAccountType } from '@/types/domain'
import shared from '../shared/finance.module.scss'

interface AccountFormState {
  name: string
  type: BankAccountType
  bank: string
  branch: string
  accountNumber: string
  holder: string
  balanceText: string
  active: boolean
  notes: string
}

const EMPTY_ACCOUNT_FORM: AccountFormState = {
  name: '', type: 'checking', bank: '', branch: '', accountNumber: '', holder: '',
  balanceText: '', active: true, notes: '',
}

/** Aba "Contas bancárias": lista lateral + formulário de cadastro/edição. */
export function BanksTab() {
  const toast = useToast()
  const { data: accounts, isLoading } = useBankAccounts()
  const { mutate: save, isPending: saving } = useSaveBankAccount()

  const [selected, setSelected] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState<AccountFormState>(EMPTY_ACCOUNT_FORM)
  const [nameError, setNameError] = useState('')

  if (isLoading) return <PageLoader />

  const list = accounts ?? []
  const formVisible = selected !== null || isNew
  const isInternalCash = form.type === 'cash'

  const items = list.map(c => ({
    id: c.id,
    label: c.name,
    sublabel: ACCOUNT_TYPE_LABEL[c.type]
      + (c.bank ? ` · ${c.bank}` : '')
      + (c.status === 'active' ? '' : ' · Inativa'),
  }))

  function set<K extends keyof AccountFormState>(field: K, value: AccountFormState[K]) {
    setForm(current => ({ ...current, [field]: value }))
    if (field === 'name') setNameError('')
  }

  function handleSelect(id: string) {
    const account = list.find(c => c.id === id)
    if (!account) return
    setSelected(id)
    setIsNew(false)
    setNameError('')
    setForm({
      name: account.name,
      type: account.type,
      bank: account.bank ?? '',
      branch: account.branch ?? '',
      accountNumber: account.accountNumber ?? '',
      holder: account.holder ?? '',
      balanceText: account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      active: account.status === 'active',
      notes: account.notes ?? '',
    })
  }

  function handleNew() {
    setSelected(null)
    setIsNew(true)
    setForm(EMPTY_ACCOUNT_FORM)
    setNameError('')
  }

  function handleCancel() {
    setSelected(null)
    setIsNew(false)
    setForm(EMPTY_ACCOUNT_FORM)
    setNameError('')
  }

  function handleSave() {
    if (!form.name.trim()) {
      setNameError('Dê um nome à conta.')
      return
    }
    const balance = parseBRL(form.balanceText || '0')
    save(
      {
        id: selected,
        payload: {
          name: form.name.trim(),
          type: form.type,
          bank: isInternalCash ? undefined : form.bank.trim() || undefined,
          branch: isInternalCash ? undefined : form.branch.trim() || undefined,
          accountNumber: isInternalCash ? undefined : form.accountNumber.trim() || undefined,
          holder: isInternalCash ? undefined : form.holder.trim() || undefined,
          balance: Number.isFinite(balance) ? balance : 0,
          status: form.active ? 'active' : 'inactive',
          notes: form.notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Conta salva!')
          handleCancel()
        },
      },
    )
  }

  return (
    <div className={shared.layout}>
      <SideList
        title="Contas"
        size="lg"
        items={items}
        selectedId={selected}
        onSelect={id => handleSelect(String(id))}
        onAdd={handleNew}
        hideSearch
        emptyText="Nenhuma conta cadastrada"
      />

      <div className={shared.formArea}>
        {!formVisible ? (
          <EmptyState
            title="Nenhuma conta selecionada"
            description="Selecione uma conta na lista ao lado ou crie uma nova clicando em +."
          />
        ) : (
          <>
            <div className={shared.formRoot}>
              <FormSection
                title="Dados da Conta"
                actions={<Toggle label="Status" checked={form.active} onChange={v => set('active', v)} />}
              >
                <div className={shared.fields}>
                  <div className={shared.fieldFull}>
                    <Input
                      label="Nome da conta"
                      placeholder="Ex.: Inter — Conta PJ, Caixa da recepção..."
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      error={nameError}
                    />
                  </div>
                  <Select
                    label="Tipo"
                    options={ACCOUNT_TYPE_OPTIONS}
                    value={form.type}
                    onChange={e => set('type', e.target.value as BankAccountType)}
                  />
                  <Input
                    label="Saldo inicial"
                    iconLeft={<span className={shared.prefixo}>R$</span>}
                    inputMode="decimal"
                    placeholder="0,00"
                    value={form.balanceText}
                    onChange={e => set('balanceText', e.target.value)}
                  />
                </div>
              </FormSection>

              {!isInternalCash && (
                <FormSection title="Dados Bancários">
                  <div className={shared.fields}>
                    <div className={shared.fieldFull}>
                      <Input label="Banco" placeholder="Ex.: Banco Inter, Itaú..." value={form.bank} onChange={e => set('bank', e.target.value)} />
                    </div>
                    <Input label="Agência" placeholder="0000" value={form.branch} onChange={e => set('branch', e.target.value)} />
                    <Input label="Conta" placeholder="00000-0" value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} />
                    <div className={shared.fieldFull}>
                      <Input label="Titular" placeholder="Razão social" value={form.holder} onChange={e => set('holder', e.target.value)} />
                    </div>
                  </div>
                </FormSection>
              )}

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
