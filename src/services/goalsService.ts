import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import type { Goal, GoalMetric, MonthlyTargets } from '@/types/domain'

/** Meses de um ano — o comprimento fixo do vetor `clinic_goal.monthly`. */
export const MONTHS_IN_YEAR = 12

/** Uma linha da matriz pronta para gravar: a métrica e seus 12 alvos. */
export interface GoalYearInput {
  metric: GoalMetric
  monthly: MonthlyTargets
}

type GoalRow = {
  id: string
  clinic_id: string
  metric: GoalMetric
  year: number
  // `numeric[]` chega do PostgREST como array de números COM buracos nulos —
  // os tipos gerados declaram `number[]` porque o gerador não expressa
  // nulidade dentro de array, e é justamente o null que carrega significado
  // aqui ("mês sem meta"). Por isso o tipo da linha é declarado à mão.
  monthly: (number | string | null)[] | null
}

/**
 * Normaliza o vetor vindo do banco para EXATAMENTE 12 posições.
 *
 * O CHECK `clinic_goal_monthly_shape_ck` já garante isso no banco, então em
 * operação normal a função não corta nem completa nada. Ela existe porque a
 * matriz da tela indexa `monthly[i]` para i de 0 a 11 sem perguntar: um vetor
 * mais curto entregaria `undefined` ao `value` de um <input>, e o React troca
 * o campo de controlado para não-controlado no meio da digitação — um bug que
 * aparece como "o campo parou de responder", longe da causa.
 */
function toMonthly(raw: GoalRow['monthly']): MonthlyTargets {
  const list = raw ?? []
  return Array.from({ length: MONTHS_IN_YEAR }, (_, i) => {
    const value = list[i]
    if (value === null || value === undefined || value === '') return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  })
}

/**
 * Metas do ANO informado, uma linha por métrica.
 *
 * Métrica ausente da lista = a clínica não definiu nenhum mês naquele ano
 * (a RPC de gravação apaga a linha quando o ano inteiro fica em branco).
 */
export async function listGoals(year: number): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('clinic_goal')
    .select('id, clinic_id, metric, year, monthly')
    .eq('clinic_id', getCurrentClinicId())
    .eq('year', year)
    .order('metric')
  if (error) throw error

  return (data as GoalRow[]).map(row => ({
    id: row.id,
    clinicId: row.clinic_id,
    metric: row.metric,
    year: row.year,
    monthly: toMonthly(row.monthly),
  }))
}

/**
 * Grava a MATRIZ INTEIRA de um ano pela RPC `set_clinic_goals_year`.
 *
 * NÃO usa `.upsert()` do supabase-js pelo motivo documentado na migration: o
 * PostgREST monta o `on conflict do update` atribuindo TODAS as colunas do
 * payload (`clinic_id`, `metric`, `year`…), mas `clinic_goal` só concede
 * UPDATE em `monthly`. Como o Postgres confere privilégio de coluna do SET no
 * PLANO da instrução, o upsert estoura 42501 já na PRIMEIRA gravação, antes
 * mesmo de existir conflito.
 *
 * Manda SEMPRE as quatro métricas, mesmo as que o usuário não tocou, e isso é
 * intencional: a RPC apaga a linha da métrica cujos 12 meses vierem em branco.
 * Enviar só o que foi editado tiraria da tela a única forma de REMOVER as
 * metas de uma métrica — limpar os campos e salvar não faria nada.
 *
 * Um round-trip só: as quatro linhas entram na mesma transação, então ou o ano
 * inteiro fica gravado ou nada fica — nunca uma matriz meio salva.
 */
export async function saveGoals(year: number, rows: GoalYearInput[]): Promise<void> {
  const goals: Record<string, MonthlyTargets> = {}
  for (const row of rows) goals[row.metric] = row.monthly

  const { error } = await supabase.rpc('set_clinic_goals_year', {
    p_clinic: getCurrentClinicId(),
    p_year: year,
    p_goals: goals,
  })
  if (error) throw error
}
