import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Table } from '@/components/Table/Table'
import type { TableColumn } from '@/components/Table/Table'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { AddressFields } from '@/components/AddressFields/AddressFields'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Pagination } from '@/components/Pagination/Pagination'
import { useToast } from '@/components/Toast/useToast'
import { usePatients, useCreatePatient } from '@/hooks/usePatients'
import { IconPatients, IconEye, IconPlus, IconSearch, IconPhone, IconMessage } from '@/components/icons'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { buildRoute, SEX_OPTIONS } from '@/constants'
import { useDebounce } from '@/hooks/useDebounce'
import { initials, digitsOnly } from '@/utils/text'
import { matchesSearch } from '@/utils/search'
import type { Patient, Gender } from '@/types/domain'
import styles from './PatientsPage.module.scss'

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
  number: string
}

const EMPTY_FORM: PatientFormState = {
  firstName: '', lastName: '', sex: '', birthDateIso: '',
  email: '', phone: '', whatsapp: '',
  cep: '', state: '', city: '', neighborhood: '', number: '',
}

export function PatientsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data: patients, isLoading } = usePatients()
  const { mutate: create, isPending: creating } = useCreatePatient()

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<PatientFormState>(EMPTY_FORM)
  const [nameError, setNameError] = useState('')

  // Paginação + busca (mesmo desenho do PaymentsTable): tudo sobre a lista mock.
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState('')

  // Filtra pelo termo "estabilizado": não refiltra a cada tecla.
  const term = useDebounce(search)
  const searchDigits = digitsOnly(term)
  const filtered = (patients ?? []).filter(p =>
    // Nome ignora acento e partículas ("maria souza" acha "Maria de Souza");
    // telefone compara só os dígitos, com ou sem máscara.
    matchesSearch(p.name, term)
    || (searchDigits.length > 0 && digitsOnly(p.phone).includes(searchDigits)),
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  // Se a lista encolher (busca ou "por página"), não fica em página fantasma.
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

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

  const columns: TableColumn<Patient>[] = [
    {
      key: 'name',
      label: 'Nome',
      render: p => (
        <span className={styles.pacienteCell}>
          <span className={styles.avatar}>
            {p.photo ? <img src={p.photo} alt="" className={styles.avatarImg} /> : initials(p.name)}
          </span>
          {p.name}
        </span>
      ),
    },
    { key: 'phone',     label: 'Telefone' },
    { key: 'insurance', label: 'Convênio' },
    { key: 'lastVisit', label: 'Última visita' },
    { key: 'status',    label: 'Status', render: p => <Badge status={p.status} /> },
    {
      key: 'actions',
      label: 'Ação',
      render: p => (
        <span className={styles.acoesLinha}>
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<IconPhone />}
            disabled={!p.phone}
            title="Ligar"
            aria-label={`Ligar para ${p.name}`}
            onClick={e => {
              e.stopPropagation()
              window.location.href = `tel:+55${p.phone.replace(/\D/g, '')}`
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<IconMessage />}
            disabled={!(p.whatsapp ?? p.phone)}
            title="Chamar no WhatsApp"
            aria-label={`Chamar ${p.name} no WhatsApp`}
            onClick={e => {
              e.stopPropagation()
              // WhatsApp cadastrado ou o próprio celular.
              window.open(`https://wa.me/55${(p.whatsapp ?? p.phone).replace(/\D/g, '')}`, '_blank')
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<IconEye />}
            title="Ver perfil"
            aria-label={`Ver perfil de ${p.name}`}
            onClick={e => {
              e.stopPropagation()   // a linha inteira também navega — evita disparo duplo
              navigate(buildRoute.patientProfile(p.id))
            }}
          />
        </span>
      ),
    },
  ]

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

      {/* O cabeçalho fica sempre no lugar; só o conteúdo troca pelo loader. */}
      {isLoading ? (
        <PageLoader />
      ) : (
        <Table
          columns={columns}
          data={visible}
          rowKey={p => p.id}
          onRowClick={p => navigate(buildRoute.patientProfile(p.id))}
          emptyMessage={term ? 'Nenhum paciente encontrado para a busca.' : 'Nenhum paciente cadastrado.'}
          toolbar={
            <>
              <PerPageSelect perPage={perPage} onChange={n => { setPerPage(n); setPage(1) }} />
              <Input
                size="sm"
                iconLeft={<IconSearch />}
                placeholder="Buscar paciente..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                aria-label="Buscar paciente"
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
            {/* CEP autopreenche estado/cidade/bairro (paciente não guarda rua). */}
            <AddressFields
              value={form}
              onChange={(field, value) => set(field as keyof PatientFormState)(value)}
              showStreet={false}
            />
          </section>
        </form>
      </Modal>
    </>
  )
}
