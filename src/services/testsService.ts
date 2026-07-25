import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { signAssetUrls } from '@/lib/storage'
import type {
  PhysioTest, PhysioTestItem, PhysioTestItemOption, PhysioTestLevel, TestItemInputKind,
  TestKind, TestScoringKind,
} from '@/types/domain'

const COLUMNS = 'id, clinic_id, name, specialty, image_url, instructions, kind, scoring_kind, is_seed'

type TestRow = {
  id: string
  clinic_id: string
  name: string
  specialty: string
  image_url: string | null
  instructions: string | null
  kind: TestKind
  scoring_kind: TestScoringKind
  is_seed: boolean
}

const LEVEL_COLUMNS = 'id, test_id, name, description, min_score, max_score'

type LevelRow = {
  id: string
  test_id: string
  name: string
  description: string
  min_score: number | null
  max_score: number | null
}

const ITEM_COLUMNS = 'id, test_id, code, label, help, input_kind'

type ItemRow = {
  id: string
  test_id: string
  code: string
  label: string
  help: string | null
  input_kind: TestItemInputKind
}

const OPTION_COLUMNS = 'id, item_id, label, points'

type OptionRow = {
  id: string
  item_id: string
  label: string
  points: number
}

/**
 * A qual faixa um escore pertence — espelho de
 * `private.physio_test_level_for_score`, que a TELA NÃO PODE CHAMAR (a função
 * tem `revoke execute from public`). Mesmas três regras do banco:
 *   · faixa sem NENHUM limite é qualitativa (GMFCS, PEDI, PERFECT, Ritchie) e
 *     nunca casa — sem esse filtro ela engoliria qualquer escore, porque as
 *     duas comparações abaixo são verdadeiras quando o limite é nulo;
 *   · [min, max] fechada dos dois lados, nulo = lado aberto;
 *   · varredura do MAIOR sort_order para o menor, então um valor no limite
 *     compartilhado por duas faixas vizinhas cai na de cima (TUG 20 s é
 *     "20 – 29 segundos", não "10 – 19 segundos").
 * `levels` chega já ordenado por sort_order (listTests ordena) — daí o laço
 * de trás para frente.
 */
export function levelForScore(levels: PhysioTestLevel[], score: number): PhysioTestLevel | undefined {
  for (let i = levels.length - 1; i >= 0; i--) {
    const level = levels[i]
    if (level.minScore == null && level.maxScore == null) continue
    if (level.minScore != null && score < level.minScore) continue
    if (level.maxScore != null && score > level.maxScore) continue
    return level
  }
  return undefined
}

/** true = o teste classifica por escore; false = catálogo só qualitativo, em
 *  que o nível é sempre escolhido a dedo pelo profissional. */
export function hasScoreBands(levels: PhysioTestLevel[]): boolean {
  return levels.some(l => l.minScore != null || l.maxScore != null)
}

/**
 * true = a aplicação é respondida ITEM A ITEM e quem soma é o banco.
 * Confere as DUAS coisas de propósito: um teste marcado 'sum_items' sem item
 * nenhum é cadastro pela metade, e tratá-lo como somatório abriria um
 * formulário vazio, sem campo de escore e sem nada a responder.
 */
export function isItemScored(test: PhysioTest): boolean {
  return test.scoringKind === 'sum_items' && test.items.length > 0
}

function toTest(row: TestRow): PhysioTest {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    kind: row.kind,
    scoringKind: row.scoring_kind,
    specialty: row.specialty,
    imageUrl: row.image_url ?? undefined,
    imagePath: row.image_url ?? undefined,
    instructions: row.instructions ?? undefined,
    levels: [],
    items: [],
    isSeed: row.is_seed,
  }
}

