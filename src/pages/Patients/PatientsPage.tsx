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
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Pagination } from '@/components/Pagination/Pagination'
import { useToast } from '@/components/Toast/useToast'
import { usePacientes, useCriarPaciente } from '@/hooks/usePacientes'
import { IconPacientes, IconOlho, IconMais, IconBuscar } from '@/components/icons'
import { buildRoute, OPCOES_POR_PAGINA, OPCOES_SEXO } from '@/constants'
import type { Paciente, SexoPaciente } from '@/types/domain'
import styles from './PatientsPage.module.scss'

interface FormPaciente {
  nome: string
  sobrenome: string
  sexo: SexoPaciente | ''
  nascimentoIso: string   // aaaa-mm-dd (input date)
  email: string
  telefone: string
  whatsapp: string
  cep: string
  estado: string
  cidade: string
  bairro: string
  numero: string
}

const FORM_VAZIO: FormPaciente = {
  nome: '', sobrenome: '', sexo: '', nascimentoIso: '',
  email: '', telefone: '', whatsapp: '',
  cep: '', estado: '', cidade: '', bairro: '', numero: '',
}

/** Iniciais para o círculo de foto (primeiro + último nome). */
function initials(nome: string) {
  const partes = nome.split(' ').filter(Boolean)
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primeira + ultima).toUpperCase()
}

