import { signAssetUrls } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'

/**
 * AVALIAÇÃO FÍSICA — uma linha por LEITURA, com o exame inteiro junto.
 *
 * Peso e altura moram aqui com o resto porque os derivados só significam algo
 * contra os números do MESMO momento: 22% de gordura em cima de 80kg é 17,6kg
 * de gordura; em cima de 95kg é 20,9kg. Guardar o peso noutra tabela deixaria o
 * percentual órfão do número que o gerou.
 *
 * IMC e relação cintura/quadril NÃO estão aqui como campos de escrita: são
 * colunas geradas pelo banco. Digitados, divergiriam do peso na primeira
 * correção que ninguém lembrasse de refazer.
 *
 * O perfil do paciente NÃO tem peso próprio: um gatilho do banco copia para lá
 * a leitura não-nula mais recente de cada campo. Por isso a tela de perfil e
 * esta nunca discordam — é o mesmo número, não duas cópias.
 */

export interface BodyComposition {
  id: string
  /** ISO — quando foi MEDIDO, não quando foi digitado. */
  medidoEm: string
  /** Tratamento em curso na hora da leitura — carimbado pelo banco
   *  (`tg_carimba_plano`), não pelo cliente. Ausente em leituras de antes
   *  desse vínculo existir, ou feitas sem tratamento ativo. */
  carePlanId?: string
  pesoKg?: number
  alturaCm?: number
  /** Calculado pelo banco; só existe quando a leitura tem peso E altura. */
  imc?: number
  gorduraPercent?: number
  massaGorduraKg?: number
  massaMagraKg?: number
  massaMuscularKg?: number
  massaOsseaKg?: number
  proteinaKg?: number
  mineraisKg?: number
  aguaCorporalL?: number
  aguaPercent?: number
  gorduraVisceral?: number
  taxaMetabolicaKcal?: number
  idadeMetabolica?: number
  cinturaCm?: number
  quadrilCm?: number
  /** Calculado pelo banco a partir de cintura e quadril. */
  relacaoCinturaQuadril?: number
  /** URLs, na ordem em que foram enviadas (frente, perfil, costas…). */
  fotos: string[]
  observacao?: string
}

// Literal, e não um array com `.join()`: o supabase-js infere o tipo do
// retorno a partir do TEXTO da seleção, e uma string montada em tempo de
// execução derruba a inferência para `GenericStringError`.
const COLUNAS = 'id, measured_at, care_plan_id, weight_kg, height_cm, bmi, body_fat_percent, fat_mass_kg, lean_mass_kg, skeletal_muscle_kg, bone_mass_kg, protein_kg, mineral_kg, total_body_water_l, body_water_percent, visceral_fat_level, basal_metabolic_rate_kcal, metabolic_age_years, waist_cm, hip_cm, waist_hip_ratio, photos, notes'

/** `numeric` chega do PostgREST como string — perder isto vira "80.10" + 1 = "80.101". */
function num(v: unknown): number | undefined {
  return v == null ? undefined : Number(v)
}

type Row = Record<string, unknown>

function toAvaliacao(r: Row): BodyComposition {
  return {
    id: r.id as string,
    medidoEm: r.measured_at as string,
    carePlanId: (r.care_plan_id as string | null) ?? undefined,
    pesoKg: num(r.weight_kg),
    alturaCm: num(r.height_cm),
    imc: num(r.bmi),
    gorduraPercent: num(r.body_fat_percent),
    massaGorduraKg: num(r.fat_mass_kg),
    massaMagraKg: num(r.lean_mass_kg),
    massaMuscularKg: num(r.skeletal_muscle_kg),
    massaOsseaKg: num(r.bone_mass_kg),
    proteinaKg: num(r.protein_kg),
    mineraisKg: num(r.mineral_kg),
    aguaCorporalL: num(r.total_body_water_l),
    aguaPercent: num(r.body_water_percent),
    gorduraVisceral: num(r.visceral_fat_level),
    taxaMetabolicaKcal: num(r.basal_metabolic_rate_kcal),
    idadeMetabolica: num(r.metabolic_age_years),
    cinturaCm: num(r.waist_cm),
    quadrilCm: num(r.hip_cm),
    relacaoCinturaQuadril: num(r.waist_hip_ratio),
    fotos: (r.photos as string[] | null) ?? [],
    observacao: (r.notes as string | null) ?? undefined,
  }
}

