import { useState } from 'react'
import type { FormEvent } from 'react'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { FormSection } from '@/components/FormSection/FormSection'
import { Input } from '@/components/Input/Input'
import { MultiSelect } from '@/components/MultiSelect/MultiSelect'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { PhotoInput } from '@/components/PhotoInput/PhotoInput'
import { SideList } from '@/components/SideList/SideList'
import { useToast } from '@/components/Toast/Toast'
import { useMaterials, useCreateMaterial, useUpdateMaterial } from '@/hooks/useMaterials'
import { useSuppliers } from '@/hooks/useSuppliers'
import type { Material } from '@/types/domain'
import styles from './MaterialsTab.module.scss'

/** Status do estoque: esgotado > vencido > estoque baixo > em estoque. */
function materialStatus(m: Material): string {
  if (m.inStock <= 0) return 'out_of_stock'
  if (m.expiryDate) {
    const [day, month, year] = m.expiryDate.split('/').map(Number)
    if (new Date(year, month - 1, day) < new Date()) return 'expired'
  }
  if (m.inStock <= m.minQuantity) return 'low_stock'
  return 'in_stock'
}

interface MaterialFormState {
  name: string
  photo?: string
  inStock: string      // texto do input; vira número ao salvar
  minQuantity: string
  expiryDateIso: string    // aaaa-mm-dd (input date)
  notes: string
  supplierIds: string[]
}

const EMPTY_FORM: MaterialFormState = {
  name: '', photo: undefined, inStock: '1', minQuantity: '1', expiryDateIso: '', notes: '', supplierIds: [],
}

/** Monta o formulário a partir do material cadastrado (validade dd/mm/aaaa → input date). */
function formFromMaterial(m: Material): MaterialFormState {
  return {
    name: m.name,
    photo: m.photo,
    inStock: String(m.inStock),
    minQuantity: String(m.minQuantity),
    expiryDateIso: m.expiryDate ? m.expiryDate.split('/').reverse().join('-') : '',
    notes: m.notes ?? '',
    supplierIds: m.supplierIds,
  }
}

/** Aba "Materiais": lista lateral + formulário (mesmo desenho de Comissões/Colaboradores). */
export function MaterialsTab() {
  const toast = useToast()
  const { data: materials, isLoading } = useMaterials()
  const { data: suppliers } = useSuppliers()
  const { mutate: create, isPending: creatingMut } = useCreateMaterial()
  const { mutate: update, isPending: saving } = useUpdateMaterial()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<MaterialFormState>(EMPTY_FORM)
  const [nameError, setNameError] = useState('')

  if (isLoading) return <PageLoader />

  // Ordem alfabética pelo nome (pt-BR: acentos não bagunçam a ordenação).
  const list = [...(materials ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  const selected = list.find(m => m.id === selectedId) ?? null

  const items = list.map(m => ({
    id: m.id,
    label: m.name,
    sublabel: `${m.inStock} em estoque`,
    avatarUrl: m.photo,
    avatar: true,
  }))

  const set = (field: keyof MaterialFormState) => (value: string) => {
    setForm(current => ({ ...current, [field]: value }))
    if (field === 'name') setNameError('')
  }

  function selectMaterial(id: string) {
    const m = list.find(x => x.id === id)
    if (!m) return
    setForm(formFromMaterial(m))
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
      setNameError('Informe o nome do produto.')
      return
    }
    const payload = {
      name: form.name.trim(),
      photo: form.photo,
      inStock: Math.max(0, Number(form.inStock) || 0),
      minQuantity: Math.max(0, Number(form.minQuantity) || 0),
      // input date entrega 'aaaa-mm-dd'; o domínio guarda 'dd/mm/aaaa'.
      expiryDate: form.expiryDateIso ? form.expiryDateIso.split('-').reverse().join('/') : undefined,
      notes: form.notes.trim() || undefined,
      supplierIds: form.supplierIds,
    }
    const options = {
      onSuccess: () => {
        toast.success(selected ? 'Material atualizado!' : 'Material cadastrado!')
        handleCancel()
      },
    }
    if (selected) update({ id: selected.id, payload }, options)
    else create(payload, options)
  }

  return (
    <div className={styles.layout}>
      <SideList
        title="Materiais"
        size="lg"
        items={items}
        selectedId={creating ? null : selectedId}
        onSelect={id => selectMaterial(String(id))}
        onAdd={openNew}
        searchPlaceholder="Buscar material..."
        emptyText="Nenhum material cadastrado"
      />

      <div className={styles.formArea}>
        {!creating && !selected ? (
          <EmptyState
            title="Nenhum material selecionado"
            description="Selecione um material na lista ao lado, ou clique em + para cadastrar um novo."
          />
        ) : (
          <>
            <form id="form-material" className={styles.formRoot} onSubmit={handleSave}>
              <FormSection
                title={creating ? 'Novo material' : selected!.name}
                actions={selected && <Badge status={materialStatus(selected)} />}
              >
                <div className={styles.fields}>
                  <PhotoInput
                    label="Foto do material"
                    size="portrait"
                    value={form.photo}
                    onChange={url => setForm(current => ({ ...current, photo: url }))}
                    folder="materials"
                  />

                  <div className={styles.fieldStack}>
                    <Input
                      label="Nome do produto"
                      placeholder="Ex: Resina Fotopolimerizável A2"
                      value={form.name}
                      onChange={e => set('name')(e.target.value)}
                      error={nameError}
                      autoFocus
                    />
                    <div className={styles.grid2}>
                      <Input
                        label="Em estoque"
                        type="number"
                        min={0}
                        value={form.inStock}
                        onChange={e => set('inStock')(e.target.value)}
                      />
                      <Input
                        label="Qtd. mínima"
                        type="number"
                        min={0}
                        value={form.minQuantity}
                        onChange={e => set('minQuantity')(e.target.value)}
                      />
                    </div>
                    <Input
                      label="Validade"
                      type="date"
                      value={form.expiryDateIso}
                      onChange={e => set('expiryDateIso')(e.target.value)}
                    />
                    <Input
                      label="Observação"
                      placeholder="Ex: Lote 123"
                      value={form.notes}
                      onChange={e => set('notes')(e.target.value)}
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection
                title="Fornecedores"
                description="Um material pode ter mais de um fornecedor."
              >
                <MultiSelect
                  placeholder="Selecione os fornecedores…"
                  hint="Os escolhidos aparecem no campo. Cadastre novos em Administrativo → Fornecedores."
                  emptyMessage="Nenhum fornecedor cadastrado ainda. Cadastre em Administrativo → Fornecedores."
                  // O e-mail vai como linha secundária: é por ele que a Cibelly
                  // dispara pedido de orçamento, então fornecedor sem e-mail
                  // fica visível na hora de escolher, não na hora de precisar.
                  options={(suppliers ?? []).map(s => ({ value: s.id, label: s.name, meta: s.email }))}
                  value={form.supplierIds}
                  onChange={ids => setForm(f => ({ ...f, supplierIds: ids }))}
                />
              </FormSection>
            </form>

            <div className={styles.acoesBar}>
              <Button variant="ghost" onClick={handleCancel} disabled={creatingMut || saving}>Cancelar</Button>
              <Button type="submit" form="form-material" loading={creatingMut || saving}>
                {creating ? 'Cadastrar material' : 'Salvar'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
