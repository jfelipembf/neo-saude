import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { signAssetUrls } from '@/lib/storage'
import { isoToBrDate } from '@/utils/date'
import type {
  PatientTest, PatientTestResult, PatientTestResultItem, GoniometryPoints, TestItemAnswers,
} from '@/types/domain'
import type { Database, Json } from '@/types/database.types'

/** Testes do catálogo fixados no sidenav de UM paciente (aba Testes do perfil). */
export async function listPatientTests(patientId: string): Promise<PatientTest[]> {
  const { data, error } = await supabase
    .from('patient_test')
    .select('id, test_id')
    .eq('patient_id', patientId)
    .eq('clinic_id', getCurrentClinicId())
  if (error) throw error
  return (data ?? []).map(row => ({ id: row.id, testId: row.test_id }))
}

/**
 * Regrava o conjunto de testes fixados no sidenav (delete-then-insert, igual
 * setAvailabilityTemplate) — cobre marcar E desmarcar num só salvamento.
 * Desmarcar aqui NÃO apaga os resultados já registrados (patient_test_result).
 */
export async function setPatientTests(patientId: string, testIds: string[]): Promise<void> {
  const clinicId = getCurrentClinicId()
  const { error: delError } = await supabase
    .from('patient_test')
    .delete()
    .eq('patient_id', patientId)
    .eq('clinic_id', clinicId)
  if (delError) throw delError
  if (testIds.length === 0) return
  const rows = testIds.map(testId => ({ clinic_id: clinicId, patient_id: patientId, test_id: testId }))
  const { error } = await supabase.from('patient_test').insert(rows)
  if (error) throw error
}

const RESULT_COLUMNS =
  'id, test_id, professional_id, level_id, level_name, level_description, score, measured_points, image_url, performed_at, care_plan_id'

type ResultRow = {
  id: string
  test_id: string
  professional_id: string | null
  level_id: string | null
  level_name: string
  level_description: string
  score: number | null
  measured_points: GoniometryPoints | null
  image_url: string | null
  performed_at: string
  care_plan_id: string | null
}

const RESULT_ITEM_COLUMNS =
  'id, result_id, item_id, option_id, points, item_code, item_label, option_label'

type ResultItemRow = {
  id: string
  result_id: string
  item_id: string | null
  option_id: string | null
  points: number
  item_code: string
  item_label: string
  option_label: string | null
}

function toResultItem(row: ResultItemRow): PatientTestResultItem {
  return {
    id: row.id,
    itemCode: row.item_code,
    itemLabel: row.item_label,
    optionLabel: row.option_label ?? undefined,
    // numeric no banco (o 1,5 da Ashworth) chega como string no PostgREST.
    points: Number(row.points),
    // Ponteiros VIVOS: viram undefined quando o item saiu do catálogo (ON
    // DELETE SET NULL). Só servem para pré-selecionar na correção — exibir é
    // sempre pelo texto congelado acima.
    itemId: row.item_id ?? undefined,
    optionId: row.option_id ?? undefined,
  }
}

function toResult(
  row: ResultRow, signed: Map<string, string>, items: PatientTestResultItem[],
): PatientTestResult {
  return {
    id: row.id,
    testId: row.test_id,
    professionalId: row.professional_id ?? undefined,
    levelId: row.level_id ?? undefined,
    levelName: row.level_name,
    levelDescription: row.level_description,
    score: row.score != null ? Number(row.score) : undefined,
    imageUrl: row.image_url ? signed.get(row.image_url) : undefined,
    // PATH bruto (pré-assinatura) — ver comentário em domain.ts: precisa
    // ir junto para a EDIÇÃO poder regravar a mesma foto sem corromper a
    // coluna com uma URL assinada (que expira em 1h).
    imagePath: row.image_url ?? undefined,
    measuredPoints: row.measured_points ?? undefined,
    performedAt: isoToBrDate(row.performed_at) ?? row.performed_at,
    carePlanId: row.care_plan_id ?? undefined,
    items,
  }
}

/**
 * Respostas item a item das aplicações informadas, agrupadas por aplicação e
 * já na ordem congelada do teste. Vazio é o caso normal: TUG, TC6 e a
 * goniometria pontuam pelo valor medido e não têm item nenhum.
 */
async function resultItemsByResult(resultIds: string[]): Promise<Map<string, PatientTestResultItem[]>> {
  const byResult = new Map<string, PatientTestResultItem[]>()
  if (resultIds.length === 0) return byResult
  const { data, error } = await supabase
    .from('patient_test_result_item')
    .select(RESULT_ITEM_COLUMNS)
    .in('result_id', resultIds)
    .order('sort_order')
  if (error) throw error
  for (const row of ((data ?? []) as ResultItemRow[])) {
    const list = byResult.get(row.result_id) ?? []
    list.push(toResultItem(row))
    byResult.set(row.result_id, list)
  }
  return byResult
}

