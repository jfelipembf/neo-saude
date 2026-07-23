import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Tabs } from '@/components/Tabs/Tabs'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { AddressFields } from '@/components/AddressFields/AddressFields'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Pagination } from '@/components/Pagination/Pagination'
import { useToast } from '@/components/Toast/useToast'
import { usePatients, useCreatePatient } from '@/hooks/usePatients'
import { useLeads } from '@/hooks/useLeads'
import { IconPatients, IconEye, IconPlus, IconSearch, IconPhone, IconMessage } from '@/components/icons'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { buildRoute, SEX_OPTIONS, LEAD_STATUS_LABEL } from '@/constants'
import { useDebounce } from '@/hooks/useDebounce'
import { initials, digitsOnly } from '@/utils/text'
import { matchesSearch } from '@/utils/search'
import type { Gender, LeadStatus } from '@/types/domain'
import styles from './PatientsPage.module.scss'

/** Aba ativa da lista: todos, só pacientes ou só leads. */
type ContactView = 'all' | 'patients' | 'leads'

/** Linha unificada da lista (paciente ou lead) — mesma tabela para as 3 abas. */
interface ContactRow {
  id: string
  kind: 'patient' | 'lead'
  name: string
  phone: string
  whatsapp?: string
  photo?: string
  status: string        // paciente (active/inactive) OU lead (funil)
  insurance?: string
  lastVisit?: string
  source?: string
  interest?: string
}

interface PatientFormState {
  firstName: string
  lastName: string
  sex: Gender | ''
  birthDateIso: string   // aaaa-mm-dd (input date)
  email: string
  phone: string
  whatsapp: string
  cep: string
  state: string
  city: string
  neighborhood: string
  street: string
  number: string
}

const EMPTY_FORM: PatientFormState = {
  firstName: '', lastName: '', sex: '', birthDateIso: '',
  email: '', phone: '', whatsapp: '',
  cep: '', state: '', city: '', neighborhood: '', street: '', number: '',
}

