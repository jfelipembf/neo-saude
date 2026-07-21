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
import { useMateriais, useCriarMaterial, useAtualizarMaterial } from '@/hooks/useMateriais'
import { useDebounce } from '@/hooks/useDebounce'
import { combinaBusca } from '@/utils/search'
import { IconCaixa, IconMais, IconBuscar, IconEditar } from '@/components/icons'
import type { Material } from '@/types/domain'
import styles from './MaterialsTab.module.scss'

/** Status do estoque: esgotado > vencido > estoque baixo > em estoque. */
function statusDoMaterial(m: Material): string {
  if (m.emEstoque <= 0) return 'esgotado'
  if (m.validade) {
    const [dia, mes, ano] = m.validade.split('/').map(Number)
    if (new Date(ano, mes - 1, dia) < new Date()) return 'vencido'
  }
  if (m.emEstoque <= m.qtdMinima) return 'estoque_baixo'
  return 'em_estoque'
}

interface FormMaterial {
  nome: string
  foto?: string
  emEstoque: string      // texto do input; vira número ao salvar
  qtdMinima: string
  validadeIso: string    // aaaa-mm-dd (input date)
  observacao: string
}

const FORM_VAZIO: FormMaterial = {
  nome: '', foto: undefined, emEstoque: '1', qtdMinima: '1', validadeIso: '', observacao: '',
}

/** Monta o formulário a partir do material cadastrado (validade dd/mm/aaaa → input date). */
function formDoMaterial(m: Material): FormMaterial {
  return {
    nome: m.nome,
    foto: m.foto,
    emEstoque: String(m.emEstoque),
    qtdMinima: String(m.qtdMinima),
    validadeIso: m.validade ? m.validade.split('/').reverse().join('-') : '',
    observacao: m.observacao ?? '',
  }
}

