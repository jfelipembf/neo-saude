import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { getCurrentProfessionalId } from '@/services/professionalsService'
import type { Provedor, UsoBruto } from '@/lib/cibelly/pricing'

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
   *  parte). Recalculado no servidor pela duração da sessão. */
  whisperCostUsd: number
  totalTokens: number
  startedAt: string
  endedAt: string
}

export interface DadosDeUso {
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
}

/**
 * O que a linha precisa e que NÃO dá para descobrir enquanto a aba morre:
 * durante `pagehide` nada assíncrono termina. Por isso é colhido na CONEXÃO e
 * guardado — ver recordCibellyUsageOnUnload.
 */
export interface ContextoDeGravacao {
  clinicId: string
  professionalId: string | null
  accessToken: string | null
}

/** Colhe o contexto na conexão, enquanto ainda dá tempo de esperar promessa. */
export async function prepareCibellyUsageContext(): Promise<ContextoDeGravacao> {
  const { data } = await supabase.auth.getSession()
  let professionalId: string | null = null
  try { professionalId = await getCurrentProfessionalId() } catch { /* sem perfil */ }
  return {
    clinicId: getCurrentClinicId(),
    professionalId,
    accessToken: data.session?.access_token ?? null,
  }
}

/**
 * Monta a linha. Separado do envio porque o caminho do unload não pode await.
 *
 * `cost_usd` NÃO vai aqui — e não é omissão, é recusa do banco: a coluna ficou
 * fora do GRANT de INSERT e uma trigger a calcula a partir dos tokens e da
 * tabela `cibelly_price`. Quem é medido não escreve a medição; enviar o valor
 * pronto deixava a base de custo à mercê de um POST no PostgREST.
 *
 * `whisper_cost_usd` continua indo, mas só como SINAL (1 = transcrição estava
 * ligada). O valor é recalculado no servidor pela duração real da linha.
 */
function montarLinha(params: DadosDeUso, ctx: Pick<ContextoDeGravacao, 'clinicId' | 'professionalId'>) {
  return {
    clinic_id: ctx.clinicId,
    patient_id: params.patientId,
    professional_id: ctx.professionalId,
    provider: params.provider,
    model: params.model,
    text_input_tokens: params.uso.textoEntrada,
    audio_input_tokens: params.uso.audioEntrada,
    text_cached_tokens: params.uso.textoEntradaCache,
    audio_cached_tokens: params.uso.audioEntradaCache,
    text_output_tokens: params.uso.textoSaida,
    audio_output_tokens: params.uso.audioSaida,
    // Sinal, não valor: 1 diz "a transcrição estava ligada"; o servidor troca
    // pelo custo real calculado sobre a duração da linha.
    whisper_cost_usd: params.provider === 'openai' && params.transcricaoLigada ? 1 : 0,
    started_at: params.startedAt.toISOString(),
    ended_at: params.endedAt.toISOString(),
  }
}

/** Sessão sem token nenhum (conectou e caiu na hora) não vira linha. */
function semUso(uso: UsoBruto): boolean {
  return Object.values(uso).every(v => v === 0)
}

/**
 * GRAVA A SESSÃO QUANDO A ABA ESTÁ FECHANDO — e este é o caminho NORMAL, não o
 * excepcional: a Cibelly conecta ao carregar o app e a sessão só termina quando
 * a aba fecha. O cleanup de efeito do React não roda no unload, então enquanto
 * só existia aquele caminho quase nenhuma sessão virava linha — 11 gravadas
 * contra uma fatura da Google 4× maior.
 *
 * `fetch` com `keepalive: true` em vez de `sendBeacon`: o beacon não deixa
 * mandar cabeçalho, e sem `Authorization` a RLS recusa o insert.
 */
export function recordCibellyUsageOnUnload(params: DadosDeUso, ctx: ContextoDeGravacao): void {
  if (semUso(params.uso) || !ctx.accessToken) return
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) return
  try {
    void fetch(`${url}/rest/v1/cibelly_usage`, {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${ctx.accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(montarLinha(params, ctx)),
    }).catch(() => {})
  } catch { /* aba morrendo: não há a quem reclamar */ }
}

/** Grava UMA sessão de voz encerrada. Chamado no fim de useCibelly.ts — nunca
 *  lança: perder este registro não pode derrubar o encerramento do atendimento. */
export async function recordCibellyUsage(params: DadosDeUso): Promise<void> {
  // Sessão sem nenhum token real (conectou e desconectou na hora, sem turno
  // nenhum) não vira linha — só polui a comparação com zeros.
  if (semUso(params.uso)) return

  try {
    const { error } = await supabase.from('cibelly_usage').insert(montarLinha(params, {
      clinicId: getCurrentClinicId(),
      professionalId: await getCurrentProfessionalId().catch(() => null),
    }))
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
