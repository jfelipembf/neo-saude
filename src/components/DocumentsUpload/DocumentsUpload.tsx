import { useRef, useState } from 'react'
import type { DragEvent, FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Pagination } from '@/components/Pagination/Pagination'
import { PerPageSelect } from '@/components/PerPageSelect/PerPageSelect'
import { Spinner } from '@/components/Spinner/Spinner'
import { Textarea } from '@/components/Textarea/Textarea'
import { useToast } from '@/components/Toast/useToast'
import { IconDocument, IconUpload, IconEye, IconX, IconEdit, IconTrash } from '@/components/icons'
import {
  usePatientDocuments, useUploadDocument, useUpdateDocument, useDeleteDocument,
} from '@/hooks/useDocuments'
import type { PatientDocument } from '@/types/domain'
import styles from './DocumentsUpload.module.scss'

const IMAGE_EXTENSIONS = ['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP']

/** 1234567 → "1,2 MB" */
function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
}

interface DocumentsUploadProps {
  patientId: string
}

/** Upload de documentos do paciente (nome + descrição) e lista dos já enviados. */
export function DocumentsUpload({ patientId }: DocumentsUploadProps) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: documents, isLoading } = usePatientDocuments(patientId)
  const { mutate: upload, isPending: uploading } = useUploadDocument()
  const { mutate: update, isPending: saving } = useUpdateDocument()
  const { mutate: remove } = useDeleteDocument()

  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  // Ações da lista: ver, editar e excluir.
  const [viewing, setViewing] = useState<PatientDocument | null>(null)
  const [editing, setEditing] = useState<PatientDocument | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editError, setEditError] = useState('')
  const [deleting, setDeleting] = useState<PatientDocument | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(5)

  function selectFile(file: File) {
    setFile(file)
    setError('')
    // O nome do arquivo vira sugestão de título (editável).
    if (!name.trim()) setName(file.name.replace(/\.[^.]+$/, ''))
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) selectFile(file)
  }

  function clearForm() {
    setFile(null)
    setName('')
    setDescription('')
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('Escolha um arquivo para enviar.')
      return
    }
    if (!name.trim()) {
      setError('Dê um nome ao documento.')
      return
    }
    upload(
      {
        patientId,
        name: name.trim(),
        description: description.trim() || undefined,
        file,
      },
      {
        onSuccess: () => {
          toast.success('Documento enviado!')
          clearForm()
          setPage(1)   // o documento novo entra no topo da primeira página
        },
      },
    )
  }

  function openEdit(doc: PatientDocument) {
    setEditing(doc)
    setEditName(doc.name)
    setEditDescription(doc.description ?? '')
    setEditError('')
  }

  function saveEdit(e: FormEvent) {
    e.preventDefault()
    if (!editing) return
    if (!editName.trim()) {
      setEditError('Dê um nome ao documento.')
      return
    }
    update(
      { id: editing.id, payload: { name: editName.trim(), description: editDescription.trim() || undefined } },
      {
        onSuccess: () => {
          toast.success('Documento atualizado!')
          setEditing(null)
        },
      },
    )
  }

  function confirmDelete() {
    if (!deleting) return
    remove(deleting.id, { onSuccess: () => toast.success('Documento excluído.') })
  }

  const list = documents ?? []
  const isViewingImage = viewing?.url && IMAGE_EXTENSIONS.includes(viewing.type)

  const totalPages = Math.max(1, Math.ceil(list.length / perPage))
  // Excluir pode encolher a lista: nunca fica numa página que não existe mais.
  const currentPage = Math.min(page, totalPages)
  const visible = list.slice((currentPage - 1) * perPage, currentPage * perPage)

  return (
    <div className={styles.root}>
      {/* ── Formulário de envio ── */}
      <form className={styles.form} onSubmit={handleSubmit}>
        <button
          type="button"
          className={`${styles.zona} ${dragging ? styles['zona--ativa'] : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          aria-label="Escolher arquivo para enviar"
        >
          <IconUpload />
          {file ? (
            <span className={styles.zonaArquivo}>
              {file.name} <em>({formatSize(file.size)})</em>
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
          onChange={e => { const f = e.target.files?.[0]; if (f) selectFile(f) }}
          tabIndex={-1}
          aria-hidden="true"
        />

        <Input
          label="Nome do documento"
          placeholder="Ex.: Resultado de exames"
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          error={error}
        />
        <Textarea
          label="Descrição"
          rows={3}
          placeholder="Contexto do documento (opcional)."
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <div className={styles.acoes}>
          {file && (
            <Button variant="ghost" iconLeft={<IconX />} onClick={clearForm} disabled={uploading}>
              Limpar
            </Button>
          )}
          <Button type="submit" iconLeft={<IconUpload />} loading={uploading}>
            Enviar documento
          </Button>
        </div>
      </form>

      {/* ── Documentos enviados ── */}
      {isLoading ? (
        <div className={styles.loading}><Spinner /></div>
      ) : list.length === 0 ? (
        <EmptyState
          title="Nenhum documento"
          description="Exames, atestados e anexos enviados aparecerão aqui."
        />
      ) : (
        <div className={styles.listaCard}>
          <div className={styles.listaToolbar}>
            <PerPageSelect
              perPage={perPage}
              onChange={n => { setPerPage(n); setPage(1) }}
              ariaLabel="Documentos por página"
            />
          </div>

          <ul className={styles.lista}>
          {visible.map(doc => (
            <li key={doc.id} className={styles.documento}>
              <span className={styles.docIcone}><IconDocument /></span>

              <div className={styles.docInfo}>
                <span className={styles.docNome}>{doc.name}</span>
                {doc.description && <span className={styles.docDescricao}>{doc.description}</span>}
                <span className={styles.docMeta}>
                  {doc.type} · {doc.size} · enviado em {doc.uploadedAt}
                </span>
              </div>

              <span className={styles.docAcoes}>
                <Button
                  variant="ghost" size="sm" iconLeft={<IconEye />}
                  title="Ver documento" aria-label={`Ver ${doc.name}`}
                  onClick={() => setViewing(doc)}
                />
                <Button
                  variant="ghost" size="sm" iconLeft={<IconEdit />}
                  title="Editar documento" aria-label={`Editar ${doc.name}`}
                  onClick={() => openEdit(doc)}
                />
                <Button
                  variant="ghost" size="sm" iconLeft={<IconTrash />}
                  className={styles.excluirBtn}
                  title="Excluir documento" aria-label={`Excluir ${doc.name}`}
                  onClick={() => setDeleting(doc)}
                />
              </span>
            </li>
          ))}
          </ul>

          <div className={styles.rodape}>
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onChange={setPage}
              totalItems={list.length}
              itemsPerPage={perPage}
            />
          </div>
        </div>
      )}

      {/* ── Ver: pré-visualização com a descrição abaixo ── */}
      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing?.name}
        footer={
          <>
            {viewing?.url && (
              <Button variant="outline" onClick={() => window.open(viewing.url, '_blank', 'noopener')}>
                Abrir em nova aba
              </Button>
            )}
            <Button variant="ghost" onClick={() => setViewing(null)}>Fechar</Button>
          </>
        }
      >
        {viewing && (
          <div className={styles.visualizacao}>
            {isViewingImage ? (
              <img className={styles.preview} src={viewing.url} alt={viewing.name} />
            ) : viewing.url ? (
              <iframe className={styles.previewFrame} src={viewing.url} title={viewing.name} />
            ) : (
              <div className={styles.previewVazio}>
                <IconDocument />
                <span>{viewing.fileName}</span>
              </div>
            )}

            <div className={styles.visualizacaoBloco}>
              <h4>Descrição</h4>
              <p>{viewing.description || 'Sem descrição.'}</p>
            </div>

            <span className={styles.visualizacaoMeta}>
              {viewing.type} · {viewing.size} · enviado em {viewing.uploadedAt}
            </span>
          </div>
        )}
      </Modal>

      {/* ── Editar: nome e descrição ── */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Editar documento"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>Cancelar</Button>
            <Button type="submit" form="form-edit-document" loading={saving}>Salvar</Button>
          </>
        }
      >
        <form id="form-edit-document" className={styles.formEdicao} onSubmit={saveEdit}>
          <Input
            label="Nome do documento"
            value={editName}
            onChange={e => { setEditName(e.target.value); setEditError('') }}
            error={editError}
            autoFocus
          />
          <Textarea
            label="Descrição"
            rows={3}
            value={editDescription}
            onChange={e => setEditDescription(e.target.value)}
          />
        </form>
      </Modal>

      {/* ── Excluir: confirmação reutilizável ── */}
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        variant="danger"
        title="Excluir documento?"
        message={`"${deleting?.name}" será removido do cadastro do paciente. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </div>
  )
}
