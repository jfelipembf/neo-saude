import { useMemo, useState } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Input } from '@/components/Input/Input'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl'
import { Select } from '@/components/Select/Select'
import { useToast } from '@/components/Toast/Toast'
import { IconBan, IconCheck, IconChevronDown, IconChevronRight, IconPlus, IconX } from '@/components/icons'
import {
  useAddFinanceCategory, useDeleteFinanceCategories, useFinanceCategories,
  useRenameFinanceCategory, useSetFinanceCategoryStatus,
} from '@/hooks/useFinanceCategories'
import type { FinanceCategory, FinanceCategoryKind, FinanceCategoryNode } from '@/types/domain'
import shared from '../shared/finance.module.scss'
import styles from './CategoriesTab.module.scss'

const KIND_LABEL: Record<FinanceCategoryKind, string> = {
  revenue: 'Receita',
  expense: 'Despesa',
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'revenue', label: 'Receitas' },
  { value: 'expense', label: 'Despesas' },
] as const

type FilterValue = (typeof FILTER_OPTIONS)[number]['value']

/** Alvo do formulário em linha: `parentId` nulo cria uma categoria de topo. */
interface Draft {
  parentId: string | null
  kind: FinanceCategoryKind
}

/**
 * Aba "Categorias" — o plano de contas da clínica.
 *
 * Layout de TABELA (colunas Nome/Tipo, seleção em massa, subcategorias ligadas
 * ao pai por conector), no modelo dos sistemas contábeis do mercado.
 *
 * Uma tabela só, com um <tbody> por grupo: é o que dá o cabeçalho único no topo
 * e o respiro entre os blocos sem repetir "NOME / TIPO" a cada categoria. Não
 * reusa <Table> de propósito — aquele componente monta uma linha por item de uma
 * lista plana, e aqui cada grupo tem cabeçalho próprio, filhos e uma linha de
 * rodapé ("adicionar subcategoria"). Encaixar isso lá dentro significaria um
 * modo novo que só este consumidor usaria.
 *
 * Três coisas são de propósito:
 *  · o NOME é o botão de renomear (é por isso que ele tem cara de link). A
 *    coluna de ações fica só com inativar/excluir.
 *  · categoria de referência (is_seed) não tem excluir. A policy do banco já
 *    recusa, mas DELETE recusado por RLS não dá erro — apaga zero linhas e
 *    volta "ok". O botão existiria para não fazer nada.
 *  · não há como mover subcategoria de pai nem trocar o tipo depois de criada:
 *    reclassificaria lançamentos já feitos, e o GRANT do banco nem aceita.
 */