export function PatientsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data: patients, isLoading } = usePatients()
  const { data: leads, isLoading: loadingLeads } = useLeads()
  const { mutate: create, isPending: creating } = useCreatePatient()

  const [view, setView] = useState<ContactView>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<PatientFormState>(EMPTY_FORM)
  const [nameError, setNameError] = useState('')

  // Paginação + busca — tudo client-side sobre a lista da aba atual.
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState('')

  // Fontes → modelo unificado (paciente ou lead).
  const patientRows: ContactRow[] = (patients ?? []).map(p => ({
    id: p.id, kind: 'patient', name: p.name, phone: p.phone, whatsapp: p.whatsapp,
    photo: p.photo, status: p.status, insurance: p.insurance, lastVisit: p.lastVisit,
  }))
  const leadRows: ContactRow[] = (leads ?? []).map(l => ({
    id: l.id, kind: 'lead', name: l.name, phone: l.phone,
    status: l.status, source: l.source, interest: l.interest,
  }))
  const rows = view === 'patients' ? patientRows
    : view === 'leads' ? leadRows
    : [...patientRows, ...leadRows]

  const viewTabs = [
    { key: 'all',      label: `Todos (${patientRows.length + leadRows.length})` },
    { key: 'patients', label: `Pacientes (${patientRows.length})` },
    { key: 'leads',    label: `Leads (${leadRows.length})` },
  ]

  // Filtra pelo termo "estabilizado": não refiltra a cada tecla.
  const term = useDebounce(search)
  const searchDigits = digitsOnly(term)
  const filtered = rows.filter(r =>
    // Nome ignora acento e partículas; telefone compara só os dígitos.
    matchesSearch(r.name, term)
    || (searchDigits.length > 0 && digitsOnly(r.phone).includes(searchDigits)),
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  // Se a lista encolher (busca, troca de aba, "por página"), não fica em página fantasma.
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  /** Abre o alvo: paciente → perfil do paciente; lead → perfil do lead. */
  function openContact(row: ContactRow) {
    navigate(row.kind === 'patient' ? buildRoute.patientProfile(row.id) : buildRoute.leadProfile(row.id))
  }

  const set = (field: keyof PatientFormState) => (value: string) => {
    setForm(current => ({ ...current, [field]: value }))
    if (field === 'firstName') setNameError('')
  }

  function closeModal() {
    setModalOpen(false)
    setForm(EMPTY_FORM)
    setNameError('')
  }

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!form.firstName.trim()) {
      setNameError('Informe o nome do paciente.')
      return
    }
    create(
      {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        sex: form.sex || undefined,
        // input date entrega 'aaaa-mm-dd'; o domínio guarda 'dd/mm/aaaa'.
        birthDate: form.birthDateIso ? form.birthDateIso.split('-').reverse().join('/') : undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim() || undefined,
        cep: form.cep.trim() || undefined,
        state: form.state.trim().toUpperCase() || undefined,
        city: form.city.trim() || undefined,
        neighborhood: form.neighborhood.trim() || undefined,
        street: form.street.trim() || undefined,
        number: form.number.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Paciente cadastrado!')
          closeModal()
        },
      },
    )
  }

  const nameCell = (r: ContactRow) => (
    <span className={styles.pacienteCell}>
      <span className={styles.avatar}>
        {r.photo ? <img src={r.photo} alt="" className={styles.avatarImg} /> : initials(r.name)}
      </span>
      {r.name}
    </span>
  )

  // Etapa do funil — só faz sentido para lead (paciente não tem "situação").
  const etapaCell = (r: ContactRow) => (
    <span className={styles.leadStatus}>{LEAD_STATUS_LABEL[r.status as LeadStatus]}</span>
  )

  const tipoCell = (r: ContactRow) => (
    <span className={`${styles.tipo} ${r.kind === 'lead' ? styles['tipo--lead'] : ''}`}>
      {r.kind === 'lead' ? 'Lead' : 'Paciente'}
    </span>
  )

  const actionsCell = (r: ContactRow) => (
    <span className={styles.acoesLinha}>
      <Button
        variant="ghost" size="sm" iconLeft={<IconPhone />} disabled={!r.phone} title="Ligar"
        aria-label={`Ligar para ${r.name}`}
        onClick={e => { e.stopPropagation(); window.location.href = `tel:+55${digitsOnly(r.phone)}` }}
      />
      <Button
        variant="ghost" size="sm" iconLeft={<IconMessage />} disabled={!(r.whatsapp ?? r.phone)}
        title="Chamar no WhatsApp" aria-label={`Chamar ${r.name} no WhatsApp`}
        onClick={e => { e.stopPropagation(); window.open(`https://wa.me/55${digitsOnly(r.whatsapp ?? r.phone)}`, '_blank') }}
      />
      <Button
        variant="ghost" size="sm" iconLeft={<IconEye />}
        title={r.kind === 'patient' ? 'Ver perfil' : 'Ver contato'}
        aria-label={`Ver ${r.name}`}
        onClick={e => { e.stopPropagation(); openContact(r) }}
      />
    </span>
  )

  const nameCol: TableColumn<ContactRow> = { key: 'name', label: 'Nome', render: nameCell }
  const phoneCol: TableColumn<ContactRow> = { key: 'phone', label: 'Telefone', render: r => r.phone }
  const actionsCol: TableColumn<ContactRow> = { key: 'actions', label: 'Ação', render: actionsCell }

  const columns: TableColumn<ContactRow>[] =
    view === 'patients'
      ? [nameCol, phoneCol,
         { key: 'insurance', label: 'Convênio', render: r => r.insurance || '—' },
         { key: 'lastVisit', label: 'Última visita', render: r => r.lastVisit || '—' },
         actionsCol]
      : view === 'leads'
        ? [nameCol, phoneCol,
           { key: 'source', label: 'Origem', render: r => r.source || '—' },
           { key: 'interest', label: 'Interesse', render: r => r.interest || '—' },
           { key: 'stage', label: 'Etapa', render: etapaCell },
           actionsCol]
        : [nameCol, phoneCol,
           { key: 'tipo', label: 'Tipo', render: tipoCell },
           actionsCol]

  return (
    <>
      <PageHeader
        title="Pacientes"
        icon={<IconPatients />}
        actions={
          <Button iconLeft={<IconPlus />} onClick={() => setModalOpen(true)}>
            Novo paciente
          </Button>
        }
      />

      <Tabs
        tabs={viewTabs}
        active={view}
        onChange={key => { setView(key as ContactView); setPage(1) }}
      />

      {/* Afasta a lista das abas; só o conteúdo troca pelo loader. */}
      <div className={styles.conteudo}>
      {isLoading || loadingLeads ? (
        <PageLoader />
      ) : (
        <Table
          columns={columns}
          data={visible}
          rowKey={r => `${r.kind}-${r.id}`}
          onRowClick={openContact}
          emptyMessage={
            term ? 'Nenhum resultado para a busca.'
              : view === 'leads' ? 'Nenhum lead cadastrado.'
                : view === 'patients' ? 'Nenhum paciente cadastrado.'
                  : 'Nenhum paciente ou lead ainda.'
          }
          toolbar={
            <>
              <PerPageSelect perPage={perPage} onChange={n => { setPerPage(n); setPage(1) }} />
              <Input
                size="sm"
                iconLeft={<IconSearch />}
                placeholder="Buscar por nome ou telefone..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                aria-label="Buscar"
                className={styles.busca}
              />
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
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="Novo paciente"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" form="form-novo-paciente" loading={creating}>
              Cadastrar paciente
            </Button>
          </>
        }
      >
        <form id="form-novo-paciente" className={styles.form} onSubmit={handleCreate}>
          <section className={styles.formSection}>
            <h3>Dados pessoais</h3>
            <div className={styles.grid2}>
              <Input
                label="Nome"
                placeholder="Maria"
                value={form.firstName}
                onChange={e => set('firstName')(e.target.value)}
                error={nameError}
                autoFocus
              />
              <Input
                label="Sobrenome"
                placeholder="Oliveira"
                value={form.lastName}
                onChange={e => set('lastName')(e.target.value)}
              />
            </div>
            <div className={styles.grid2}>
              <Select
                label="Sexo"
                options={SEX_OPTIONS}
                placeholder="Selecione..."
                value={form.sex}
                onChange={e => set('sex')(e.target.value)}
              />
              <Input
                label="Data de nascimento"
                type="date"
                value={form.birthDateIso}
                onChange={e => set('birthDateIso')(e.target.value)}
              />
            </div>
          </section>

          <section className={styles.formSection}>
            <h3>Contato</h3>
            <Input
              label="E-mail"
              type="email"
              placeholder="maria@email.com"
              value={form.email}
              onChange={e => set('email')(e.target.value)}
            />
            <div className={styles.grid2}>
              <Input
                label="Telefone"
                type="tel"
                placeholder="(79) 3200-0000"
                value={form.phone}
                onChange={e => set('phone')(e.target.value)}
              />
              <Input
                label="WhatsApp"
                type="tel"
                placeholder="(79) 99999-0000"
                value={form.whatsapp}
                onChange={e => set('whatsapp')(e.target.value)}
              />
            </div>
          </section>

          <section className={styles.formSection}>
            <h3>Endereço</h3>
            {/* CEP autopreenche estado/cidade/bairro/rua (ViaCEP); a rua é
                exigida em documento impresso e na NFS-e. */}
            <AddressFields
              value={form}
              onChange={(field, value) => set(field as keyof PatientFormState)(value)}
            />
          </section>
        </form>
      </Modal>
    </>
  )
}