/** Catálogo de testes (Administrativo → Testes) — teste + níveis + itens. */
export async function listTests(): Promise<PhysioTest[]> {
  const clinicId = getCurrentClinicId()
  const [
    { data: testRows, error: testsError },
    { data: levelRows, error: levelsError },
    { data: itemRows, error: itemsError },
    { data: optionRows, error: optionsError },
  ] = await Promise.all([
    supabase.from('physio_test').select(COLUMNS).eq('clinic_id', clinicId).order('name'),
    supabase.from('physio_test_level').select(LEVEL_COLUMNS).eq('clinic_id', clinicId).order('sort_order'),
    supabase.from('physio_test_item').select(ITEM_COLUMNS).eq('clinic_id', clinicId).order('sort_order'),
    supabase.from('physio_test_item_option').select(OPTION_COLUMNS).eq('clinic_id', clinicId).order('sort_order'),
  ])
  if (testsError) throw testsError
  if (levelsError) throw levelsError
  if (itemsError) throw itemsError
  if (optionsError) throw optionsError

  const rows = testRows as TestRow[]
  // image_url guarda o PATH do bucket privado — assina o lote de uma vez.
  const signed = await signAssetUrls(rows.map(r => r.image_url))

  const levelsByTest = new Map<string, PhysioTestLevel[]>()
  for (const lv of ((levelRows ?? []) as LevelRow[])) {
    const list = levelsByTest.get(lv.test_id) ?? []
    list.push({
      id: lv.id,
      name: lv.name,
      description: lv.description,
      minScore: lv.min_score ?? undefined,
      maxScore: lv.max_score ?? undefined,
    })
    levelsByTest.set(lv.test_id, list)
  }

  const optionsByItem = new Map<string, PhysioTestItemOption[]>()
  for (const op of ((optionRows ?? []) as OptionRow[])) {
    const list = optionsByItem.get(op.item_id) ?? []
    list.push({ id: op.id, label: op.label, points: Number(op.points) })
    optionsByItem.set(op.item_id, list)
  }

  const itemsByTest = new Map<string, PhysioTestItem[]>()
  for (const it of ((itemRows ?? []) as ItemRow[])) {
    const list = itemsByTest.get(it.test_id) ?? []
    list.push({
      id: it.id,
      code: it.code,
      label: it.label,
      help: it.help ?? undefined,
      inputKind: it.input_kind,
      options: optionsByItem.get(it.id) ?? [],
    })
    itemsByTest.set(it.test_id, list)
  }

  return rows.map(row => {
    const test = toTest(row)
    test.imageUrl = row.image_url ? signed.get(row.image_url) : undefined
    test.levels = levelsByTest.get(row.id) ?? []
    test.items = itemsByTest.get(row.id) ?? []
    return test
  })
}

/** Uma opção no payload de edição. `id` presente = opção que já existe no
 *  catálogo (é ATUALIZADA no lugar); ausente = opção nova. */
export interface EditTestItemOption {
  id?: string
  label: string
  points: number
}

/**
 * Um item no payload de edição.
 *
 * `id` presente = item que já existe (atualizado no lugar, MANTENDO o id e o
 * `code`); ausente = item novo, e aí o `code` é gerado aqui. Isso é o oposto do
 * que replaceLevels faz com os níveis, e é de propósito — ver syncItems.
 */
export interface EditTestItem {
  id?: string
  label: string
  help?: string
  inputKind: TestItemInputKind
  /** Vazio em inputKind = 'number' (não há alternativa a escolher). */
  options: EditTestItemOption[]
}

/** Dados do formulário do teste (id nasce aqui; níveis reescritos inteiros). */
export interface EditTest {
  name: string
  specialty: string
  kind: TestKind
  scoringKind: TestScoringKind
  imageUrl?: string
  instructions?: string
  /** minScore/maxScore ausentes = faixa aberta naquele lado (ou nível
   *  qualitativo, quando faltam os dois) — ver PhysioTestLevel. */
  levels: { name: string; description: string; minScore?: number; maxScore?: number }[]
  items: EditTestItem[]
}

function toRow(payload: EditTest) {
  return {
    name: payload.name,
    specialty: payload.specialty,
    kind: payload.kind,
    scoring_kind: payload.scoringKind,
    image_url: payload.imageUrl ?? null,
    instructions: payload.instructions ?? null,
  }
}

/**
 * Regrava os níveis do teste (tabela filha). Igual replaceEducation.
 *
 * É delete-then-insert: as linhas antigas SOMEM, com min_score/max_score
 * junto. Por isso os limites têm de vir no payload em toda gravação — quem
 * edita só o nome de um nível reescreve a tabela inteira, e um `EditTest` sem
 * os limites zeraria as 136 faixas semeadas do catálogo.
 */
