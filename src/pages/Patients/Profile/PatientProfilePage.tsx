import { lazy, Suspense, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Select } from '@/components/Select/Select'
import { Tabs } from '@/components/Tabs/Tabs'
import { PaymentsTable } from '@/components/PaymentsTable/PaymentsTable'

// Chunk próprio: o odontograma embutido (~940 KB) só baixa ao abrir a aba Tratamento.
const TreatmentsPanel = lazy(() =>
  import('@/components/TreatmentsPanel/TreatmentsPanel').then(m => ({ default: m.TreatmentsPanel })),
)
import { AppointmentsTimeline } from '@/components/AppointmentsTimeline/AppointmentsTimeline'
import { DocumentsUpload } from '@/components/DocumentsUpload/DocumentsUpload'
import { useToast } from '@/components/Toast/useToast'
import { OPCOES_SEXO, SEXO_LABEL } from '@/constants'
import { queryKeys } from '@/lib/queryKeys'
import { getPaciente } from '@/services/pacientesService'
import { useAtualizarPaciente } from '@/hooks/usePacientes'
import { IconUsuario, IconEditar, IconTelefone, IconMensagem, IconEmail } from '@/components/icons'
import type { Paciente, SexoPaciente } from '@/types/domain'
import styles from './PatientProfilePage.module.scss'

const OPCOES_CONVENIO = [
  { value: 'Particular', label: 'Particular' },
  { value: 'Unimed',     label: 'Unimed' },
  { value: 'Bradesco',   label: 'Bradesco' },
  { value: 'SulAmérica', label: 'SulAmérica' },
  { value: 'Amil',       label: 'Amil' },
  { value: 'Outro',      label: 'Outro' },
]

type TabKey = 'dados' | 'tratamento' | 'pagamentos' | 'consultas' | 'documentos'

const TABS = [
  { key: 'dados',      label: 'Dados pessoais' },
  { key: 'tratamento', label: 'Tratamento' },
  { key: 'pagamentos', label: 'Pagamentos' },
  { key: 'consultas',  label: 'Minhas consultas' },
  { key: 'documentos', label: 'Documentos' },
]

interface FormPaciente {
  nome: string
  sobrenome: string
  sexo: SexoPaciente | ''
  nascimentoIso: string   // aaaa-mm-dd (input date)
  email: string
  telefone: string
  whatsapp: string
  convenio: string
  cep: string
  estado: string
  cidade: string
  bairro: string
  numero: string
}

/** Monta o formulário a partir do cadastro atual (nome completo → nome + sobrenome). */
function formDoPaciente(p: Paciente): FormPaciente {
  const [nome, ...sobrenome] = p.nome.split(' ')
  return {
    nome,
    sobrenome: sobrenome.join(' '),
    sexo: p.sexo ?? '',
    nascimentoIso: p.nascimento ? p.nascimento.split('/').reverse().join('-') : '',
    email: p.email ?? '',
    telefone: p.telefone,
    whatsapp: p.whatsapp ?? '',
    convenio: p.convenio,
    cep: p.cep ?? '',
    estado: p.estado ?? '',
    cidade: p.cidade ?? '',
    bairro: p.bairro ?? '',
    numero: p.numero ?? '',
  }
}

/** Iniciais para o círculo de foto (primeiro + último nome). */
function initials(nome: string) {
  const partes = nome.split(' ').filter(Boolean)
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primeira + ultima).toUpperCase()
}

