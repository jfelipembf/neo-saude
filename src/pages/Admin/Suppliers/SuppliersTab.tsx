import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { FormSection } from '@/components/FormSection/FormSection'
import { Input } from '@/components/Input/Input'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { PhotoInput } from '@/components/PhotoInput/PhotoInput'
import { SideList } from '@/components/SideList/SideList'
import { AddressFields } from '@/components/AddressFields/AddressFields'
import { useToast } from '@/components/Toast/Toast'
import { useCreateSupplier, useSuppliers, useUpdateSupplier } from '@/hooks/useSuppliers'
import type { Address, Supplier } from '@/types/domain'
import styles from './SuppliersTab.module.scss'

interface SupplierFormState {
  name: string
  photo?: string
  cnpj: string
  phone: string
  cep: string
  state: string
  city: string
  neighborhood: string
  street: string
  number: string
}

const EMPTY_FORM: SupplierFormState = {
  name: '', photo: undefined, cnpj: '', phone: '',
  cep: '', state: '', city: '', neighborhood: '', street: '', number: '',
}

function formFromSupplier(s: Supplier): SupplierFormState {
  return {
    name: s.name,
    photo: s.photo,
    cnpj: s.cnpj ?? '',
    phone: s.phone ?? '',
    cep: s.cep ?? '',
    state: s.state ?? '',
    city: s.city ?? '',
    neighborhood: s.neighborhood ?? '',
    street: s.street ?? '',
    number: s.number ?? '',
  }
}

/** Aba "Fornecedores" (só odontologia): lista lateral + formulário (mesmo desenho de Comissões/Colaboradores). */
export function SuppliersTab() {
  const toast = useToast()
  const { data: suppliers, isLoading } = useSuppliers()
  const { mutate: create, isPending: creatingMut } = useCreateSupplier()
  const { mutate: update, isPending: saving } = useUpdateSupplier()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<SupplierFormState>(EMPTY_FORM)
  const [nameError, setNameError] = useState('')

  if (isLoading) return <PageLoader />

  const list = [...(suppliers ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  const selected = list.find(s => s.id === selectedId) ?? null

  const items = list.map(s => ({
    id: s.id,
    label: s.name,
    sublabel: s.phone || [s.city, s.state].filter(Boolean).join('/') || undefined,
    avatarUrl: s.photo,
    avatar: true,
  }))

  const set = (field: keyof SupplierFormState) => (value: string) => {
    setForm(current => ({ ...current, [field]: value }))
    if (field === 'name') setNameError('')
  }

  function selectSupplier(id: string) {
    const s = list.find(x => x.id === id)
    if (!s) return
    setForm(formFromSupplier(s))
    setNameError('')
    setCreating(false)
    setSelectedId(id)
  }

  function openNew() {
    setForm(EMPTY_FORM)
    setNameError('')
    setCreating(true)
    setSelectedId(null)
  }

  function handleCancel() {
    setSelectedId(null)
    setCreating(false)
    setForm(EMPTY_FORM)
    setNameError('')
  }

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setNameError('Informe o nome do fornecedor.')
      return
    }
    const payload = {
      name: form.name.trim(),
      photo: form.photo,
      cnpj: form.cnpj.trim() || undefined,
      phone: form.phone.trim() || undefined,
      cep: form.cep.trim() || undefined,
      state: form.state.trim().toUpperCase() || undefined,
      city: form.city.trim() || undefined,
      neighborhood: form.neighborhood.trim() || undefined,
      street: form.street.trim() || undefined,
      number: form.number.trim() || undefined,
    }
    const options = {
      onSuccess: () => {
        toast.success(selected ? 'Fornecedor atualizado!' : 'Fornecedor cadastrado!')
        handleCancel()
      },
    }
    if (selected) update({ id: selected.id, payload }, options)
    else create(payload, options)
  }

  return (
    <div className={styles.layout}>
      <SideList
        title="Fornecedores"
        size="lg"
        items={items}
        selectedId={creating ? null : selectedId}
        onSelect={id => selectSupplier(String(id))}
        onAdd={openNew}
        searchPlaceholder="Buscar fornecedor..."
        emptyText="Nenhum fornecedor cadastrado"
      />

      <div className={styles.formArea}>
        {!creating && !selected ? (
          <EmptyState
            title="Nenhum fornecedor selecionado"
            description="Selecione um fornecedor na lista ao lado, ou clique em + para cadastrar um novo."
          />
        ) : (
          <>
            <form id="form-fornecedor" className={styles.formRoot} onSubmit={handleSave}>
              <FormSection title={creating ? 'Novo fornecedor' : selected!.name}>
                <div className={styles.fields}>
                  <PhotoInput
                    label="Logo do fornecedor"
                    size="portrait"
                    value={form.photo}
                    onChange={url => setForm(current => ({ ...current, photo: url }))}
                    folder="suppliers"
                  />

                  <div className={styles.fieldStack}>
                    <Input
                      label="Nome"
                      placeholder="Ex: Dental Distribuidora Ltda"
                      value={form.name}
                      onChange={e => set('name')(e.target.value)}
                      error={nameError}
                      autoFocus
                    />
                    <div className={styles.grid2}>
                      <Input
                        label="CNPJ"
                        placeholder="00.000.000/0000-00"
                        inputMode="numeric"
                        value={form.cnpj}
                        onChange={e => set('cnpj')(e.target.value)}
                      />
                      <Input
                        label="Telefone"
                        type="tel"
                        placeholder="(00) 0000-0000"
                        value={form.phone}
                        onChange={e => set('phone')(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </FormSection>

              <FormSection title="Endereço">
                <AddressFields
                  value={form}
                  onChange={(field: keyof Address, value) => set(field)(value)}
                />
              </FormSection>
            </form>

            <div className={styles.acoesBar}>
              <Button variant="ghost" onClick={handleCancel} disabled={creatingMut || saving}>Cancelar</Button>
              <Button type="submit" form="form-fornecedor" loading={creatingMut || saving}>
                {creating ? 'Cadastrar fornecedor' : 'Salvar'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