export function CategoriesTab() {
  const toast = useToast()
  const { data: tree, isLoading } = useFinanceCategories()
  const { mutate: add, isPending: adding } = useAddFinanceCategory()
  const { mutate: rename, isPending: renaming } = useRenameFinanceCategory()
  const { mutate: setStatus } = useSetFinanceCategoryStatus()
  const { mutate: removeMany } = useDeleteFinanceCategories()

  const [filter, setFilter] = useState<FilterValue>('all')
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [draft, setDraft] = useState<Draft | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftKind, setDraftKind] = useState<FinanceCategoryKind>('expense')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (tree ?? [])
      .filter(root => filter === 'all' || root.kind === filter)
      .map(root => {
        if (!term) return root
        // Busca casa no PAI ou no FILHO: "aluguel" tem de achar a subcategoria
        // mesmo com o nome do grupo não casando, e "impostos" traz o grupo
        // inteiro.
        if (root.name.toLowerCase().includes(term)) return root
        return { ...root, children: root.children.filter(c => c.name.toLowerCase().includes(term)) }
      })
      .filter(root => root.name.toLowerCase().includes(term) || root.children.length > 0)
  }, [tree, filter, search])

  // Todos os ids VISÍVEIS (respeitando filtro e busca) — é o universo do
  // "selecionar tudo" e o que a barra de lote considera.
  const visibleIds = useMemo(
    () => groups.flatMap(root => [root.id, ...root.children.map(c => c.id)]),
    [groups],
  )

  const selectedList = useMemo(
    () => {
      const flat = new Map<string, FinanceCategory>()
      for (const root of groups) {
        flat.set(root.id, root)
        for (const child of root.children) flat.set(child.id, child)
      }
      // Só o que está selecionado E visível: filtrar a lista não pode agir sobre
      // uma categoria que a pessoa não está mais vendo.
      return [...selected].map(id => flat.get(id)).filter((c): c is FinanceCategory => Boolean(c))
    },
    [selected, groups],
  )

  if (isLoading) return <PageLoader />

  const searching = search.trim().length > 0
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selected.has(id))
  const deletableCount = selectedList.filter(c => !c.isSeed).length

  /** Buscando, tudo aparece aberto — esconder o resultado atrás de um clique é o
   *  oposto do que a busca serve. */
  const isOpen = (rootId: string) => searching || !collapsed.has(rootId)

  function toggleOpen(rootId: string) {
    setCollapsed(current => {
      const next = new Set(current)
      if (next.has(rootId)) next.delete(rootId)
      else next.add(rootId)
      return next
    })
  }

  /** Marcar a RAIZ arrasta os filhos: quem seleciona "Impostos" para inativar
   *  quer o bloco, não a linha de cabeçalho sozinha. */
  function toggleGroup(root: FinanceCategoryNode) {
    const ids = [root.id, ...root.children.map(c => c.id)]
    const marking = !ids.every(id => selected.has(id))
    setSelected(current => {
      const next = new Set(current)
      ids.forEach(id => (marking ? next.add(id) : next.delete(id)))
      return next
    })
  }

  function toggleOne(id: string) {
    setSelected(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllVisible() {
    setSelected(current => {
      const next = new Set(current)
      visibleIds.forEach(id => (allVisibleSelected ? next.delete(id) : next.add(id)))
      return next
    })
  }

  function startAdd(target: Draft) {
    setDraft(target)
    setDraftName('')
    setDraftKind(target.kind)
    setEditingId(null)
  }

  function cancelAdd() {
    setDraft(null)
    setDraftName('')
  }

  function submitAdd() {
    if (!draft) return
    const name = draftName.trim()
    if (!name) return
    add(
      {
        name,
        // Subcategoria herda o tipo do pai — o banco recusaria outra coisa, e
        // perguntar seria oferecer uma escolha que não existe.
        kind: draft.parentId ? draft.kind : draftKind,
        parentId: draft.parentId ?? undefined,
      },
      {
        onSuccess: () => { toast.success('Categoria criada!'); cancelAdd() },
        onError: (e: unknown) => toast.error(describeWriteError(e, name)),
      },
    )
  }

  function startEdit(node: FinanceCategory) {
    setEditingId(node.id)
    setEditingName(node.name)
    setDraft(null)
  }

  function submitEdit() {
    if (!editingId) return
    const name = editingName.trim()
    if (!name) return
    rename(
      { id: editingId, name },
      {
        onSuccess: () => { toast.success('Categoria renomeada!'); setEditingId(null) },
        onError: (e: unknown) => toast.error(describeWriteError(e, name)),
      },
    )
  }

  function applyStatus(ids: string[], status: 'active' | 'inactive') {
    if (ids.length === 0) return
    setStatus(
      { ids, status },
      {
        onSuccess: () => {
          toast.success(
            ids.length === 1
              ? status === 'active' ? 'Categoria reativada!' : 'Categoria inativada.'
              : `${ids.length} categorias ${status === 'active' ? 'reativadas' : 'inativadas'}.`,
          )
          setSelected(new Set())
        },
        onError: () => toast.error('Não foi possível alterar as categorias.'),
      },
    )
  }

  function confirmDelete() {
    const ids = selectedList.filter(c => !c.isSeed).map(c => c.id)
    removeMany(ids, {
      onSuccess: ({ deleted, refused }) => {
        // `refused` só é possível se a policy recusar em silêncio (is_seed que
        // escapou do filtro acima). Reportar em vez de dizer "excluído".
        if (deleted > 0) toast.success(deleted === 1 ? 'Categoria excluída.' : `${deleted} categorias excluídas.`)
        if (refused > 0) toast.error(`${refused} não puderam ser excluídas e continuam na lista.`)
        setSelected(new Set())
        setConfirmingDelete(false)
      },
      onError: (e: unknown) => {
        toast.error(describeDeleteError(e))
        setConfirmingDelete(false)
      },
    })
  }

  /** Campo em linha, para criar e para renomear. */
  function inlineField(props: {
    value: string
    onChange: (v: string) => void
    onSubmit: () => void
    onCancel: () => void
    placeholder: string
    busy: boolean
    withKind?: boolean
  }) {
    return (
      <div className={styles.linhaForm}>
        <Input
          value={props.value}
          onChange={e => props.onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') props.onSubmit()
            if (e.key === 'Escape') props.onCancel()
          }}
          placeholder={props.placeholder}
          size="sm"
          autoFocus
        />
        {props.withKind && (
          <Select
            size="sm"
            options={[
              { value: 'expense', label: 'Despesa' },
              { value: 'revenue', label: 'Receita' },
            ]}
            value={draftKind}
            onChange={e => setDraftKind(e.target.value as FinanceCategoryKind)}
          />
        )}
        <Button size="sm" loading={props.busy} onClick={props.onSubmit}>Salvar</Button>
        <Button size="sm" variant="ghost" onClick={props.onCancel} disabled={props.busy} aria-label="Cancelar">
          <IconX />
        </Button>
      </div>
    )
  }

  /** Ações de uma linha: inativar/reativar e (quando permitido) excluir. */
  function rowActions(node: FinanceCategory) {
    const inactive = node.status !== 'active'
    return (
      <div className={shared.acoes}>
        <button
          type="button"
          className={shared.acaoBtn}
          title={inactive ? 'Reativar' : 'Inativar'}
          aria-label={`${inactive ? 'Reativar' : 'Inativar'} ${node.name}`}
          onClick={() => applyStatus([node.id], inactive ? 'active' : 'inactive')}
        >
          {inactive ? <IconCheck /> : <IconBan />}
        </button>
      </div>
    )
  }

  return (
    <div className={styles.raiz}>
      <div className={styles.barra}>
        {/* size="sm" nos três — SegmentedControl e Input não tinham porte
            explícito e caíam no `md` (40px) por padrão, contra o Button `sm`
            (32px) ao lado. As três alturas agora vêm do mesmo tier. */}
        <SegmentedControl size="sm" options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
        <div className={styles.barraDireita}>
          <Input
            className={styles.busca}
            placeholder="Buscar categoria..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="sm"
          />
          <Button
            size="sm"
            iconLeft={<IconPlus />}
            onClick={() => startAdd({ parentId: null, kind: filter === 'revenue' ? 'revenue' : 'expense' })}
          >
            Nova categoria
          </Button>
        </div>
      </div>

      {/* Barra de lote — só existe com algo selecionado. */}
      {selectedList.length > 0 && (
        <div className={styles.lote}>
          <span className={styles.loteTexto}>
            <strong>{selectedList.length}</strong> selecionada{selectedList.length > 1 ? 's' : ''}
          </span>
          <div className={styles.loteAcoes}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => applyStatus(selectedList.map(c => c.id), 'inactive')}
            >
              Inativar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => applyStatus(selectedList.map(c => c.id), 'active')}
            >
              Reativar
            </Button>
            {/* Excluir some quando a seleção é só de categorias de referência —
                o botão não teria o que apagar. */}
            {deletableCount > 0 && (
              <Button size="sm" variant="danger" onClick={() => setConfirmingDelete(true)}>
                Excluir ({deletableCount})
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} aria-label="Limpar seleção">
              <IconX />
            </Button>
          </div>
        </div>
      )}

      {draft?.parentId === null && (
        <div className={styles.novaRaiz}>
          {inlineField({
            value: draftName,
            onChange: setDraftName,
            onSubmit: submitAdd,
            onCancel: cancelAdd,
            placeholder: 'Nome da categoria (ex.: Ocupação)',
            busy: adding,
            withKind: true,
          })}
        </div>
      )}

      {groups.length === 0 ? (
        <EmptyState
          title="Nenhuma categoria encontrada"
          description={
            searching
              ? 'Nenhuma categoria ou subcategoria casa com a busca.'
              : 'Crie a primeira categoria do plano de contas clicando em "Nova categoria".'
          }
        />
      ) : (
        <div className={styles.cartao}>
          <div className={styles.scroll}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th className={styles.colSelecao}>
                    <input
                      type="checkbox"
                      className={shared.checkbox}
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      aria-label="Selecionar todas as categorias visíveis"
                    />
                  </th>
                  <th>Nome</th>
                  <th className={styles.colTipo}>Tipo</th>
                  <th className={styles.colAcoes}><span className={styles.oculto}>Ações</span></th>
                </tr>
              </thead>

              {groups.map(root => (
                <tbody key={root.id} className={styles.grupo}>
                  <tr className={`${styles.linhaRaiz} ${root.status !== 'active' ? styles['linha--inativa'] : ''}`}>
                    <td className={styles.colSelecao}>
                      <input
                        type="checkbox"
                        className={shared.checkbox}
                        checked={selected.has(root.id)}
                        onChange={() => toggleGroup(root)}
                        aria-label={`Selecionar ${root.name} e suas subcategorias`}
                      />
                    </td>
                    <td>
                      {editingId === root.id ? (
                        inlineField({
                          value: editingName,
                          onChange: setEditingName,
                          onSubmit: submitEdit,
                          onCancel: () => setEditingId(null),
                          placeholder: 'Nome da categoria',
                          busy: renaming,
                        })
                      ) : (
                        <div className={styles.celulaNome}>
                          <button
                            type="button"
                            className={styles.expandir}
                            onClick={() => toggleOpen(root.id)}
                            aria-expanded={isOpen(root.id)}
                            aria-label={`${isOpen(root.id) ? 'Recolher' : 'Expandir'} ${root.name}`}
                          >
                            {isOpen(root.id) ? <IconChevronDown /> : <IconChevronRight />}
                          </button>
                          <button
                            type="button"
                            className={`${styles.nome} ${styles['nome--raiz']}`}
                            onClick={() => startEdit(root)}
                            title="Renomear"
                          >
                            {root.name}
                          </button>
                          {root.status !== 'active' && <span className={styles.selo}>Inativa</span>}
                        </div>
                      )}
                    </td>
                    <td className={styles.colTipo}>{KIND_LABEL[root.kind]}</td>
                    <td className={styles.colAcoes}>{rowActions(root)}</td>
                  </tr>

                  {isOpen(root.id) && root.children.map(child => (
                    <tr
                      key={child.id}
                      className={`${styles.linhaFilho} ${child.status !== 'active' ? styles['linha--inativa'] : ''}`}
                    >
                      <td className={`${styles.colSelecao} ${styles['colSelecao--filho']}`}>
                        <input
                          type="checkbox"
                          className={shared.checkbox}
                          checked={selected.has(child.id)}
                          onChange={() => toggleOne(child.id)}
                          aria-label={`Selecionar ${child.name}`}
                        />
                      </td>
                      <td>
                        {editingId === child.id ? (
                          <div className={styles.celulaFilho}>
                            {inlineField({
                              value: editingName,
                              onChange: setEditingName,
                              onSubmit: submitEdit,
                              onCancel: () => setEditingId(null),
                              placeholder: 'Nome da subcategoria',
                              busy: renaming,
                            })}
                          </div>
                        ) : (
                          <div className={styles.celulaFilho}>
                            <button
                              type="button"
                              className={styles.nome}
                              onClick={() => startEdit(child)}
                              title="Renomear"
                            >
                              {child.name}
                            </button>
                            {child.status !== 'active' && <span className={styles.selo}>Inativa</span>}
                          </div>
                        )}
                      </td>
                      {/* Subcategoria não repete o tipo: ela HERDA o do pai, e o
                          banco não deixa divergir. Repetir 76 vezes "Despesa"
                          seria ruído. */}
                      <td className={styles.colTipo} />
                      <td className={styles.colAcoes}>{rowActions(child)}</td>
                    </tr>
                  ))}

                  {isOpen(root.id) && (
                    <tr className={styles.linhaAdicionar}>
                      <td colSpan={4}>
                        {draft?.parentId === root.id ? (
                          <div className={styles.celulaFilho}>
                            {inlineField({
                              value: draftName,
                              onChange: setDraftName,
                              onSubmit: submitAdd,
                              onCancel: cancelAdd,
                              placeholder: 'Nome da subcategoria',
                              busy: adding,
                            })}
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={styles.adicionar}
                            onClick={() => startAdd({ parentId: root.id, kind: root.kind })}
                          >
                            <IconPlus /> Adicionar nova subcategoria
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              ))}
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={confirmDelete}
        variant="danger"
        title={deletableCount === 1 ? 'Excluir a categoria?' : `Excluir ${deletableCount} categorias?`}
        message={
          'Excluir uma categoria leva junto as subcategorias dela. Se alguma já tiver lançamento, '
          + 'a exclusão inteira é recusada — nesse caso, inative em vez de excluir.'
        }
        confirmLabel="Excluir"
      />
    </div>
  )
}

/** 23505 = nome repetido entre irmãos (índice único do banco). */
function describeWriteError(e: unknown, name: string): string {
  const code = (e as { code?: string })?.code
  if (code === '23505') return `Já existe "${name}" neste mesmo nível.`
  return 'Não foi possível salvar a categoria.'
}

/** 23503 = FK: a categoria está em uso por algum lançamento. */
function describeDeleteError(e: unknown): string {
  const code = (e as { code?: string })?.code
  if (code === '23503') {
    return 'Há categoria com lançamento na seleção, e nada foi excluído. Inative-a: ela some dos formulários e o histórico continua.'
  }
  return 'Não foi possível excluir as categorias.'
}
