import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { signAssetUrls } from '@/lib/storage'
import type { PhysioTest, PhysioTestLevel, TestKind } from '@/types/domain'

const COLUMNS = 'id, clinic_id, name, specialty, image_url, instructions, kind, is_seed'

type TestRow = {
  id: string
  clinic_id: string
  name: string
  specialty: string
  image_url: string | null
  instructions: string | null
  kind: TestKind
  is_seed: boolean
}

type LevelRow = {
  id: string
  test_id: string
  name: string
  description: string
}

function toTest(row: TestRow): PhysioTest {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    kind: row.kind,
    specialty: row.specialty,
    imageUrl: row.image_url ?? undefined,
    imagePath: row.image_url ?? undefined,
    instructions: row.instructions ?? undefined,
    levels: [],
    isSeed: row.is_seed,
  }
}

/** Catálogo de testes (Administrativo → Testes) — teste + seus níveis. */
export async function listTests(): Promise<PhysioTest[]> {
  const clinicId = getCurrentClinicId()
  const [{ data: testRows, error: testsError }, { data: levelRows, error: levelsError }] = await Promise.all([
    supabase.from('physio_test').select(COLUMNS).eq('clinic_id', clinicId).order('name'),
    supabase.from('physio_test_level').select('id, test_id, name, description').eq('clinic_id', clinicId).order('sort_order'),
  ])
  if (testsError) throw testsError
  if (levelsError) throw levelsError

  const rows = testRows as TestRow[]
  // image_url guarda o PATH do bucket privado — assina o lote de uma vez.
  const signed = await signAssetUrls(rows.map(r => r.image_url))

  const levelsByTest = new Map<string, PhysioTestLevel[]>()
  for (const lv of (levelRows ?? []) as LevelRow[]) {
    const list = levelsByTest.get(lv.test_id) ?? []
    list.push({ id: lv.id, name: lv.name, description: lv.description })
    levelsByTest.set(lv.test_id, list)
  }

  return rows.map(row => {
    const test = toTest(row)
    test.imageUrl = row.image_url ? signed.get(row.image_url) : undefined
    test.levels = levelsByTest.get(row.id) ?? []
    return test
  })
}

/** Dados do formulário do teste (id nasce aqui; níveis reescritos inteiros). */
export interface EditTest {
  name: string
  specialty: string
  kind: TestKind
  imageUrl?: string
  instructions?: string
  levels: { name: string; description: string }[]
}

function toRow(payload: EditTest) {
  return {
    name: payload.name,
    specialty: payload.specialty,
    kind: payload.kind,
    image_url: payload.imageUrl ?? null,
    instructions: payload.instructions ?? null,
  }
}

/** Regrava os níveis do teste (tabela filha). Igual replaceEducation. */
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
  }))
  const { error } = await supabase.from('physio_test_level').insert(rows)
  if (error) throw error
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
  return data.id
}

export async function updateTest(id: string, payload: EditTest): Promise<void> {
  const clinicId = getCurrentClinicId()
  const { error } = await supabase.from('physio_test').update(toRow(payload)).eq('id', id)
  if (error) throw error
  await replaceLevels(clinicId, id, payload.levels)
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
