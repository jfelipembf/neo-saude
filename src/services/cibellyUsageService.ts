import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { getCurrentProfessionalId } from '@/services/professionalsService'
import type { Provedor, UsoBruto } from '@/lib/cibelly/pricing'
import { calcularCustoUsd, calcularCustoWhisperUsd } from '@/lib/cibelly/pricing'

/**
 * MEDIÇÃO TEMPORÁRIA — comparar o custo real de OpenAI × Gemini, lado a lado,
 * antes de escolher um só. Ver o comentário no topo de pricing.ts: esta
 * feature é um bloco isolado (esta tabela, este service, o hook de leitura e
 * um trecho marcado em useCibelly.ts/DashboardPage.tsx), feito para sair
 * inteiro quando a comparação acabar.
 */
export interface CibellyUsageRow {
  id: string
  patientId: string | null
  provider: Provedor
  model: string
  costUsd: number
  /** Estimativa do whisper-1 (transcrição do dentista) — 0 quando desligada
   *  (`?transcrever=nao`) ou quando o provedor é Gemini (lá não é um custo à
   *  parte). Ver calcularCustoWhisperUsd em pricing.ts. */
  whisperCostUsd: number
  totalTokens: number
  startedAt: string
  endedAt: string
}

/** Grava UMA sessão de voz encerrada. Chamado no fim de useCibelly.ts — nunca
 *  lança: perder este registro não pode derrubar o encerramento do atendimento. */
export async function recordCibellyUsage(params: {
  patientId: string | null
  provider: Provedor
  model: string
  uso: UsoBruto
  startedAt: Date
  endedAt: Date
  /** Transcrição do dentista estava ligada nesta sessão? Só a OpenAI cobra
   *  isso à parte (whisper-1) — no Gemini o áudio dele já está nos tokens de
   *  entrada normais, então este parâmetro é ignorado fora do ramo 'openai'. */
  transcricaoLigada: boolean
}): Promise<void> {
  // Sessão sem nenhum token real (conectou e desconectou na hora, sem turno
  // nenhum) não vira linha — só polui a comparação com zeros.
  const custoUsd = calcularCustoUsd(params.uso, params.provider, params.model)
  const semUso = Object.values(params.uso).every(v => v === 0)
  if (semUso) return

  const duracaoSegundos = (params.endedAt.getTime() - params.startedAt.getTime()) / 1000
  const whisperCostUsd = params.provider === 'openai' && params.transcricaoLigada
    ? calcularCustoWhisperUsd(duracaoSegundos)
    : 0

  try {
    const professionalId = await getCurrentProfessionalId()
    const { error } = await supabase.from('cibelly_usage').insert({
      clinic_id: getCurrentClinicId(),
      patient_id: params.patientId,
      professional_id: professionalId,
      provider: params.provider,
      model: params.model,
      text_input_tokens: params.uso.textoEntrada,
      audio_input_tokens: params.uso.audioEntrada,
      text_cached_tokens: params.uso.textoEntradaCache,
      audio_cached_tokens: params.uso.audioEntradaCache,
      text_output_tokens: params.uso.textoSaida,
      audio_output_tokens: params.uso.audioSaida,
      cost_usd: custoUsd,
      whisper_cost_usd: whisperCostUsd,
      started_at: params.startedAt.toISOString(),
      ended_at: params.endedAt.toISOString(),
    })
    if (error) console.error('[Cibelly] falha ao gravar custo da sessão:', error)
  } catch (e) {
    console.error('[Cibelly] falha ao gravar custo da sessão:', e)
  }
}

/** Últimas sessões, para o card temporário do Dashboard. */
export async function listCibellyUsage(limite = 20): Promise<CibellyUsageRow[]> {
  const { data, error } = await supabase
    .from('cibelly_usage')
    .select('id, patient_id, provider, model, cost_usd, whisper_cost_usd, started_at, ended_at, text_input_tokens, audio_input_tokens, text_cached_tokens, audio_cached_tokens, text_output_tokens, audio_output_tokens')
    .order('started_at', { ascending: false })
    .limit(limite)
  if (error) throw error

  return (data ?? []).map(r => ({
    id: r.id,
    patientId: r.patient_id,
    provider: r.provider as Provedor,
    model: r.model,
    costUsd: Number(r.cost_usd),
    whisperCostUsd: Number(r.whisper_cost_usd),
    totalTokens: r.text_input_tokens + r.audio_input_tokens + r.text_cached_tokens
      + r.audio_cached_tokens + r.text_output_tokens + r.audio_output_tokens,
    startedAt: r.started_at,
    endedAt: r.ended_at,
  }))
}
