import { useRef, useState } from 'react'
import type { DragEvent, FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Pagination } from '@/components/Pagination/Pagination'
import { Select } from '@/components/Select/Select'
import { Spinner } from '@/components/Spinner/Spinner'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/useToast'
import { IconDocumento, IconUpload, IconOlho, IconX, IconEditar, IconLixeira } from '@/components/icons'
import {
  useDocumentosDoPaciente, useEnviarDocumento, useAtualizarDocumento, useExcluirDocumento,
} from '@/hooks/useDocumentos'
import type { DocumentoPaciente } from '@/types/domain'
import styles from './DocumentsUpload.module.scss'

const EXTENSOES_IMAGEM = ['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP']

const OPCOES_POR_PAGINA = [
  { value: '5',  label: '5 por página' },
  { value: '10', label: '10 por página' },
  { value: '20', label: '20 por página' },
]

/** 1234567 → "1,2 MB" */
function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
}

/** 'exames-jun.pdf' → 'PDF' */
function extensao(nomeArquivo: string) {
  const partes = nomeArquivo.split('.')
  return partes.length > 1 ? partes[partes.length - 1].toUpperCase() : 'ARQ'
}

interface DocumentsUploadProps {
  pacienteId: string
}

/** Upload de documentos do paciente (nome + descrição) e lista dos já enviados. */
export function DocumentsUpload({ pacienteId }: DocumentsUploadProps) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: documentos, isLoading } = useDocumentosDoPaciente(pacienteId)
  const { mutate: enviar, isPending: enviando } = useEnviarDocumento()
  const { mutate: atualizar, isPending: salvando } = useAtualizarDocumento()
  const { mutate: excluir } = useExcluirDocumento()

  const [arquivo, setArquivo] = useState<File | null>(null)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState('')
  const [arrastando, setArrastando] = useState(false)

  // Ações da lista: ver, editar e excluir.
  const [vendo, setVendo] = useState<DocumentoPaciente | null>(null)
  const [editando, setEditando] = useState<DocumentoPaciente | null>(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [descricaoEdicao, setDescricaoEdicao] = useState('')
  const [erroEdicao, setErroEdicao] = useState('')
  const [excluindo, setExcluindo] = useState<DocumentoPaciente | null>(null)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(5)

  function selecionar(file: File) {
    setArquivo(file)
    setErro('')
    // O nome do arquivo vira sugestão de título (editável).
    if (!nome.trim()) setNome(file.name.replace(/\.[^.]+$/, ''))
  }

  function aoSoltar(e: DragEvent) {
    e.preventDefault()
    setArrastando(false)
    const file = e.dataTransfer.files[0]
    if (file) selecionar(file)
  }

  function limpar() {
    setArquivo(null)
    setNome('')
    setDescricao('')
    setErro('')
    if (inputRef.current) inputRef.current.value = ''
  }

  function aoEnviar(e: FormEvent) {
    e.preventDefault()
    if (!arquivo) {
      setErro('Escolha um arquivo para enviar.')
      return
    }
    if (!nome.trim()) {
      setErro('Dê um nome ao documento.')
      return
    }
    enviar(
      {
        pacienteId,
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        arquivo: arquivo.name,
        tipo: extensao(arquivo.name),
        tamanho: formatarTamanho(arquivo.size),
        url: URL.createObjectURL(arquivo),
      },
      {
        onSuccess: () => {
          toast.success('Documento enviado!')
          limpar()
          setPagina(1)   // o documento novo entra no topo da primeira página
        },
      },
    )
  }

  function abrirEdicao(doc: DocumentoPaciente) {
    setEditando(doc)
    setNomeEdicao(doc.nome)
    setDescricaoEdicao(doc.descricao ?? '')
    setErroEdicao('')
  }

  function salvarEdicao(e: FormEvent) {
    e.preventDefault()
    if (!editando) return
    if (!nomeEdicao.trim()) {
      setErroEdicao('Dê um nome ao documento.')
      return
    }
    atualizar(
      { id: editando.id, dados: { nome: nomeEdicao.trim(), descricao: descricaoEdicao.trim() || undefined } },
      {
        onSuccess: () => {
          toast.success('Documento atualizado!')
          setEditando(null)
        },
      },
    )
  }

  function confirmarExclusao() {
    if (!excluindo) return
    excluir(excluindo.id, { onSuccess: () => toast.success('Documento excluído.') })
  }

  const lista = documentos ?? []
  const vendoEhImagem = vendo?.url && EXTENSOES_IMAGEM.includes(vendo.tipo)

  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina))
  // Excluir pode encolher a lista: nunca fica numa página que não existe mais.
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = lista.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina)

  return (
    <div className={styles.root}>
      {/* ── Formulário de envio ── */}
      <form className={styles.form} onSubmit={aoEnviar}>
        <button
          type="button"
          className={`${styles.zona} ${arrastando ? styles['zona--ativa'] : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setArrastando(true) }}
          onDragLeave={() => setArrastando(false)}
          onDrop={aoSoltar}
          aria-label="Escolher arquivo para enviar"
        >
          <IconUpload />
          {arquivo ? (
            <span className={styles.zonaArquivo}>
              {arquivo.name} <em>({formatarTamanho(arquivo.size)})</em>
            </span>
          ) : (
            <span className={styles.zonaTexto}>
              Arraste um arquivo até aqui ou <strong>clique para escolher</strong>
            </span>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          className={styles.inputArquivo}
          onChange={e => { const f = e.target.files?.[0]; if (f) selecionar(f) }}
          tabIndex={-1}
          aria-hidden="true"
        />

        <Input
          label="Nome do documento"
          placeholder="Ex.: Resultado de exames"
          value={nome}
          onChange={e => { setNome(e.target.value); setErro('') }}
          error={erro}
        />
        <Textarea
          label="Descrição"
          rows={3}
          placeholder="Contexto do documento (opcional)."
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
        />

        <div className={styles.acoes}>
          {arquivo && (
            <Button variant="ghost" iconLeft={<IconX />} onClick={limpar} disabled={enviando}>
              Limpar
            </Button>
          )}
          <Button type="submit" iconLeft={<IconUpload />} loading={enviando}>
            Enviar documento
          </Button>
        </div>
      </form>

      {/* ── Documentos enviados ── */}
      {isLoading ? (
        <div className={styles.loading}><Spinner /></div>
      ) : lista.length === 0 ? (
        <EmptyState
          title="Nenhum documento"
          description="Exames, atestados e anexos enviados aparecerão aqui."
        />
      ) : (
        <div className={styles.listaCard}>
          <div className={styles.listaToolbar}>
            <Select
              size="sm"
              options={OPCOES_POR_PAGINA}
              value={String(porPagina)}
              onChange={e => { setPorPagina(Number(e.target.value)); setPagina(1) }}
              aria-label="Documentos por página"
              className={styles.porPagina}
            />
          </div>

          <ul className={styles.lista}>
          {visiveis.map(doc => (
            <li key={doc.id} className={styles.documento}>
              <span className={styles.docIcone}><IconDocumento /></span>

              <div className={styles.docInfo}>
                <span className={styles.docNome}>{doc.nome}</span>
                {doc.descricao && <span className={styles.docDescricao}>{doc.descricao}</span>}
                <span className={styles.docMeta}>
                  {doc.tipo} · {doc.tamanho} · enviado em {doc.enviadoEm}
                </span>
              </div>

              <span className={styles.docAcoes}>
                <Button
                  variant="ghost" size="sm" iconLeft={<IconOlho />}
                  title="Ver documento" aria-label={`Ver ${doc.nome}`}
                  onClick={() => setVendo(doc)}
                />
                <Button
                  variant="ghost" size="sm" iconLeft={<IconEditar />}
                  title="Editar documento" aria-label={`Editar ${doc.nome}`}
                  onClick={() => abrirEdicao(doc)}
                />
                <Button
                  variant="ghost" size="sm" iconLeft={<IconLixeira />}
                  className={styles.excluirBtn}
                  title="Excluir documento" aria-label={`Excluir ${doc.nome}`}
                  onClick={() => setExcluindo(doc)}
                />
              </span>
            </li>
          ))}
          </ul>

          <div className={styles.rodape}>
            <Pagination
              page={paginaAtual}
              totalPages={totalPaginas}
              onChange={setPagina}
              totalItems={lista.length}
              itemsPerPage={porPagina}
            />
          </div>
        </div>
      )}

      {/* ── Ver: pré-visualização com a descrição abaixo ── */}
      <Modal
        open={vendo !== null}
        onClose={() => setVendo(null)}
        title={vendo?.nome}
        footer={
          <>
            {vendo?.url && (
              <Button variant="outline" onClick={() => window.open(vendo.url, '_blank', 'noopener')}>
                Abrir em nova aba
              </Button>
            )}
            <Button variant="ghost" onClick={() => setVendo(null)}>Fechar</Button>
          </>
        }
      >
        {vendo && (
          <div className={styles.visualizacao}>
            {vendoEhImagem ? (
              <img className={styles.preview} src={vendo.url} alt={vendo.nome} />
            ) : vendo.url ? (
              <iframe className={styles.previewFrame} src={vendo.url} title={vendo.nome} />
            ) : (
              <div className={styles.previewVazio}>
                <IconDocumento />
                <span>{vendo.arquivo}</span>
              </div>
            )}

            <div className={styles.visualizacaoBloco}>
              <h4>Descrição</h4>
              <p>{vendo.descricao || 'Sem descrição.'}</p>
            </div>

            <span className={styles.visualizacaoMeta}>
              {vendo.tipo} · {vendo.tamanho} · enviado em {vendo.enviadoEm}
            </span>
          </div>
        )}
      </Modal>

      {/* ── Editar: nome e descrição ── */}
      <Modal
        open={editando !== null}
        onClose={() => setEditando(null)}
        title="Editar documento"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditando(null)} disabled={salvando}>Cancelar</Button>
            <Button type="submit" form="form-editar-documento" loading={salvando}>Salvar</Button>
          </>
        }
      >
        <form id="form-editar-documento" className={styles.formEdicao} onSubmit={salvarEdicao}>
          <Input
            label="Nome do documento"
            value={nomeEdicao}
            onChange={e => { setNomeEdicao(e.target.value); setErroEdicao('') }}
            error={erroEdicao}
            autoFocus
          />
          <Textarea
            label="Descrição"
            rows={3}
            value={descricaoEdicao}
            onChange={e => setDescricaoEdicao(e.target.value)}
          />
        </form>
      </Modal>

      {/* ── Excluir: confirmação reutilizável ── */}
      <ConfirmDialog
        open={excluindo !== null}
        onClose={() => setExcluindo(null)}
        onConfirm={confirmarExclusao}
        variant="danger"
        title="Excluir documento?"
        message={`"${excluindo?.nome}" será removido do cadastro do paciente. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </div>
  )
}