export function PatientsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data: pacientes, isLoading } = usePacientes()
  const { mutate: criar, isPending: criando } = useCriarPaciente()

  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState<FormPaciente>(FORM_VAZIO)
  const [erroNome, setErroNome] = useState('')

  // Paginação + busca (mesmo desenho do PaymentsTable): tudo sobre a lista mock.
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [busca, setBusca] = useState('')

  const termo = busca.trim().toLowerCase()
  const filtrados = (pacientes ?? []).filter(p =>
    !termo || p.nome.toLowerCase().includes(termo) || p.telefone.includes(termo),
  )

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina))
  // Se a lista encolher (busca ou "por página"), não fica em página fantasma.
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = filtrados.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina)

  const set = (campo: keyof FormPaciente) => (valor: string) => {
    setForm(atual => ({ ...atual, [campo]: valor }))
    if (campo === 'nome') setErroNome('')
  }

  function fecharModal() {
    setModalAberto(false)
    setForm(FORM_VAZIO)
    setErroNome('')
  }

  function aoCriar(e: FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) {
      setErroNome('Informe o nome do paciente.')
      return
    }
    criar(
      {
        nome: form.nome.trim(),
        sobrenome: form.sobrenome.trim(),
        sexo: form.sexo || undefined,
        // input date entrega 'aaaa-mm-dd'; o domínio guarda 'dd/mm/aaaa'.
        nascimento: form.nascimentoIso ? form.nascimentoIso.split('-').reverse().join('/') : undefined,
        email: form.email.trim() || undefined,
        telefone: form.telefone.trim(),
        whatsapp: form.whatsapp.trim() || undefined,
        cep: form.cep.trim() || undefined,
        estado: form.estado.trim().toUpperCase() || undefined,
        cidade: form.cidade.trim() || undefined,
        bairro: form.bairro.trim() || undefined,
        numero: form.numero.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Paciente cadastrado!')
          fecharModal()
        },
      },
    )
  }

  const columns: TableColumn<Paciente>[] = [
    {
      key: 'nome',
      label: 'Nome',
      render: p => (
        <span className={styles.pacienteCell}>
          <span className={styles.avatar}>{initials(p.nome)}</span>
          {p.nome}
        </span>
      ),
    },
    { key: 'telefone',     label: 'Telefone' },
    { key: 'convenio',     label: 'Convênio' },
    { key: 'ultimaVisita', label: 'Última visita' },
    { key: 'status',       label: 'Status', render: p => <Badge status={p.status} /> },
    {
      key: 'acoes',
      label: '',
      render: p => (
        <Button
          variant="outline"
          size="sm"
          iconLeft={<IconOlho />}
          onClick={e => {
            e.stopPropagation()   // a linha inteira também navega — evita disparo duplo
            navigate(buildRoute.pacientePerfil(p.id))
          }}
        >
          Ver
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Pacientes"
        icon={<IconPacientes />}
        actions={
          <Button iconLeft={<IconMais />} onClick={() => setModalAberto(true)}>
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
          data={visiveis}
          rowKey={p => p.id}
          onRowClick={p => navigate(buildRoute.pacientePerfil(p.id))}
          emptyMessage={termo ? 'Nenhum paciente encontrado para a busca.' : 'Nenhum paciente cadastrado.'}
          toolbar={
            <>
              <Select
                size="sm"
                options={OPCOES_POR_PAGINA}
                value={String(porPagina)}
                onChange={e => { setPorPagina(Number(e.target.value)); setPagina(1) }}
                aria-label="Registros por página"
                className={styles.porPagina}
              />
              <Input
                size="sm"
                iconLeft={<IconBuscar />}
                placeholder="Buscar paciente..."
                value={busca}
                onChange={e => { setBusca(e.target.value); setPagina(1) }}
                aria-label="Buscar paciente"
                className={styles.busca}
              />
            </>
          }
          footer={
            <Pagination
              page={paginaAtual}
              totalPages={totalPaginas}
              onChange={setPagina}
              totalItems={filtrados.length}
              itemsPerPage={porPagina}
            />
          }
        />
      )}

      <Modal
        open={modalAberto}
        onClose={fecharModal}
        title="Novo paciente"
        footer={
          <>
            <Button variant="ghost" onClick={fecharModal}>Cancelar</Button>
            <Button type="submit" form="form-novo-paciente" loading={criando}>
              Cadastrar paciente
            </Button>
          </>
        }
      >
        <form id="form-novo-paciente" className={styles.form} onSubmit={aoCriar}>
          <section className={styles.formSection}>
            <h3>Dados pessoais</h3>
            <div className={styles.grid2}>
              <Input
                label="Nome"
                placeholder="Maria"
                value={form.nome}
                onChange={e => set('nome')(e.target.value)}
                error={erroNome}
                autoFocus
              />
              <Input
                label="Sobrenome"
                placeholder="Oliveira"
                value={form.sobrenome}
                onChange={e => set('sobrenome')(e.target.value)}
              />
            </div>
            <div className={styles.grid2}>
              <Select
                label="Sexo"
                options={OPCOES_SEXO}
                placeholder="Selecione..."
                value={form.sexo}
                onChange={e => set('sexo')(e.target.value)}
              />
              <Input
                label="Data de nascimento"
                type="date"
                value={form.nascimentoIso}
                onChange={e => set('nascimentoIso')(e.target.value)}
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
                value={form.telefone}
                onChange={e => set('telefone')(e.target.value)}
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
            <div className={styles.grid2}>
              <Input
                label="CEP"
                placeholder="49000-000"
                value={form.cep}
                onChange={e => set('cep')(e.target.value)}
              />
              <Input
                label="Estado"
                placeholder="SE"
                maxLength={2}
                value={form.estado}
                onChange={e => set('estado')(e.target.value)}
              />
            </div>
            <div className={styles.grid2}>
              <Input
                label="Cidade"
                placeholder="Aracaju"
                value={form.cidade}
                onChange={e => set('cidade')(e.target.value)}
              />
              <Input
                label="Bairro"
                placeholder="Centro"
                value={form.bairro}
                onChange={e => set('bairro')(e.target.value)}
              />
            </div>
            <div className={styles.grid2}>
              <Input
                label="Número"
                placeholder="123"
                value={form.numero}
                onChange={e => set('numero')(e.target.value)}
              />
            </div>
          </section>
        </form>
      </Modal>
    </>
  )
}