async function replaceLevels(clinicId: string, testId: string, levels: EditTest['levels']): Promise<void> {
  const { error: delError } = await supabase.from('physio_test_level').delete().eq('test_id', testId)
  if (delError) throw delError
  if (levels.length === 0) return
  const rows = levels.map((lv, index) => ({
    clinic_id: clinicId,
    test_id: testId,
    name: lv.name,
    description: lv.description,
    sort_order: index,
    min_score: lv.minScore ?? null,
    max_score: lv.maxScore ?? null,
  }))
  const { error } = await supabase.from('physio_test_level').insert(rows)
  if (error) throw error
}

/**
 * `code` é a chave ESTÁVEL do item dentro do teste — é por ela que o payload de
 * respostas casa com o catálogo. Nasce do enunciado só para ficar legível em
 * consulta ao banco; depois de criado NUNCA é regerado, senão renomear o item
 * quebraria a gravação de quem estivesse com o formulário aberto.
 * Sem letra aproveitável (item só com pontuação/emoji) cai em 'item'.
 */
function slugifyCode(label: string): string {
  const slug = label
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32)
  return slug || 'item'
}

/** Código livre dentro do teste — a unique (test_id, code) do banco recusaria
 *  o segundo "Levantar da cadeira" de um teste com dois itens homônimos. */
function uniqueCode(label: string, taken: Set<string>): string {
  const base = slugifyCode(label)
  let code = base
  let suffix = 2
  while (taken.has(code)) code = `${base}_${suffix++}`
  taken.add(code)
  return code
}

/**
 * Itens do catálogo que JÁ FORAM RESPONDIDOS por algum paciente, dentre os
 * informados. A leitura pode voltar vazia para quem não enxerga prontuário (a
 * policy de patient_test_result_item exige a permissão 'patients'); nesse caso
 * a exclusão segue, e é o ON DELETE SET NULL do banco que protege o histórico —
 * a resposta perde o ponteiro para o catálogo, mas o texto congelado fica.
 */
async function answeredItemLabels(itemIds: string[]): Promise<string[]> {
  if (itemIds.length === 0) return []
  const { data, error } = await supabase
    .from('patient_test_result_item')
    .select('item_id, item_label')
    .in('item_id', itemIds)
  if (error) throw error
  return [...new Set((data ?? []).map(row => row.item_label))]
}

/**
 * Sincroniza itens e opções do teste com o que veio do formulário.
 *
 * NÃO é delete-then-insert como os níveis, e a diferença é o ponto:
 *   · o nível é lido do resultado por TEXTO CONGELADO, então recriar a linha
 *     não custa nada ao prontuário;
 *   · o item é APONTADO pela resposta (patient_test_result_item.item_id, ON
 *     DELETE SET NULL). Apagar e recriar tudo a cada "Salvar"
 *     zeraria o ponteiro de TODAS as respostas já gravadas — o texto sobrevive,
 *     mas a aplicação deixa de ser reabrível para correção e o item some dos
 *     relatórios por item. Corrigir uma vírgula no enunciado do item 3 do Berg
 *     não pode desatar o histórico inteiro do paciente.
 * Por isso: item com id é ATUALIZADO no lugar, item novo é inserido, e só o que
 * o usuário REMOVEU de fato é apagado — e mesmo isso é recusado quando já há
 * resposta gravada (ver answeredItemLabels).
 */
