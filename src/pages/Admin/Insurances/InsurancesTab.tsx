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
import { useConvenios, useCriarConvenio, useAtualizarConvenio } from '@/hooks/useConvenios'
import { useDebounce } from '@/hooks/useDebounce'
import { combinaBusca } from '@/utils/search'
import { IconBuscar, IconEditar, IconMais } from '@/components/icons'
import type { EditInsurance } from '@/services/conveniosService'
import type { Insurance } from '@/types/domain'
import styles from './InsurancesTab.module.scss'

interface FormConvenio {
  nome: string
  ans: string
  telefone: string
  email: string
  prazoDias: string      // texto do input; vira número ao salvar
  observacao: string
  ativo: boolean
}

const FORM_VAZIO: FormConvenio = {
  nome: '', ans: '', telefone: '', email: '', prazoDias: '', observacao: '', ativo: true,
}

function formDoConvenio(c: Insurance): FormConvenio {
  return {
    nome: c.nome,
    ans: c.ans ?? '',
    telefone: c.telefone ?? '',
    email: c.email ?? '',
    prazoDias: c.prazoRepasseDias != null ? String(c.prazoRepasseDias) : '',
    observacao: c.observacao ?? '',
    ativo: c.status === 'ativo',
  }
}

/** Aba "Convênios": cadastro dos planos aceitos — os selects de convênio do
 *  app (paciente, orçamentos) montam as opções a partir daqui. */
export function InsurancesTab() {
  const toast = useToast()
  const { data: convenios, isLoading } = useConvenios()
  const { mutate: criar, isPending: criando } = useCriarConvenio()
  const { mutate: atualizar, isPending: salvando } = useAtualizarConvenio()

  // Modal: null = fechado; com convênio = edição; sem = cadastro novo.
  const [modal, setModal] = useState<{ convenio?: Insurance } | null>(null)
  const [form, setForm] = useState<FormConvenio>(FORM_VAZIO)
  const [erroNome, setErroNome] = useState('')

  // Paginação + busca (mesmo desenho das outras listas).
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [busca, setBusca] = useState('')

  // Hook: fica ANTES do return condicional (ordem dos hooks em todo render).
  const termo = useDebounce(busca)

  if (isLoading) return <PageLoader />

  const filtrados = (convenios ?? []).filter(c => combinaBusca(c.nome, termo))
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = filtrados.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina)

  const set = (campo: keyof FormConvenio) => (valor: string | boolean) => {
    setForm(atual => ({ ...atual, [campo]: valor }))
    if (campo === 'nome') setErroNome('')
  }

  function abrirNovo() {
    setForm(FORM_VAZIO)
    setErroNome('')
    setModal({})
  }

  function abrirEdicao(convenio: Insurance) {
    setForm(formDoConvenio(convenio))
    setErroNome('')
    setModal({ convenio })
  }

  function fecharModal() {
    setModal(null)
    setForm(FORM_VAZIO)
    setErroNome('')
  }

  function aoSalvar(e: FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) {
      setErroNome('Informe o nome do convênio.')
      return
    }
    const dados: EditInsurance = {
      nome: form.nome.trim(),
      ans: form.ans.trim() || undefined,
      telefone: form.telefone.trim() || undefined,
      email: form.email.trim() || undefined,
      prazoRepasseDias: form.prazoDias.trim() ? Math.max(0, Number(form.prazoDias) || 0) : undefined,
      observacao: form.observacao.trim() || undefined,
      status: form.ativo ? 'ativo' : 'inativo',
    }
    const opcoes = {
      onSuccess: () => {
        toast.success(modal?.convenio ? 'Convênio atualizado!' : 'Convênio cadastrado!')
        fecharModal()
      },
    }
    if (modal?.convenio) atualizar({ id: modal.convenio.id, dados }, opcoes)
    else criar(dados, opcoes)
  }

  const columns: TableColumn<Insurance>[] = [
    { key: 'nome', label: 'Convênio', render: c => <span className={styles.nome}>{c.nome}</span> },
    { key: 'ans', label: 'Registro ANS', render: c => c.ans ?? '—' },
    { key: 'telefone', label: 'Telefone', render: c => c.telefone ?? '—' },
    {
      key: 'prazo',
      label: 'Prazo de repasse',
      render: c => (c.prazoRepasseDias != null ? `${c.prazoRepasseDias} dias` : '—'),
    },
    { key: 'status', label: 'Status', render: c => <Badge status={c.status} /> },
    {
      key: 'acoes',
      label: 'Ação',
      render: c => (
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<IconEditar />}
          title="Editar convênio"
          aria-label={`Editar ${c.nome}`}
          onClick={() => abrirEdicao(c)}
        />
      ),
    },
  ]

  return (
    <>
      <Table
        columns={columns}
        data={visiveis}
        rowKey={c => c.id}
        emptyMessage={termo ? 'Nenhum convênio encontrado para a busca.' : 'Nenhum convênio cadastrado.'}
        toolbar={
          <>
            <PerPageSelect porPagina={porPagina} onChange={n => { setPorPagina(n); setPagina(1) }} />
            <div className={styles.toolbarDireita}>
              <Input
                size="sm"
                iconLeft={<IconBuscar />}
                placeholder="Buscar convênio..."
                value={busca}
                onChange={e => { setBusca(e.target.value); setPagina(1) }}
                aria-label="Buscar convênio"
                className={styles.busca}
              />
              <Button size="sm" iconLeft={<IconMais />} onClick={abrirNovo}>
                Novo convênio
              </Button>
            </div>
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

      <Modal
        open={modal !== null}
        onClose={fecharModal}
        title={modal?.convenio ? 'Editar convênio' : 'Novo convênio'}
        footer={
          <>
            <Button variant="ghost" onClick={fecharModal} disabled={criando || salvando}>Cancelar</Button>
            <Button type="submit" form="form-convenio" loading={criando || salvando}>
              {modal?.convenio ? 'Salvar alterações' : 'Cadastrar'}
            </Button>
          </>
        }
      >
        <form id="form-convenio" className={styles.form} onSubmit={aoSalvar}>
          <Input
            label="Nome do convênio"
            placeholder="Ex: Unimed"
            value={form.nome}
            onChange={e => set('nome')(e.target.value)}
            error={erroNome}
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
              value={form.prazoDias}
              onChange={e => set('prazoDias')(e.target.value)}
            />
          </div>
          <div className={styles.grid2}>
            <Input
              label="Telefone"
              type="tel"
              value={form.telefone}
              onChange={e => set('telefone')(e.target.value)}
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
            value={form.observacao}
            onChange={e => set('observacao')(e.target.value)}
          />
          <Toggle label="Convênio ativo" checked={form.ativo} onChange={v => set('ativo')(v)} />
        </form>
      </Modal>
    </>
  )
}
