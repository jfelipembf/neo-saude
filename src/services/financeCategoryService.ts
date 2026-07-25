import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import type { Insert, ClientInsert } from '@/lib/db'
import type { FinanceCategory, FinanceCategoryKind, FinanceCategoryNode } from '@/types/domain'

const clinic = () => getCurrentClinicId()

const COLS = 'id, clinic_id, parent_id, name, kind, is_seed, status'

interface Row {
  id: string
  clinic_id: string
  parent_id: string | null
  name: string
  kind: FinanceCategoryKind
  is_seed: boolean
  status: 'active' | 'inactive'
}

const toDomain = (r: Row): FinanceCategory => ({
  id: r.id,
  clinicId: r.clinic_id,
  parentId: r.parent_id ?? undefined,
  name: r.name,
  kind: r.kind,
  isSeed: r.is_seed,
  status: r.status,
})

/**
 * Plano de contas da clínica, já em árvore de dois níveis.
 *
 * Traz ATIVAS E INATIVAS de propósito: a aba de manutenção precisa mostrar as
 * inativas (é como se "apaga" uma categoria de referência, e sem vê-las ninguém
 * consegue reativar). Quem monta seletor de lançamento filtra por status —
 * ver `activeGroups`.
 */
export async function listFinanceCategories(): Promise<FinanceCategoryNode[]> {
  const { data, error } = await supabase
    .from('finance_category')
    .select(COLS)
    .eq('clinic_id', clinic())
    // A ordenação do banco já entrega a tela pronta: as raízes por tipo e nome,
    // e cada bloco de filhos em ordem alfabética. `parent_id` antes de `name`
    // agrupa os irmãos; nullsFirst põe a raiz antes dos próprios filhos.
    .order('kind')
    .order('parent_id', { nullsFirst: true })
    .order('name')

  if (error) throw error
  const rows = (data ?? []) as Row[]

  const roots: FinanceCategoryNode[] = []
  const byId = new Map<string, FinanceCategoryNode>()

  // Duas passadas: a ordenação acima garante que toda raiz aparece antes dos
  // filhos dela, mas depender dessa garantia deixaria a função quebrada no dia
  // em que alguém mexer no .order() — a segunda passada custa nada.
  for (const r of rows) {
    if (r.parent_id === null) {
      const node = { ...toDomain(r), children: [] as FinanceCategory[] }
      byId.set(r.id, node)
      roots.push(node)
    }
  }
  for (const r of rows) {
    if (r.parent_id !== null) byId.get(r.parent_id)?.children.push(toDomain(r))
  }
  return roots
}

/**
 * O que um SELETOR DE LANÇAMENTO deve oferecer: só o lado certo (despesa em
 * conta a pagar, receita em conta a receber) e só o que está ativo.
 *
 * Categoria inativa some daqui mas continua no histórico — é por isso que o
 * filtro mora aqui e não numa cláusula do banco: a mesma consulta serve a tela
 * de manutenção, que precisa enxergar tudo.
 *
 * Pai inativo leva os filhos junto: deixar "Aluguel" selecionável com
 * "Despesas" desligado seria uma categoria órfã na prática.
 */
export function activeGroups(
  tree: FinanceCategoryNode[],
  kind: FinanceCategoryKind,
): FinanceCategoryNode[] {
  return tree
    .filter(root => root.kind === kind && root.status === 'active')
    .map(root => ({ ...root, children: root.children.filter(c => c.status === 'active') }))
}

/** Rótulo cheio de uma subcategoria, do jeito que vai congelado no lançamento
 *  ("Despesas › Aluguel"). Raiz sem filhos usa só o próprio nome. */
export function categoryPath(root: { name: string }, child?: { name: string }): string {
  return child ? `${root.name} › ${child.name}` : root.name
}

export interface NewFinanceCategory {
  name: string
  kind: FinanceCategoryKind
  /** Ausente = cria categoria de primeiro nível. */
  parentId?: string
}

export async function addFinanceCategory(input: NewFinanceCategory): Promise<void> {
  const row: ClientInsert<'finance_category'> = {
    clinic_id: clinic(),
    parent_id: input.parentId ?? null,
    name: input.name,
    kind: input.kind,
    // is_seed → default false (a coluna nem está no GRANT do cliente).
    // status  → default 'active'.
  }
  const { error } = await supabase
    .from('finance_category')
    .insert(row as Insert<'finance_category'>)
  if (error) throw error
}

/** Renomear é a ÚNICA edição de conteúdo permitida: trocar o pai ou o tipo
 *  reclassificaria retroativamente lançamentos já feitos, e o GRANT do banco
 *  nem aceita (parent_id/kind ficaram de fora do update). */
export async function renameFinanceCategory(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('finance_category')
    .update({ name })
    .eq('id', id)
    .eq('clinic_id', clinic())
  if (error) throw error
}

/**
 * Ativa/inativa uma ou várias. Inativar a RAIZ tira os filhos dos seletores
 * junto (ver activeGroups) — não precisa cascatear no banco.
 *
 * Recebe LISTA e manda um `in(...)` só: a tela tem seleção em massa, e 30
 * updates em sequência seriam 30 idas ao servidor para uma operação que o
 * Postgres faz numa.
 */
export async function setFinanceCategoryStatus(
  ids: string[],
  status: 'active' | 'inactive',
): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase
    .from('finance_category')
    .update({ status })
    .in('id', ids)
    .eq('clinic_id', clinic())
  if (error) throw error
}

/** Quantas saíram de fato, e quantas o banco se recusou a apagar. */
export interface DeleteOutcome {
  deleted: number
  refused: number
}

/**
 * Exclui categorias criadas pela clínica. Duas recusas vêm do BANCO, e cada uma
 * se manifesta de um jeito DIFERENTE:
 *
 *   · categoria com lançamento → FK (ON DELETE NO ACTION) levanta ERRO 23503,
 *     e nada é apagado (a instrução inteira aborta).
 *   · categoria de referência (is_seed) → a policy de delete simplesmente não
 *     enxerga a linha. Não há erro: o Postgres apaga zero linhas e devolve
 *     sucesso.
 *
 * É por causa do segundo caso que existe o `.select('id')`: sem ele a função
 * devolveria "deu certo" para uma exclusão que não aconteceu, e a tela mostraria
 * "categoria excluída" com a categoria ainda na lista.
 */
export async function deleteFinanceCategories(ids: string[]): Promise<DeleteOutcome> {
  if (ids.length === 0) return { deleted: 0, refused: 0 }
  const { data, error } = await supabase
    .from('finance_category')
    .delete()
    .in('id', ids)
    .eq('clinic_id', clinic())
    .select('id')
  if (error) throw error
  const deleted = data?.length ?? 0
  return { deleted, refused: ids.length - deleted }
}
