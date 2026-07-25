import { useMemo, useState } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { Table, type TableColumn } from '@/components/Table/Table'
import { useToast } from '@/components/Toast/Toast'
import { IconBan, IconCheck, IconInfo, IconPlus, IconTrash, IconX } from '@/components/icons'
import {
  useAddCostCenter, useCostCenters, useDeleteCostCenter,
  useSetCostCenterStatus, useUpdateCostCenter,
} from '@/hooks/useCostCenters'
import type { CostCenter } from '@/types/domain'
import shared from '../shared/finance.module.scss'
import styles from './CostCentersTab.module.scss'

/**
 * Aba "Centros de custo" — o recorte da clínica aplicado aos lançamentos.
 *
 * Lista PLANA de propósito (sem árvore, ao contrário de Categorias): recorte
 * organizacional não tem níveis, e sub-recorte quase sempre é sinal de que o
 * recorte deveria ser outro. Por ser plana, usa o <Table> do projeto como as
 * demais abas do Financeiro — o formulário de criação mora na `toolbar` dele, e
 * a edição acontece dentro da própria célula do nome.
 *
 * Nasce vazia: não há semeadura porque não existe divisão de referência que
 * sirva para toda clínica. É por isso que o texto do topo ensina a dimensão em
 * vez de só rotular a tela.
 *
 * Criar abre em MODAL (mesmo padrão de "Nova conta a pagar"); renomear é
 * inline, direto na célula — trocar um nome não precisa do peso de um modal, e
 * ficar dentro da própria linha deixa claro qual registro está sendo editado.
 */