/** Aba "Materiais": tabela no padrão do projeto (por página + busca + paginação). */
export function MaterialsTab() {
  const toast = useToast()
  const { data: materiais, isLoading } = useMateriais()
  const { mutate: criar, isPending: criando } = useCriarMaterial()
  const { mutate: atualizar, isPending: salvando } = useAtualizarMaterial()

  const [modalAberto, setModalAberto] = useState(false)
  // Material em edição — null significa que o modal é de cadastro novo.
  const [emEdicao, setEmEdicao] = useState<Material | null>(null)
  const [form, setForm] = useState<FormMaterial>(FORM_VAZIO)
  const [erroNome, setErroNome] = useState('')

  // Paginação + busca (mesmo desenho da lista de pacientes).
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [busca, setBusca] = useState('')

  const termo = useDebounce(busca)
  const filtrados = (materiais ?? []).filter(m =>
    combinaBusca(m.nome, termo) || combinaBusca(m.observacao ?? '', termo),
  )

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = filtrados.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina)

  const set = (campo: keyof FormMaterial) => (valor: string) => {
    setForm(atual => ({ ...atual, [campo]: valor }))
    if (campo === 'nome') setErroNome('')
  }

  function abrirNovo() {
    setEmEdicao(null)
    setForm(FORM_VAZIO)
    setErroNome('')
    setModalAberto(true)
  }

  function abrirEdicao(material: Material) {
    setEmEdicao(material)
    setForm(formDoMaterial(material))
    setErroNome('')
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setEmEdicao(null)
    setForm(FORM_VAZIO)
    setErroNome('')
  }

  function aoSalvar(e: FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) {
      setErroNome('Informe o nome do produto.')
      return
    }
    const dados = {
      nome: form.nome.trim(),
      foto: form.foto,
      emEstoque: Math.max(0, Number(form.emEstoque) || 0),
      qtdMinima: Math.max(0, Number(form.qtdMinima) || 0),
      // input date entrega 'aaaa-mm-dd'; o domínio guarda 'dd/mm/aaaa'.
      validade: form.validadeIso ? form.validadeIso.split('-').reverse().join('/') : undefined,
      observacao: form.observacao.trim() || undefined,
    }
    const opcoes = {
      onSuccess: () => {
        toast.success(emEdicao ? 'Material atualizado!' : 'Material cadastrado!')
        fecharModal()
      },
    }
    if (emEdicao) atualizar({ id: emEdicao.id, dados }, opcoes)
    else criar(dados, opcoes)
  }

  const columns: TableColumn<Material>[] = [
    {
      key: 'nome',
      label: 'Material',
      render: m => (
        <span className={styles.materialCell}>
          {m.foto ? (
            <img src={m.foto} alt="" className={styles.thumb} />
          ) : (
            <span className={styles.semThumb}><IconCaixa /></span>
          )}
          {m.nome}
        </span>
      ),
    },
    { key: 'emEstoque',  label: 'Em estoque',  render: m => <>{m.emEstoque}</> },
    { key: 'qtdMinima',  label: 'Qtd. mínima', render: m => <>{m.qtdMinima}</> },
    { key: 'validade',   label: 'Validade',    render: m => <>{m.validade ?? '—'}</> },
    { key: 'observacao', label: 'Observação',  render: m => <>{m.observacao ?? '—'}</> },
    { key: 'status',     label: 'Status',      render: m => <Badge status={statusDoMaterial(m)} /> },
    {
      key: 'acoes',
      label: 'Ação',
      render: m => (
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<IconEditar />}
          title="Editar material"
          aria-label={`Editar ${m.nome}`}
          onClick={() => abrirEdicao(m)}
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
          data={visiveis}
          rowKey={m => m.id}
          emptyMessage={termo ? 'Nenhum material encontrado para a busca.' : 'Nenhum material cadastrado.'}
          toolbar={
            <>
              <PerPageSelect porPagina={porPagina} onChange={n => { setPorPagina(n); setPagina(1) }} />
              <div className={styles.toolbarDireita}>
                <Input
                  size="sm"
                  iconLeft={<IconBuscar />}
                  placeholder="Buscar material..."
                  value={busca}
                  onChange={e => { setBusca(e.target.value); setPagina(1) }}
                  aria-label="Buscar material"
                  className={styles.busca}
                />
                <Button size="sm" iconLeft={<IconMais />} onClick={abrirNovo}>
                  Novo material
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
      )}

      <Modal
        open={modalAberto}
        onClose={fecharModal}
        title={emEdicao ? 'Editar material' : 'Novo material'}
        footer={
          <>
            <Button variant="ghost" onClick={fecharModal}>Cancelar</Button>
            <Button type="submit" form="form-novo-material" loading={criando || salvando}>
              {emEdicao ? 'Salvar alterações' : 'Cadastrar material'}
            </Button>
          </>
        }
      >
        <form id="form-novo-material" className={styles.form} onSubmit={aoSalvar}>
          <Input
            label="Nome do produto"
            placeholder="Ex: Resina Fotopolimerizável A2"
            value={form.nome}
            onChange={e => set('nome')(e.target.value)}
            error={erroNome}
            autoFocus
          />

          <div className={styles.grid2}>
            <Input
              label="Em estoque"
              type="number"
              min={0}
              value={form.emEstoque}
              onChange={e => set('emEstoque')(e.target.value)}
            />
            <Input
              label="Qtd. mínima"
              type="number"
              min={0}
              value={form.qtdMinima}
              onChange={e => set('qtdMinima')(e.target.value)}
            />
          </div>

          <Input
            label="Validade"
            type="date"
            value={form.validadeIso}
            onChange={e => set('validadeIso')(e.target.value)}
          />

          <Input
            label="Observação"
            placeholder="Ex: Lote 123"
            value={form.observacao}
            onChange={e => set('observacao')(e.target.value)}
          />

          <PhotoInput label="Foto do material" value={form.foto} onChange={url => setForm(atual => ({ ...atual, foto: url }))} />
        </form>
      </Modal>
    </>
  )
}
