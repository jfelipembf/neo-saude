import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'

/**
 * SINAIS VITAIS — uma linha por AFERIÇÃO, com as medidas juntas.
 *
 * Não é uma linha por medida: sinais vitais se leem em conjunto. FC 130 com
 * temperatura 38,5 conta uma história; FC 130 sozinha conta outra. Separar
 * obrigaria a reagrupar por timestamp em toda leitura, e uma aferição parcial
 * (só a pressão) viraria indistinguível de três aferições no mesmo minuto.
 */

export interface VitalSign {
  id: string
  /** Quando foi AFERIDO — não quando foi digitado. */
  medidoEm: string
  /** Tratamento em curso na hora da aferição — carimbado pelo banco
   *  (`tg_carimba_plano`), não pelo cliente. Ausente em aferições de antes
   *  desse vínculo existir, ou feitas sem tratamento ativo. */
  carePlanId?: string
  sistolica?: number
  diastolica?: number
  frequenciaCardiaca?: number
  frequenciaRespiratoria?: number
  saturacao?: number
  temperatura?: number
  observacao?: string
}

type Row = {
  id: string
  measured_at: string
  care_plan_id: string | null
  systolic_mmhg: number | null
  diastolic_mmhg: number | null
  heart_rate_bpm: number | null
  respiratory_rate: number | null
  spo2_percent: number | null
  temperature_c: number | string | null
  notes: string | null
}

const COLUNAS =
  'id, measured_at, care_plan_id, systolic_mmhg, diastolic_mmhg, heart_rate_bpm, respiratory_rate, spo2_percent, temperature_c, notes'

function toVital(r: Row): VitalSign {
  return {
    id: r.id,
    medidoEm: r.measured_at,
    carePlanId: r.care_plan_id ?? undefined,
    sistolica: r.systolic_mmhg ?? undefined,
    diastolica: r.diastolic_mmhg ?? undefined,
    frequenciaCardiaca: r.heart_rate_bpm ?? undefined,
    frequenciaRespiratoria: r.respiratory_rate ?? undefined,
    saturacao: r.spo2_percent ?? undefined,
    temperatura: r.temperature_c != null ? Number(r.temperature_c) : undefined,
    observacao: r.notes ?? undefined,
  }
}

/**
 * Histórico do paciente, do mais ANTIGO para o mais novo.
 *
 * A ordem é a do gráfico, não a da lista: série temporal se lê da esquerda para
 * a direita. Quem precisa do inverso (a lista "últimas aferições") inverte na
 * tela, que é uma operação barata — ordenar ao contrário aqui obrigaria o
 * gráfico a inverter em toda renderização.
 */
export async function listVitalSigns(patientId: string): Promise<VitalSign[]> {
  const { data, error } = await supabase
    .from('patient_vital_sign')
    .select(COLUNAS)
    .eq('patient_id', patientId)
    .order('measured_at', { ascending: true })
  if (error) throw error
  return (data as Row[]).map(toVital)
}

export interface NovoVitalSign {
  patientId: string
  /** ISO. Padrão: agora. */
  medidoEm?: string
  professionalId?: string | null
  treatmentSessionId?: string | null
  sistolica?: number
  diastolica?: number
  frequenciaCardiaca?: number
  frequenciaRespiratoria?: number
  saturacao?: number
  temperatura?: number
  observacao?: string
}

export async function addVitalSign(v: NovoVitalSign): Promise<void> {
  const { data, error } = await supabase
    .from('patient_vital_sign')
    .insert({
      clinic_id: getCurrentClinicId(),
      patient_id: v.patientId,
      professional_id: v.professionalId ?? null,
      treatment_session_id: v.treatmentSessionId ?? null,
      measured_at: v.medidoEm ?? new Date().toISOString(),
      systolic_mmhg: v.sistolica ?? null,
      diastolic_mmhg: v.diastolica ?? null,
      heart_rate_bpm: v.frequenciaCardiaca ?? null,
      respiratory_rate: v.frequenciaRespiratoria ?? null,
      spo2_percent: v.saturacao ?? null,
      temperature_c: v.temperatura ?? null,
      notes: v.observacao?.trim() || null,
    })
    .select('id')

  if (error) {
    // Os CHECKs do banco viram mensagem de gente. Sem isto o usuário recebe
    // "new row violates check constraint patient_vital_sign_sistolica_maior".
    if (error.message.includes('sistolica_maior')) {
      throw new Error('A sistólica precisa ser maior que a diastólica — confira se os campos não foram trocados.')
    }
    if (error.message.includes('tem_alguma_medida')) {
      throw new Error('Informe ao menos uma medida.')
    }
    if (error.code === '23514') {
      throw new Error('Algum valor está fora da faixa aceita. Confira os números digitados.')
    }
    throw error
  }
  // Zero linhas = a RLS recusou em silêncio (PostgREST devolve sucesso).
  if (!data?.length) throw new Error('Sem permissão para registrar sinais vitais.')
}

export async function removeVitalSign(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('patient_vital_sign').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Sem permissão para remover esta aferição.')
}
