import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import type { Goal, GoalMetric } from '@/types/domain'

type GoalRow = { id: string; clinic_id: string; metric: GoalMetric; target_value: number }

/** Metas cadastradas pela clínica. Métrica ausente na lista = meta não definida. */
export async function listGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('clinic_goal')
    .select('id, clinic_id, metric, target_value')
    .eq('clinic_id', getCurrentClinicId())
    .order('metric')
  if (error) throw error
  return (data as GoalRow[]).map(g => ({
    id: g.id,
    clinicId: g.clinic_id,
    metric: g.metric,
    targetValue: Number(g.target_value),
  }))
}

/**
 * Grava a meta de uma métrica (cria ou atualiza), pela RPC `set_clinic_goal`.
 *
 * NÃO usa `.upsert()` do supabase-js, e o motivo é o único jeito de isto
 * funcionar: o PostgREST monta o `on conflict ... do update` atribuindo TODAS
 * as colunas do payload (`set clinic_id = excluded.clinic_id, metric =
 * excluded.metric, ...`), mas `clinic_goal` só concede UPDATE em
 * `target_value`. Como o Postgres confere privilégio de coluna do SET no plano
 * da instrução, o upsert estourava 42501 já na PRIMEIRA gravação — sem
 * conflito algum. A RPC mantém o `on conflict` (atômico, uma ida só) com o SET
 * restrito a `target_value`, que é exatamente o que o grant permite.
 *
 * `targetValue` DEVE ser > 0: o banco tem CHECK e recusa zero. Quem quer zerar
 * chama `removeGoal` — ausência de meta se representa apagando a linha, não
 * gravando zero (zero seria lido como "meta batida em 100%" no cartão).
 */
export async function saveGoal(metric: GoalMetric, targetValue: number): Promise<void> {
  const { error } = await supabase.rpc('set_clinic_goal', {
    p_clinic: getCurrentClinicId(),
    p_metric: metric,
    p_target: targetValue,
  })
  if (error) throw error
}

/** Apaga a meta da métrica — a clínica volta a não ter alvo para ela. */
export async function removeGoal(metric: GoalMetric): Promise<void> {
  const { error } = await supabase
    .from('clinic_goal')
    .delete()
    .eq('clinic_id', getCurrentClinicId())
    .eq('metric', metric)
  if (error) throw error
}