export function PatientProfilePage() {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()

  const { data: paciente, isLoading } = useQuery({
    queryKey: queryKeys.pacientes.detail(id ?? ''),
    queryFn: () => getPaciente(id ?? ''),
    enabled: Boolean(id),
  })
  const { mutate: salvar, isPending: salvando } = useAtualizarPaciente()

  const [tab, setTab] = useState<TabKey>('dados')
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState<FormPaciente | null>(null)
  const [erroNome, setErroNome] = useState('')

  // Zona de cabeçalho compartilhada: fica no lugar em QUALQUER estado da página
  // (carregando, não encontrado, conteúdo) — o breadcrumb nunca pula.
  const cabecalho = (
    <header className={styles.topo}>
      <PageHeader title="Perfil do paciente" icon={<IconUsuario />} />
      <Tabs tabs={TABS} active={tab} onChange={mudarTab} />
    </header>
  )

  if (isLoading) {
    return <>{cabecalho}<PageLoader /></>
  }

  if (!paciente) {
    return (
      <>
        {cabecalho}
        <EmptyState title="Paciente não encontrado" description="Verifique se o link está correto." />
      </>
    )
  }

  const set = (campo: keyof FormPaciente) => (valor: string) => {
    setForm(atual => (atual ? { ...atual, [campo]: valor } : atual))
    if (campo === 'nome') setErroNome('')
  }

  function abrirEdicao() {
    setForm(formDoPaciente(paciente!))
    setErroNome('')
    setEditando(true)
    setTab('dados')   // a edição vive na aba de dados pessoais
  }

  function fecharEdicao() {
    setEditando(false)
    setForm(null)
    setErroNome('')
  }

  // Trocar de aba no meio de uma edição descarta o rascunho.
  function mudarTab(key: string) {
    setTab(key as TabKey)
    if (key !== 'dados') fecharEdicao()
  }

  function aoSalvar(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    if (!form.nome.trim()) {
      setErroNome('Informe o nome do paciente.')
      return
    }
    salvar(
      {
        id: paciente!.id,
        dados: {
          nome: form.nome.trim(),
          sobrenome: form.sobrenome.trim(),
          sexo: form.sexo || undefined,
          nascimento: form.nascimentoIso ? form.nascimentoIso.split('-').reverse().join('/') : undefined,
          email: form.email.trim() || undefined,
          telefone: form.telefone.trim(),
          whatsapp: form.whatsapp.trim() || undefined,
          convenio: form.convenio,
          cep: form.cep.trim() || undefined,
          estado: form.estado.trim().toUpperCase() || undefined,
          cidade: form.cidade.trim() || undefined,
          bairro: form.bairro.trim() || undefined,
          numero: form.numero.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Dados atualizados!')
          fecharEdicao()
        },
      },
    )
  }

  const endereco = [paciente.cidade, paciente.estado].filter(Boolean).join('/')

  const contatos = [
    { label: 'Telefone', valor: paciente.telefone, icone: <IconTelefone /> },
    { label: 'WhatsApp', valor: paciente.whatsapp, icone: <IconMensagem /> },
    { label: 'E-mail',   valor: paciente.email,    icone: <IconEmail /> },
  ]

  const pares: { label: string; valor?: string }[] = [
    { label: 'Sexo',          valor: paciente.sexo ? SEXO_LABEL[paciente.sexo] : undefined },
    { label: 'Nascimento',    valor: paciente.nascimento },
    { label: 'Última visita', valor: paciente.ultimaVisita },
    { label: 'CEP',           valor: paciente.cep },
  ]

  // Cadastro completo, exibido na aba "Dados pessoais" (modo leitura).
  const secoesDetalhe = [
    {
      titulo: 'Identificação',
      itens: [
        { label: 'Nome completo', valor: paciente.nome },
        { label: 'Sexo',          valor: paciente.sexo ? SEXO_LABEL[paciente.sexo] : undefined },
        { label: 'Nascimento',    valor: paciente.nascimento },
        { label: 'Convênio',      valor: paciente.convenio },
        { label: 'Última visita', valor: paciente.ultimaVisita },
      ],
    },
    {
      titulo: 'Contato',
      itens: [
        { label: 'Telefone', valor: paciente.telefone },
        { label: 'WhatsApp', valor: paciente.whatsapp },
        { label: 'E-mail',   valor: paciente.email },
      ],
    },
    {
      titulo: 'Endereço',
      itens: [
        { label: 'CEP',    valor: paciente.cep },
        { label: 'Estado', valor: paciente.estado },
        { label: 'Cidade', valor: paciente.cidade },
        { label: 'Bairro', valor: paciente.bairro },
        { label: 'Número', valor: paciente.numero },
      ],
    },
  ]

  return (
    <>
      {cabecalho}

      <div className={styles.grid}>
        {/* ── Card-resumo (lateral esquerda) ── */}
        <section className={styles.resumo} aria-label="Resumo do paciente">
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<IconEditar />}
            className={styles.editBtn}
            onClick={abrirEdicao}
            title="Editar cadastro"
            aria-label="Editar cadastro do paciente"
          />

          <div className={styles.identidade}>
            <span className={styles.avatar}>{initials(paciente.nome)}</span>
            <h2 className={styles.nome}>{paciente.nome}</h2>
            <p className={styles.subtitulo}>
              {[paciente.convenio, endereco].filter(Boolean).join(' · ')}
            </p>
          </div>

          <div className={styles.bloco}>
            <h3 className={styles.blocoTitulo}>Contato</h3>
            <ul className={styles.contatos}>
              {contatos.map(c => (
                <li key={c.label} className={styles.contato}>
                  <span className={styles.contatoIcone}>{c.icone}</span>
                  <span className={styles.contatoTexto}>
                    <span className={styles.contatoLabel}>{c.label}</span>
                    <span className={styles.contatoValor}>{c.valor || '—'}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.bloco}>
            <h3 className={styles.blocoTitulo}>Dados pessoais</h3>
            <dl className={styles.pares}>
              {pares.map(d => (
                <div key={d.label} className={styles.par}>
                  <dt>{d.label}</dt>
                  <dd>{d.valor || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Painel da direita: conteúdo da aba ativa ── */}
        <div className={styles.painel}>
          {tab === 'dados' && (editando && form ? (
          <section className={styles.formCard} aria-label="Editar cadastro">
            <h2 className={styles.formTitulo}>Editar cadastro</h2>

            <form className={styles.form} onSubmit={aoSalvar}>
              <section className={styles.formSection}>
                <h3>Dados pessoais</h3>
                <div className={styles.grid2}>
                  <Input label="Nome" value={form.nome} onChange={e => set('nome')(e.target.value)} error={erroNome} autoFocus />
                  <Input label="Sobrenome" value={form.sobrenome} onChange={e => set('sobrenome')(e.target.value)} />
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
                <Select
                  label="Convênio"
                  options={OPCOES_CONVENIO}
                  value={form.convenio}
                  onChange={e => set('convenio')(e.target.value)}
                />
              </section>

              <section className={styles.formSection}>
                <h3>Contato</h3>
                <Input label="E-mail" type="email" value={form.email} onChange={e => set('email')(e.target.value)} />
                <div className={styles.grid2}>
                  <Input label="Telefone" type="tel" value={form.telefone} onChange={e => set('telefone')(e.target.value)} />
                  <Input label="WhatsApp" type="tel" value={form.whatsapp} onChange={e => set('whatsapp')(e.target.value)} />
                </div>
              </section>

              <section className={styles.formSection}>
                <h3>Endereço</h3>
                <div className={styles.grid2}>
                  <Input label="CEP" value={form.cep} onChange={e => set('cep')(e.target.value)} />
                  <Input label="Estado" maxLength={2} value={form.estado} onChange={e => set('estado')(e.target.value)} />
                </div>
                <div className={styles.grid2}>
                  <Input label="Cidade" value={form.cidade} onChange={e => set('cidade')(e.target.value)} />
                  <Input label="Bairro" value={form.bairro} onChange={e => set('bairro')(e.target.value)} />
                </div>
                <div className={styles.grid2}>
                  <Input label="Número" value={form.numero} onChange={e => set('numero')(e.target.value)} />
                </div>
              </section>

              <div className={styles.formAcoes}>
                <Button variant="ghost" onClick={fecharEdicao} disabled={salvando}>Cancelar</Button>
                <Button type="submit" loading={salvando}>Salvar alterações</Button>
              </div>
            </form>
          </section>
          ) : (
          <section className={styles.formCard} aria-label="Dados do paciente">
            <div className={styles.detalheHead}>
              <h2 className={styles.formTitulo}>Dados do paciente</h2>
              <Button variant="outline" size="sm" iconLeft={<IconEditar />} onClick={abrirEdicao}>
                Editar
              </Button>
            </div>

            {secoesDetalhe.map(secao => (
              <section key={secao.titulo} className={styles.formSection}>
                <h3>{secao.titulo}</h3>
                <dl className={styles.paresLargos}>
                  {secao.itens.map(item => (
                    <div key={item.label} className={styles.par}>
                      <dt>{item.label}</dt>
                      <dd>{item.valor || '—'}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </section>
          ))}

          {tab === 'tratamento' && (
            <Suspense fallback={<PageLoader />}>
              <TreatmentsPanel pacienteId={paciente.id} />
            </Suspense>
          )}
          {tab === 'pagamentos' && (
            <PaymentsTable pacienteId={paciente.id} pacienteNome={paciente.nome} pacienteCpf={paciente.cpf} />
          )}
          {tab === 'consultas' && <AppointmentsTimeline pacienteId={paciente.id} />}
          {tab === 'documentos' && <DocumentsUpload pacienteId={paciente.id} />}
        </div>
      </div>
    </>
  )
}
