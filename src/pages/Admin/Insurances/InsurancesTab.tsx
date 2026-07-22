import { useState } from 'react'
import type { FormEvent } from 'react'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { Textarea } from '@/components/Textarea/Textarea'
import { Toggle } from '@/components/Toggle/Toggle'
import { useToast } from '@/components/Toast/useToast'
import { useInsurances, useCreateInsurance, useUpdateInsurance } from '@/hooks/useInsurances'
import { useDebounce } from '@/hooks/useDebounce'
import { matchesSearch } from '@/utils/search'
import { IconSearch, IconEdit, IconPlus } from '@/components/icons'
import type { EditInsurance } from '@/services/insurancesService'
import type { Insurance } from '@/types/domain'
import styles from './InsurancesTab.module.scss'

interface InsuranceFormState {
  name: string
  ans: string
  phone: string
  email: string
  payoutDays: string      // texto do input; vira número ao salvar
  notes: string
  active: boolean
}

const EMPTY_FORM: InsuranceFormState = {
  name: '', ans: '', phone: '', email: '', payoutDays: '', notes: '', active: true,
}

function formFromInsurance(c: Insurance): InsuranceFormState {
  return {
    name: c.name,
    ans: c.ans ?? '',
    phone: c.phone ?? '',
    email: c.email ?? '',
    payoutDays: c.payoutDays != null ? String(c.payoutDays) : '',
    notes: c.notes ?? '',
    active: c.status === 'active',
  }
}

/** Aba "Convênios": cadastro dos planos aceitos — os selects de convênio do
 *  app (paciente, orçamentos) montam as opções a partir daqui. */
export function InsurancesTab() {
  const toast = useToast()
  const { data: insurances, isLoading } = useInsurances()
  const { mutate: create, isPending: creating } = useCreateInsurance()
  const { mutate: update, isPending: saving } = useUpdateInsurance()

  // Modal: null = fechado; com convênio = edição; sem = cadastro novo.
  const [modal, setModal] = useState<{ insurance?: Insurance } | null>(null)
  const [form, setForm] = useState<InsuranceFormState>(EMPTY_FORM)
  const [nameError, setNameError] = useState('')

  // Paginação + busca (mesmo desenho das outras listas).
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState('')

  // Hook: fica ANTES do return condicional (ordem dos hooks em todo render).
  const term = useDebounce(search)

  if (isLoading) return <PageLoader />

  const filtered = (insurances ?? []).filter(c => matchesSearch(c.name, term))
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  const set = (field: keyof InsuranceFormState) => (value: string | boolean) => {
    setForm(current => ({ ...current, [field]: value }))
    if (field === 'name') setNameError('')
  }

  function openNew() {
    setForm(EMPTY_FORM)
    setNameError('')
    setModal({})
  }

  function openEdit(insurance: Insurance) {
    setForm(formFromInsurance(insurance))
    setNameError('')
    setModal({ insurance })
  }

  function closeModal() {
    setModal(null)
    setForm(EMPTY_FORM)
    setNameError('')
  }

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setNameError('Informe o nome do convênio.')
      return
    }
    const payload: EditInsurance = {
      name: form.name.trim(),
      ans: form.ans.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      payoutDays: form.payoutDays.trim() ? Math.max(0, Number(form.payoutDays) || 0) : undefined,
      notes: form.notes.trim() || undefined,
      status: form.active ? 'active' : 'inactive',
    }
    const options = {
      onSuccess: () => {
        toast.success(modal?.insurance ? 'Convênio atualizado!' : 'Convênio cadastrado!')
        closeModal()
      },
    }
    if (modal?.insurance) update({ id: modal.insurance.id, payload }, options)
    else create(payload, options)
  }

  const columns: TableColumn<Insurance>[] = [
    { key: 'name', label: 'Convênio', render: c => <span className={styles.nome}>{c.name}</span> },
    { key: 'ans', label: 'Registro ANS', render: c => c.ans ?? '—' },
    { key: 'phone', label: 'Telefone', render: c => c.phone ?? '—' },
    {
      key: 'payoutDays',
      label: 'Prazo de repasse',
      render: c => (c.payoutDays != null ? `${c.payoutDays} dias` : '—'),
    },
    { key: 'status', label: 'Status', render: c => <Badge status={c.status} /> },
    {
      key: 'actions',
      label: 'Ação',
      render: c => (
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<IconEdit />}
          title="Editar convênio"
          aria-label={`Editar ${c.name}`}
          onClick={() => openEdit(c)}
        />
      ),
    },
  ]

  return (
    <>
      <Table
        columns={columns}
        data={visible}
        rowKey={c => c.id}
        emptyMessage={term ? 'Nenhum convênio encontrado para a busca.' : 'Nenhum convênio cadastrado.'}
        toolbar={
          <>
            <PerPageSelect perPage={perPage} onChange={n => { setPerPage(n); setPage(1) }} />
            <div className={styles.toolbarDireita}>
              <Input
                size="sm"
                iconLeft={<IconSearch />}
                placeholder="Buscar convênio..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                aria-label="Buscar convênio"
                className={styles.busca}
              />
              <Button size="sm" iconLeft={<IconPlus />} onClick={openNew}>
                Novo convênio
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

      <Modal
        open={modal !== null}
        onClose={closeModal}
        title={modal?.insurance ? 'Editar convênio' : 'Novo convênio'}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={creating || saving}>Cancelar</Button>
            <Button type="submit" form="form-insurance" loading={creating || saving}>
              {modal?.insurance ? 'Salvar alterações' : 'Cadastrar'}
            </Button>
          </>
        }
      >
        <form id="form-insurance" className={styles.form} onSubmit={handleSave}>
          <Input
            label="Nome do convênio"
            placeholder="Ex: Unimed"
            value={form.name}
            onChange={e => set('name')(e.target.value)}
            error={nameError}
            autoFocus
          />
          <div className={styles.grid2}>
            <Input
              label="Registro ANS"
              placeholder="Ex: 30.437-3"
              value={form.ans}
              onChange={e => set('ans')(e.target.value)}
            />
            <Input
              label="Prazo de repasse (dias)"
              type="number"
              min={0}
              placeholder="Ex: 30"
              value={form.payoutDays}
              onChange={e => set('payoutDays')(e.target.value)}
            />
          </div>
          <div className={styles.grid2}>
            <Input
              label="Telefone"
              type="tel"
              value={form.phone}
              onChange={e => set('phone')(e.target.value)}
            />
            <Input
              label="E-mail"
              type="email"
              value={form.email}
              onChange={e => set('email')(e.target.value)}
            />
          </div>
          <Textarea
            label="Observações"
            placeholder="Regras de credenciamento, tabelas, contatos..."
            rows={3}
            value={form.notes}
            onChange={e => set('notes')(e.target.value)}
          />
          <Toggle label="Convênio ativo" checked={form.active} onChange={v => set('active')(v)} />
        </form>
      </Modal>
    </>
  )
}