async function syncItems(clinicId: string, testId: string, items: EditTestItem[]): Promise<void> {
  const [{ data: currentItems, error: itemsError }, { data: currentOptions, error: optionsError }] =
    await Promise.all([
      supabase.from('physio_test_item').select('id, code').eq('test_id', testId),
      supabase.from('physio_test_item_option').select('id, item_id').eq('clinic_id', clinicId),
    ])
  if (itemsError) throw itemsError
  if (optionsError) throw optionsError

  const currentIds = new Set((currentItems ?? []).map(i => i.id))
  const keptIds = new Set(items.map(i => i.id).filter((id): id is string => Boolean(id) && currentIds.has(id!)))
  const removedIds = [...currentIds].filter(id => !keptIds.has(id))

  if (removedIds.length > 0) {
    const answered = await answeredItemLabels(removedIds)
    if (answered.length > 0) {
      throw new Error(
        `Não é possível remover ${answered.length === 1 ? 'o item' : 'os itens'} `
        + `"${answered.join('", "')}": ${answered.length === 1 ? 'ele já foi respondido' : 'eles já foram respondidos'} `
        + 'em aplicações registradas. Corrija o enunciado em vez de excluir.',
      )
    }
    const { error } = await supabase.from('physio_test_item').delete().in('id', removedIds)
    if (error) throw error
  }

  // Códigos em uso pelos itens que FICAM — o novo não pode colidir com eles.
  const taken = new Set(
    (currentItems ?? []).filter(i => keptIds.has(i.id)).map(i => i.code),
  )

  const optionsByItem = new Map<string, string[]>()
  for (const op of (currentOptions ?? [])) {
    optionsByItem.set(op.item_id, [...(optionsByItem.get(op.item_id) ?? []), op.id])
  }

  for (const [index, item] of items.entries()) {
    const fields = {
      label: item.label,
      help: item.help ?? null,
      input_kind: item.inputKind,
      sort_order: index,
    }

    let itemId = item.id && keptIds.has(item.id) ? item.id : undefined
    if (itemId) {
      const { error } = await supabase.from('physio_test_item').update(fields).eq('id', itemId)
      if (error) throw error
    } else {
      const { data, error } = await supabase
        .from('physio_test_item')
        .insert({ clinic_id: clinicId, test_id: testId, code: uniqueCode(item.label, taken), ...fields })
        .select('id')
        .single()
      if (error) throw error
      itemId = data.id
    }

    await syncOptions(clinicId, itemId, item.options, optionsByItem.get(itemId) ?? [])
  }
}

/**
 * Mesma lógica de syncItems um nível abaixo. Opção removida NÃO é bloqueada:
 * `points` e `option_label` já estão congelados na resposta, então o escore
 * histórico continua o mesmo — o que se perde é a pré-seleção ao reabrir a
 * aplicação, e travar isso impediria para sempre corrigir uma alternativa
 * cadastrada errada.
 */
async function syncOptions(
  clinicId: string, itemId: string, options: EditTestItemOption[], currentIds: string[],
): Promise<void> {
  const kept = new Set(options.map(o => o.id).filter((id): id is string => Boolean(id) && currentIds.includes(id!)))
  const removed = currentIds.filter(id => !kept.has(id))
  if (removed.length > 0) {
    const { error } = await supabase.from('physio_test_item_option').delete().in('id', removed)
    if (error) throw error
  }

  for (const [index, option] of options.entries()) {
    const fields = { label: option.label, points: option.points, sort_order: index }
    if (option.id && kept.has(option.id)) {
      const { error } = await supabase.from('physio_test_item_option').update(fields).eq('id', option.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('physio_test_item_option')
        .insert({ clinic_id: clinicId, item_id: itemId, ...fields })
      if (error) throw error
    }
  }
}

/** Cadastra um teste e devolve o `id` criado (a tela seleciona ele em seguida). */
export async function addTest(payload: EditTest): Promise<string> {
  const clinicId = getCurrentClinicId()
  const { data, error } = await supabase
    .from('physio_test')
    .insert({ clinic_id: clinicId, ...toRow(payload) })
    .select('id')
    .single()
  if (error) throw error
  await replaceLevels(clinicId, data.id, payload.levels)
  await syncItems(clinicId, data.id, payload.items)
  return data.id
}

export async function updateTest(id: string, payload: EditTest): Promise<void> {
  const clinicId = getCurrentClinicId()
  const { error } = await supabase.from('physio_test').update(toRow(payload)).eq('id', id)
  if (error) throw error
  await replaceLevels(clinicId, id, payload.levels)
  await syncItems(clinicId, id, payload.items)
}

/**
 * Exclui um teste personalizado do catálogo — a RLS já barra teste de seed
 * (is_seed=true). Se o teste já foi aplicado a algum paciente, a FK de
 * patient_test/patient_test_result bloqueia a exclusão (23503); troca pelo
 * erro cru do Postgres por uma mensagem que a tela pode mostrar direto.
 */
export async function deleteTest(id: string): Promise<void> {
  const { error } = await supabase.from('physio_test').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') {
      throw new Error('Este teste já foi aplicado a pacientes e não pode ser excluído.')
    }
    throw error
  }
}