/**
 * Histórico do paciente, do mais ANTIGO para o mais novo — a ordem do gráfico.
 * A lista "últimas avaliações" inverte na tela, que é barato; o contrário
 * obrigaria o gráfico a inverter a cada renderização.
 */
export async function listBodyCompositions(patientId: string): Promise<BodyComposition[]> {
  const { data, error } = await supabase
    .from('patient_body_composition')
    .select(COLUNAS)
    .eq('patient_id', patientId)
    .order('measured_at', { ascending: true })
    // Desempate: duas leituras no mesmo instante sairiam em ordem indefinida,
    // e o gráfico trocaria os pontos de lugar entre uma visita e outra.
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
  if (error) throw error

  // O bucket é PRIVADO: a coluna guarda o path, e `<img src>` precisa de URL
  // assinada. Assinar aqui, no service, é o padrão do projeto — a tela não
  // deve saber que existe bucket. Um lote só para todas as fotos de todas as
  // leituras, em vez de uma chamada por foto.
  const linhas = data as Row[]
  const assinadas = await signAssetUrls(
    linhas.flatMap(r => (r.photos as string[] | null) ?? []),
  )

  return linhas.map(r => {
    const a = toAvaliacao(r)
    // Path que a assinatura não devolveu (arquivo removido do bucket) sai da
    // lista: `<img>` quebrado é pior que foto ausente.
    a.fotos = a.fotos.map(p => assinadas.get(p)).filter((u): u is string => Boolean(u))
    return a
  })
}

export interface NovaAvaliacaoFisica {
  patientId: string
  /** ISO. Padrão: agora. */
  medidoEm?: string
  professionalId?: string | null
  pesoKg?: number
  alturaCm?: number
  gorduraPercent?: number
  massaGorduraKg?: number
  massaMagraKg?: number
  massaMuscularKg?: number
  massaOsseaKg?: number
  proteinaKg?: number
  mineraisKg?: number
  aguaCorporalL?: number
  aguaPercent?: number
  gorduraVisceral?: number
  taxaMetabolicaKcal?: number
  idadeMetabolica?: number
  cinturaCm?: number
  quadrilCm?: number
  fotos?: string[]
  observacao?: string
}

/** As chaves do banco, na ordem em que a tela as apresenta. */
function toLinha(a: NovaAvaliacaoFisica) {
  return {
    weight_kg: a.pesoKg ?? null,
    height_cm: a.alturaCm ?? null,
    body_fat_percent: a.gorduraPercent ?? null,
    fat_mass_kg: a.massaGorduraKg ?? null,
    lean_mass_kg: a.massaMagraKg ?? null,
    skeletal_muscle_kg: a.massaMuscularKg ?? null,
    bone_mass_kg: a.massaOsseaKg ?? null,
    protein_kg: a.proteinaKg ?? null,
    mineral_kg: a.mineraisKg ?? null,
    total_body_water_l: a.aguaCorporalL ?? null,
    body_water_percent: a.aguaPercent ?? null,
    visceral_fat_level: a.gorduraVisceral ?? null,
    basal_metabolic_rate_kcal: a.taxaMetabolicaKcal ?? null,
    metabolic_age_years: a.idadeMetabolica ?? null,
    waist_cm: a.cinturaCm ?? null,
    hip_cm: a.quadrilCm ?? null,
    // `[]` e não null: a coluna é NOT NULL com default, e mandar null
    // explicitamente sobrescreveria o default com erro.
    photos: a.fotos ?? [],
    notes: a.observacao?.trim() || null,
  }
}

export async function addBodyComposition(a: NovaAvaliacaoFisica): Promise<void> {
  const { data, error } = await supabase
    .from('patient_body_composition')
    .insert({
      clinic_id: getCurrentClinicId(),
      patient_id: a.patientId,
      professional_id: a.professionalId ?? null,
      measured_at: a.medidoEm ?? new Date().toISOString(),
      ...toLinha(a),
    })
    .select('id')

  if (error) {
    // O CHECK do banco vira frase de gente: sem isto o usuário lê
    // "new row violates check constraint patient_body_composition_weight_kg_check".
    if (error.code === '23514') {
      throw new Error('Algum valor está fora da faixa aceita. Confira os números digitados.')
    }
    throw error
  }
  // Zero linhas = a RLS recusou em silêncio — o PostgREST devolve sucesso.
  if (!data?.length) throw new Error('Sem permissão para registrar avaliação física.')
}

export async function removeBodyComposition(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('patient_body_composition').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Sem permissão para remover esta avaliação.')
}
