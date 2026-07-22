import { useState } from 'react'
import type { FormEvent } from 'react'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { PhotoInput } from '@/components/PhotoInput/PhotoInput'
import { Pagination } from '@/components/Pagination/Pagination'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { useToast } from '@/components/Toast/useToast'
import { useMaterials, useCreateMaterial, useUpdateMaterial } from '@/hooks/useMaterials'
import { useDebounce } from '@/hooks/useDebounce'
import { matchesSearch } from '@/utils/search'
import { IconCashRegister, IconPlus, IconSearch, IconEdit } from '@/components/icons'
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
}

const EMPTY_FORM: MaterialFormState = {
  name: '', photo: undefined, inStock: '1', minQuantity: '1', expiryDateIso: '', notes: '',
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
  }
}

/** Aba "Materiais": tabela no padrão do projeto (por página + busca + paginação). */
export function MaterialsTab() {
  const toast = useToast()
  const { data: materials, isLoading } = useMaterials()
  const { mutate: create, isPending: creating } = useCreateMaterial()
  const { mutate: update, isPending: saving } = useUpdateMaterial()

  const [modalOpen, setModalOpen] = useState(false)
  // Material em edição — null significa que o modal é de cadastro novo.
  const [editing, setEditing] = useState<Material | null>(null)
  const [form, setForm] = useState<MaterialFormState>(EMPTY_FORM)
  const [nameError, setNameError] = useState('')

  // Paginação + busca (mesmo desenho da lista de pacientes).
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState('')

  const term = useDebounce(search)
  const filtered = (materials ?? []).filter(m =>
    matchesSearch(m.name, term) || matchesSearch(m.notes ?? '', term),
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  const set = (field: keyof MaterialFormState) => (value: string) => {
    setForm(current => ({ ...current, [field]: value }))
    if (field === 'name') setNameError('')
  }

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setNameError('')
    setModalOpen(true)
  }

  function openEdit(material: Material) {
    setEditing(material)
    setForm(formFromMaterial(material))
    setNameError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
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
    }
    const options = {
      onSuccess: () => {
        toast.success(editing ? 'Material atualizado!' : 'Material cadastrado!')
        closeModal()
      },
    }
    if (editing) update({ id: editing.id, payload }, options)
    else create(payload, options)
  }

  const columns: TableColumn<Material>[] = [
    {
      key: 'name',
      label: 'Material',
      render: m => (
        <span className={styles.materialCell}>
          {m.photo ? (
            <img src={m.photo} alt="" className={styles.thumb} />
          ) : (
            <span className={styles.semThumb}><IconCashRegister /></span>
          )}
          {m.name}
        </span>
      ),
    },
    { key: 'inStock',  label: 'Em estoque',  render: m => <>{m.inStock}</> },
    { key: 'minQuantity',  label: 'Qtd. mínima', render: m => <>{m.minQuantity}</> },
    { key: 'expiryDate',   label: 'Validade',    render: m => <>{m.expiryDate ?? '—'}</> },
    { key: 'notes', label: 'Observação',  render: m => <>{m.notes ?? '—'}</> },
    { key: 'status',     label: 'Status',      render: m => <Badge status={materialStatus(m)} /> },
    {
      key: 'actions',
      label: 'Ação',
      render: m => (
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<IconEdit />}
          title="Editar material"
          aria-label={`Editar ${m.name}`}
          onClick={() => openEdit(m)}
        />
      ),
    },
  ]

  return (
    <>
      {isLoading ? (
        <PageLoader />
      ) : (
        <Table
          columns={columns}
          data={visible}
          rowKey={m => m.id}
          emptyMessage={term ? 'Nenhum material encontrado para a busca.' : 'Nenhum material cadastrado.'}
          toolbar={
            <>
              <PerPageSelect perPage={perPage} onChange={n => { setPerPage(n); setPage(1) }} />
              <div className={styles.toolbarDireita}>
                <Input
                  size="sm"
                  iconLeft={<IconSearch />}
                  placeholder="Buscar material..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  aria-label="Buscar material"
                  className={styles.busca}
                />
                <Button size="sm" iconLeft={<IconPlus />} onClick={openNew}>
                  Novo material
                </Button>
              </div>
            </>
          }
          footer={
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onChange={setPage}
              totalItems={filtered.length}
              itemsPerPage={perPage}
            />
          }
        />
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar material' : 'Novo material'}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" form="form-new-material" loading={creating || saving}>
              {editing ? 'Salvar alterações' : 'Cadastrar material'}
            </Button>
          </>
        }
      >
        <form id="form-new-material" className={styles.form} onSubmit={handleSave}>
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

          <PhotoInput label="Foto do material" value={form.photo} onChange={url => setForm(current => ({ ...current, photo: url }))} folder="materials" />
        </form>
      </Modal>
    </>
  )
}
