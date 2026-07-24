import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { getCurrentProfessionalId } from '@/services/professionalsService'
import { signAssetUrls } from '@/lib/storage'
import { isoToBrDate } from '@/utils/date'
import type { PatientTest, PatientTestResult, GoniometryPoints } from '@/types/domain'
import type { Json } from '@/types/database.types'

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

type ResultRow = {
  id: string
  test_id: string
  professional_id: string | null
  level_id: string | null
  level_name: string
  level_description: string
  measured_angle: number | null
  measured_points: GoniometryPoints | null
  image_url: string | null
  performed_at: string
}

function toResult(row: ResultRow, signed: Map<string, string>): PatientTestResult {
  return {
    id: row.id,
    testId: row.test_id,
    professionalId: row.professional_id ?? undefined,
    levelId: row.level_id ?? undefined,
    levelName: row.level_name,
    levelDescription: row.level_description,
    measuredAngle: row.measured_angle != null ? Number(row.measured_angle) : undefined,
    imageUrl: row.image_url ? signed.get(row.image_url) : undefined,
    // PATH bruto (pré-assinatura) — ver comentário em domain.ts: precisa
    // ir junto para a EDIÇÃO poder regravar a mesma foto sem corromper a
    // coluna com uma URL assinada (que expira em 1h).
    imagePath: row.image_url ?? undefined,
    measuredPoints: row.measured_points ?? undefined,
    performedAt: isoToBrDate(row.performed_at) ?? row.performed_at,
  }
}

/** Histórico de aplicações de UM teste a UM paciente — mais recente primeiro. */
export async function listPatientTestResults(patientId: string, testId: string): Promise<PatientTestResult[]> {
  const { data, error } = await supabase
    .from('patient_test_result')
    .select('id, test_id, professional_id, level_id, level_name, level_description, measured_angle, measured_points, image_url, performed_at')
    .eq('patient_id', patientId)
    .eq('test_id', testId)
    .eq('clinic_id', getCurrentClinicId())
    .order('performed_at', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  const rows = data as ResultRow[]
  // image_url guarda o PATH do bucket privado — assina o lote de uma vez.
  const signed = await signAssetUrls(rows.map(r => r.image_url))
  return rows.map(r => toResult(r, signed))
}

/** Nome/descrição do nível são CONGELADOS na linha (add e edit) — lidos do
 *  catálogo agora, não referenciados por live join depois. */
async function frozenLevel(levelId: string) {
  const { data: level, error } = await supabase
    .from('physio_test_level')
    .select('name, description')
    .eq('id', levelId)
    .single()
  if (error) throw error
  return level
}

function measurementFields(measuredAngle: number | undefined, imageUrl: string | undefined, measuredPoints: GoniometryPoints | undefined) {
  return {
    measured_angle: measuredAngle ?? null,
    image_url: imageUrl ?? null,
    measured_points: imageUrl && measuredPoints ? (measuredPoints as unknown as Json) : null,
  }
}

/**
 * Registra uma nova aplicação do teste: o nível atingido + a data (sem campo
 * de observação) e, quando kind='goniometry', o ângulo medido + a foto e os
 * pontos usados na medição (desenham a régua no card de resultado).
 */
export async function addPatientTestResult(
  patientId: string, testId: string, levelId: string, performedOnIso: string,
  measuredAngle?: number, imageUrl?: string, measuredPoints?: GoniometryPoints,
): Promise<void> {
  const clinicId = getCurrentClinicId()
  const level = await frozenLevel(levelId)
  const professionalId = await getCurrentProfessionalId()

  const { error } = await supabase.from('patient_test_result').insert({
    clinic_id: clinicId,
    patient_id: patientId,
    test_id: testId,
    professional_id: professionalId,
    level_id: levelId,
    level_name: level.name,
    level_description: level.description,
    performed_at: performedOnIso,
    ...measurementFields(measuredAngle, imageUrl, measuredPoints),
  })
  if (error) throw error
}

/**
 * Corrige um resultado já registrado (nível, data, ângulo, foto/pontos da
 * medição) — identidade do registro (paciente/teste/profissional que
 * aplicou) não muda, só o conteúdo da aplicação.
 */
export async function updatePatientTestResult(
  id: string, levelId: string, performedOnIso: string,
  measuredAngle?: number, imageUrl?: string, measuredPoints?: GoniometryPoints,
): Promise<void> {
  const level = await frozenLevel(levelId)

  const { error } = await supabase.from('patient_test_result').update({
    level_id: levelId,
    level_name: level.name,
    level_description: level.description,
    performed_at: performedOnIso,
    ...measurementFields(measuredAngle, imageUrl, measuredPoints),
  }).eq('id', id)
  if (error) throw error
}

/** Apaga um resultado lançado por engano. */
export async function deletePatientTestResult(id: string): Promise<void> {
  const { error } = await supabase.from('patient_test_result').delete().eq('id', id)
  if (error) throw error
}