export function CostCentersTab() {
  const toast = useToast()
  const { data: centers, isLoading } = useCostCenters()
  const { mutate: add, isPending: adding } = useAddCostCenter()
  const { mutate: update, isPending: updating } = useUpdateCostCenter()
  const { mutate: setStatus } = useSetCostCenterStatus()
  const { mutate: remove } = useDeleteCostCenter()

  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newNameError, setNewNameError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [toDelete, setToDelete] = useState<CostCenter | null>(null)

  const list = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return centers ?? []
    return (centers ?? []).filter(c => c.name.toLowerCase().includes(term))
  }, [centers, search])

  if (isLoading) return <PageLoader />

  const total = centers?.length ?? 0

  function startCreate() {
    setCreating(true)
    setNewName('')
    setNewNameError('')
  }

  function closeCreate() {
    setCreating(false)
    setNewName('')
    setNewNameError('')
  }

  function submitCreate() {
    const name = newName.trim()
    if (!name) { setNewNameError('Dê um nome ao centro de custo.'); return }
    add({ name }, {
      onSuccess: () => { toast.success('Centro de custo criado!'); closeCreate() },
      onError: (e: unknown) => {
        setNewNameError(
          (e as { code?: string })?.code === '23505'
            ? `Já existe um centro de custo chamado "${name}".`
            : 'Não foi possível salvar o centro de custo.',
        )
      },
    })
  }

  function startEdit(center: CostCenter) {
    setEditingId(center.id)
    setEditingName(center.name)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingName('')
  }

  function submitEdit() {
    if (!editingId) return
    const name = editingName.trim()
    if (!name) return
    update({ id: editingId, input: { name } }, {
      onSuccess: () => { toast.success('Centro de custo salvo!'); cancelEdit() },
      onError: (e: unknown) =>
        toast.error(
          (e as { code?: string })?.code === '23505'
            ? `Já existe um centro de custo chamado "${name}".`
            : 'Não foi possível salvar o centro de custo.',
        ),
    })
  }

  function toggleStatus(center: CostCenter) {
    const next = center.status === 'active' ? 'inactive' : 'active'
    setStatus({ id: center.id, status: next }, {
      onSuccess: () => toast.success(next === 'active' ? 'Centro reativado!' : 'Centro inativado.'),
      onError: () => toast.error('Não foi possível alterar o centro de custo.'),
    })
  }

  function confirmDelete() {
    if (!toDelete) return
    remove(toDelete.id, {
      onSuccess: () => { toast.success('Centro de custo excluído.'); setToDelete(null) },
      onError: (e: unknown) => {
        toast.error(
          (e as { code?: string })?.code === '23503'
            ? 'Este centro já tem lançamento e não pode ser excluído. Inative-o: ele some dos formulários e o histórico continua.'
            : 'Não foi possível excluir o centro de custo.',
        )
        setToDelete(null)
      },
    })
  }

  /** Renomear é inline, direto na célula — ver o comentário do componente. */
  const campoEdicao = (
    <div className={styles.formLinha}>
      <Input
        className={styles.campoNome}
        placeholder="Nome do centro de custo"
        value={editingName}
        onChange={e => setEditingName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submitEdit(); if (e.key === 'Escape') cancelEdit() }}
        size="sm"
        autoFocus
      />
      <Button size="sm" loading={updating} onClick={submitEdit}>Salvar</Button>
      <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={updating} aria-label="Cancelar">
        <IconX />
      </Button>
    </div>
  )

  const columns: TableColumn<CostCenter>[] = [
    {
      key: 'name',
      label: 'Nome',
      render: center => editingId === center.id
        ? campoEdicao
        : (
          <div className={styles.celulaNome}>
            {/* O nome É o botão de renomear — daí a cara de link. */}
            <button type="button" className={styles.nome} onClick={() => startEdit(center)} title="Renomear">
              {center.name}
            </button>
            {center.status !== 'active' && <span className={styles.selo}>Inativo</span>}
          </div>
        ),
    },
    {
      key: 'acoes',
      label: '',
      className: styles.colAcoes,
      render: center => editingId === center.id ? null : (
        <div className={shared.acoes}>
          <button
            type="button"
            className={shared.acaoBtn}
            title={center.status === 'active' ? 'Inativar' : 'Reativar'}
            aria-label={`${center.status === 'active' ? 'Inativar' : 'Reativar'} ${center.name}`}
            onClick={() => toggleStatus(center)}
          >
            {center.status === 'active' ? <IconBan /> : <IconCheck />}
          </button>
          <button
            type="button"
            className={shared.acaoBtn}
            title="Excluir"
            aria-label={`Excluir ${center.name}`}
            onClick={() => setToDelete(center)}
          >
            <IconTrash />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className={styles.raiz}>
      {/* ── O que é a dimensão ────────────────────────────────────────────── */}
      <aside className={styles.explicacao}>
        <div className={styles.explicacaoIcone}><IconInfo /></div>
        <div className={styles.explicacaoTexto}>
          <h3 className={styles.explicacaoTitulo}>Um recorte da sua clínica</h3>
          <p>
            Marque cada despesa e cada receita com a parte da clínica a que ela pertence. O Financeiro
            passa então a mostrar não só quanto entrou e saiu, mas de onde — e “R$ 4.000 de aluguel” deixa
            de ser uma linha só, revelando quanto desse valor pesa em cada frente.
          </p>
          <ul className={styles.exemplos}>
            <li><strong>Por setor</strong> — Administrativo, Comercial, Clínico, Recepção.</li>
            <li><strong>Por profissional</strong> — um centro para cada um, reunindo o que ele gera e o que consome.</li>
            <li><strong>Por espaço ou unidade</strong> — Sala 1, Sala de Pilates, Unidade Centro.</li>
          </ul>
          <p className={styles.ressalva}>
            Não existe divisão certa: serve a que responde à pergunta que você faz no fim do mês. Começar
            com três ou quatro e ajustar depois costuma render mais do que desenhar tudo de uma vez — e a
            dimensão é opcional, lançamento sem centro de custo continua válido.
          </p>
        </div>
      </aside>

      {total === 0 ? (
        <>
          <div className={styles.barraVazia}>
            <Button size="sm" iconLeft={<IconPlus />} onClick={startCreate}>Novo centro de custo</Button>
          </div>
          <EmptyState
            title="Nenhum centro de custo cadastrado"
            description="Enquanto não houver nenhum, o campo nem aparece nos lançamentos — a dimensão fica invisível até você decidir usá-la."
          />
        </>
      ) : (
        <Table
          columns={columns}
          data={list}
          rowKey={c => c.id}
          rowClassName={c => (c.status !== 'active' ? styles.linhaInativa : undefined)}
          emptyMessage="Nenhum centro de custo casa com a busca."
          toolbar={
            <>
              <Input
                className={styles.busca}
                placeholder="Buscar centro de custo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                size="sm"
              />
              <Button size="sm" iconLeft={<IconPlus />} onClick={startCreate}>
                Novo centro de custo
              </Button>
            </>
          }
        />
      )}

      <Modal
        open={creating}
        onClose={closeCreate}
        title="Novo centro de custo"
        footer={
          <>
            <Button variant="ghost" onClick={closeCreate} disabled={adding}>Cancelar</Button>
            <Button loading={adding} onClick={submitCreate}>Salvar</Button>
          </>
        }
      >
        <Input
          label="Nome"
          placeholder="Ex.: Recepção, Sala de Pilates, Dra. Ana"
          value={newName}
          onChange={e => { setNewName(e.target.value); setNewNameError('') }}
          onKeyDown={e => { if (e.key === 'Enter') submitCreate() }}
          error={newNameError}
          autoFocus
        />
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        variant="danger"
        title={`Excluir "${toDelete?.name}"?`}
        message="Se já houver lançamento carimbado com este centro, a exclusão é recusada — nesse caso, inative em vez de excluir."
        confirmLabel="Excluir"
      />
    </div>
  )
}