/** Histórico de aplicações de UM teste a UM paciente — mais recente primeiro. */
export async function listPatientTestResults(patientId: string, testId: string): Promise<PatientTestResult[]> {
  const { data, error } = await supabase
    .from('patient_test_result')
    .select(RESULT_COLUMNS)
    .eq('patient_id', patientId)
    .eq('test_id', testId)
    .eq('clinic_id', getCurrentClinicId())
    .order('performed_at', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  const rows = data as ResultRow[]
  // image_url guarda o PATH do bucket privado — assina o lote de uma vez.
  const [signed, itemsByResult] = await Promise.all([
    signAssetUrls(rows.map(r => r.image_url)),
    resultItemsByResult(rows.map(r => r.id)),
  ])
  return rows.map(r => toResult(r, signed, itemsByResult.get(r.id) ?? []))
}

/** O que a aplicação MEDIU: o escore cru e, na goniometria, a foto + os 3
 *  pontos que produziram o ângulo. */
export interface TestMeasurement {
  score?: number
  imageUrl?: string
  measuredPoints?: GoniometryPoints
}

/** Uma aplicação a gravar — nova (`resultId` ausente) ou a correção de uma já
 *  registrada. É o payload de UMA chamada só: resultado, respostas e limpeza
 *  do que saiu, tudo no mesmo commit. */
export interface SaveTestResultInput extends TestMeasurement {
  /** Ausente = nova aplicação; id = corrige a aplicação existente. */
  resultId?: string
  patientId: string
  testId: string
  performedOnIso: string
  /**
   * Faixa escolhida na tela. Em 'manual' ela VENCE (há ponto de corte por
   * idade/sexo que o catálogo não modela); em 'sum_items' o banco soma e
   * classifica sozinho, e isto vira só o plano B de quando nenhuma faixa
   * cadastrada cobrir o total.
   */
  levelId?: string
  /** Respostas item a item (só em teste 'sum_items'). A aplicação vai INTEIRA:
   *  item que não vier aqui é apagado da aplicação pelo banco. */
  items?: TestItemAnswers
}

type SaveResultArgs = Database['public']['Functions']['save_patient_test_result']['Args']

/**
 * Respostas no formato da RPC: mapa `code do item` → resposta.
 *
 * Usa a forma CURTA que `save_patient_test_result` aceita (string = id da
 * opção, número = pontos digitados), e não `{option_id}`/`{points}`: menos
 * ruído no payload e a mesma leitura do outro lado. A conversão mora aqui
 * porque o domínio fala camelCase e o banco fala snake_case — deixar o
 * `optionId` vazar iria virar `option_id` nulo e erro de item obrigatório.
 */
function toItemsPayload(answers: TestItemAnswers): Json {
  const payload: Record<string, string | number> = {}
  for (const [code, answer] of Object.entries(answers)) {
    payload[code] = 'optionId' in answer ? answer.optionId : answer.points
  }
  return payload as Json
}

/**
 * Grava uma aplicação de teste (nova ou correção) numa CHAMADA SÓ, via a RPC
 * transacional `save_patient_test_result`.
 *
 * Por que RPC e não insert direto: em teste 'sum_items' o resultado e as N
 * respostas precisam entrar no mesmo commit — gravadas em duas idas, uma falha
 * no meio deixaria no prontuário um Berg com escore de 14 itens e 9 respostas.
 * De quebra o banco é quem soma e classifica, então nem front adulterado nem
 * bug de tela conseguem inflar o escore de um instrumento publicado.
 *
 * Quem aplicou (`professional_id`) sai de `auth.uid()` DENTRO da função, não do
 * payload: ela é SECURITY DEFINER e aceitar o profissional de fora seria deixar
 * assinar aplicação em nome de outro.
 *
 * Devolve o id do resultado gravado.
 */
export async function savePatientTestResult(input: SaveTestResultInput): Promise<string> {
  const { data, error } = await supabase.rpc('save_patient_test_result', {
    // `p_result` sai do gerador de tipos como `string` obrigatório só porque o
    // parâmetro não tem DEFAULT no SQL — o contrato da função é "nulo = insere,
    // id = corrige". O cast fica aqui, num lugar só, em vez de espalhar.
    p_result: input.resultId ?? null,
    p_patient: input.patientId,
    p_test: input.testId,
    // Campo de data limpo vira nulo, e não '' — a RPC tem `coalesce(…,
    // current_date)` para isso; a string vazia estouraria no cast para `date`.
    p_performed_at: input.performedOnIso || null,
    p_level: input.levelId ?? null,
    p_score: input.score ?? null,
    p_items: toItemsPayload(input.items ?? {}),
    p_image_url: input.imageUrl ?? null,
    // Os 3 pontos só fazem sentido junto da foto que eles marcam: sem imagem,
    // guardar coordenadas soltas deixaria uma régua apontando para o nada.
    p_measured_points: (input.imageUrl && input.measuredPoints
      ? (input.measuredPoints as unknown as Json)
      : null),
  } as unknown as SaveResultArgs)
  if (error) throw error
  return data as string
}

/** Apaga um resultado lançado por engano. */
export async function deletePatientTestResult(id: string): Promise<void> {
  const { error } = await supabase.from('patient_test_result').delete().eq('id', id)
  if (error) throw error
}
