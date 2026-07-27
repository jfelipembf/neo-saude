/**
 * CUSTO REAL DA CIBELLY — por sessão, a partir do `usage` que os dois
 * provedores devolvem durante a conversa.
 *
 * MEDIÇÃO TEMPORÁRIA, para comparar OpenAI × Gemini lado a lado antes de
 * remover este rastreamento (ver useCibelly.ts e DashboardPage.tsx — os três
 * arquivos formam um bloco só, feito para sair junto quando a comparação
 * terminar).
 *
 * Tabelas de preço em dólar por 1M tokens, tiradas da página oficial de cada
 * provedor (não de blog, que diverge entre si) em 26/07/2026:
 *  - OpenAI: developers.openai.com/api/docs/pricing
 *  - Gemini: ai.google.dev/gemini-api/docs/pricing
 * Preço muda; se este número discordar do painel do provedor, o painel está
 * certo — atualize aqui.
 */

export type Provedor = 'openai' | 'gemini'

interface TabelaDePrecos {
  textoEntrada: number
  textoEntradaCache: number
  textoSaida: number
  audioEntrada: number
  audioEntradaCache: number
  audioSaida: number
}

const OPENAI_MINI: TabelaDePrecos = {
  textoEntrada: 0.60, textoEntradaCache: 0.06, textoSaida: 2.40,
  audioEntrada: 10.00, audioEntradaCache: 0.30, audioSaida: 20.00,
}
const OPENAI_FULL: TabelaDePrecos = {
  textoEntrada: 4.00, textoEntradaCache: 0.40, textoSaida: 24.00,
  audioEntrada: 32.00, audioEntradaCache: 0.40, audioSaida: 64.00,
}
// Gemini Live NÃO tem camada de cache (a página oficial não lista uma para os
// modelos Live — bate com o que medimos antes: cachedContentTokenCount sempre
// 0). Por isso não há *EntradaCache aqui: todo token de entrada é cobrado no
// preço cheio.
const GEMINI_3_1_FLASH_LIVE: TabelaDePrecos = {
  textoEntrada: 0.75, textoEntradaCache: 0.75, textoSaida: 4.50,
  audioEntrada: 3.00, audioEntradaCache: 3.00, audioSaida: 12.00,
}
const GEMINI_2_5_FLASH_LIVE: TabelaDePrecos = {
  textoEntrada: 0.50, textoEntradaCache: 0.50, textoSaida: 2.00,
  audioEntrada: 3.00, audioEntradaCache: 3.00, audioSaida: 12.00,
}

/**
 * Resolve a tabela pelo nome do modelo — por SUBSTRING (`.includes('mini')`),
 * não igualdade exata, porque a OpenAI e o Google versionam o sufixo
 * (`-2026-07-01` etc.) sem avisar.
 *
 * Quem decide o modelo de verdade é a allowlist da Edge Function
 * (MODELOS_OPENAI/MODELOS_GEMINI) — esta função só traduz o nome que ela já
 * escolheu, nunca vê um nome de fora dessa lista na prática. Ainda assim, o
 * "senão" cai na tabela CHEIA (mais cara), não na mini: um nome que esta
 * função não reconheça deve inflar a estimativa, nunca escondê-la.
 */
function tabelaPara(provedor: Provedor, modelo: string): TabelaDePrecos {
  if (provedor === 'openai') {
    return modelo.includes('mini') ? OPENAI_MINI : OPENAI_FULL
  }
  return modelo.includes('2.5') ? GEMINI_2_5_FLASH_LIVE : GEMINI_3_1_FLASH_LIVE
}

/** Acumulador de tokens ao longo da sessão inteira — soma turno a turno. */
export interface UsoBruto {
  textoEntrada: number
  audioEntrada: number
  textoEntradaCache: number
  audioEntradaCache: number
  textoSaida: number
  audioSaida: number
}

export const USO_ZERADO: UsoBruto = {
  textoEntrada: 0, audioEntrada: 0, textoEntradaCache: 0, audioEntradaCache: 0, textoSaida: 0, audioSaida: 0,
}

/** Formato de `response.usage` no `response.done` da Realtime da OpenAI. */
export interface UsoRealtimeOpenAI {
  input_token_details?: {
    text_tokens?: number
    audio_tokens?: number
    cached_tokens?: number
    cached_tokens_details?: { text_tokens?: number; audio_tokens?: number }
  }
  output_token_details?: { text_tokens?: number; audio_tokens?: number }
  input_tokens?: number
  output_tokens?: number
}

/**
 * Soma o `usage` de UM turno ao acumulado da sessão.
 *
 * A sessão de voz é majoritariamente ÁUDIO — texto é só o system prompt e as
 * ferramentas. Quando a API não abre `input_token_details`/
 * `cached_tokens_details` (formato pode variar por versão), o fallback trata
 * tudo como áudio: superestima o texto barato como áudio caro, então o
 * fallback NUNCA subestima o custo — na dúvida, o número mostrado é
 * pessimista, não otimista.
 */
export function acumularOpenAI(acc: UsoBruto, usage: UsoRealtimeOpenAI | undefined): UsoBruto {
  if (!usage) return acc

  const det = usage.input_token_details
  const outDet = usage.output_token_details
  const cacheDet = det?.cached_tokens_details

  if (det) {
    // Sem `cached_tokens_details` (formato pode não abrir por modalidade),
    // todo o cache vira ÁUDIO — é a taxa de cache mais cara das duas, então o
    // fallback continua pessimista, nunca otimista.
    const cacheTexto = cacheDet ? (cacheDet.text_tokens ?? 0) : 0
    const cacheAudio = cacheDet ? (cacheDet.audio_tokens ?? 0) : (det.cached_tokens ?? 0)
    const textoTotal = det.text_tokens ?? 0
    const audioTotal = det.audio_tokens ?? 0
    return {
      textoEntrada: acc.textoEntrada + Math.max(0, textoTotal - cacheTexto),
      audioEntrada: acc.audioEntrada + Math.max(0, audioTotal - cacheAudio),
      textoEntradaCache: acc.textoEntradaCache + cacheTexto,
      audioEntradaCache: acc.audioEntradaCache + cacheAudio,
      textoSaida: acc.textoSaida + (outDet?.text_tokens ?? 0),
      audioSaida: acc.audioSaida + (outDet?.audio_tokens ?? (usage.output_tokens ?? 0)),
    }
  }

  // Sem `input_token_details`: só os totais crus. Assume tudo áudio (o
  // fallback pessimista descrito acima).
  const cache = 0
  const total = usage.input_tokens ?? 0
  return {
    ...acc,
    audioEntrada: acc.audioEntrada + Math.max(0, total - cache),
    audioEntradaCache: acc.audioEntradaCache + cache,
    audioSaida: acc.audioSaida + (usage.output_tokens ?? 0),
  }
}

/** Formato de `usageMetadata` no protocolo BidiGenerateContent do Gemini Live. */
export interface UsageMetadataGemini {
  promptTokenCount?: number
  candidatesTokenCount?: number
  promptTokensDetails?: { modality?: string; tokenCount?: number }[]
  candidatesTokensDetails?: { modality?: string; tokenCount?: number }[]
}

/** Mesmo princípio do acumulador da OpenAI: sem detalhe por modalidade,
 *  assume tudo áudio — pessimista, nunca subestima. */
export function acumularGemini(acc: UsoBruto, meta: UsageMetadataGemini | undefined): UsoBruto {
  if (!meta) return acc

  function porModalidade(det: { modality?: string; tokenCount?: number }[] | undefined, total: number) {
    if (!det?.length) return { texto: 0, audio: total }
    let texto = 0
    let audio = 0
    for (const d of det) {
      if (d.modality === 'TEXT') texto += d.tokenCount ?? 0
      else audio += d.tokenCount ?? 0 // AUDIO/IMAGE/VIDEO — tudo caro, junta no áudio
    }
    return { texto, audio }
  }

  const entrada = porModalidade(meta.promptTokensDetails, meta.promptTokenCount ?? 0)
  const saida = porModalidade(meta.candidatesTokensDetails, meta.candidatesTokenCount ?? 0)

  return {
    ...acc,
    textoEntrada: acc.textoEntrada + entrada.texto,
    audioEntrada: acc.audioEntrada + entrada.audio,
    textoSaida: acc.textoSaida + saida.texto,
    audioSaida: acc.audioSaida + saida.audio,
  }
}

/** Custo em dólar do uso acumulado, na tabela do modelo. */
export function calcularCustoUsd(uso: UsoBruto, provedor: Provedor, modelo: string): number {
  const t = tabelaPara(provedor, modelo)
  const porMilhao = (qtd: number, preco: number) => (qtd / 1_000_000) * preco
  return (
    porMilhao(uso.textoEntrada, t.textoEntrada)
    + porMilhao(uso.textoEntradaCache, t.textoEntradaCache)
    + porMilhao(uso.textoSaida, t.textoSaida)
    + porMilhao(uso.audioEntrada, t.audioEntrada)
    + porMilhao(uso.audioEntradaCache, t.audioEntradaCache)
    + porMilhao(uso.audioSaida, t.audioSaida)
  )
}

/** Soma de todos os tokens do acumulado — só para exibição ("12.430 tokens"). */
export function totalTokens(uso: UsoBruto): number {
  return uso.textoEntrada + uso.audioEntrada + uso.textoEntradaCache
    + uso.audioEntradaCache + uso.textoSaida + uso.audioSaida
}

/**
 * A LACUNA DO WHISPER — só existe do lado da OpenAI.
 *
 * A transcrição da fala do DENTISTA (`whisper-1`, configurado em
 * `session.audio.input.transcription` na Edge Function) é um modelo À PARTE,
 * cobrado por MINUTO de áudio — não por token, e nunca aparece em
 * `response.usage`. Sem somar isto, o card subestimava o custo real: o
 * dentista comparou com o próprio painel da OpenAI e o nosso número vinha
 * mais baixo, exatamente a diferença que este cálculo cobre.
 *
 * No Gemini não existe essa lacuna: a fala do dentista ali é só mais um
 * pedaço do MESMO modelo de áudio-para-áudio, já coberta pelos tokens de
 * entrada que `acumularGemini` já soma — não é um serviço separado.
 *
 * $0,006/minuto é o preço oficial do whisper-1 (developers.openai.com/api/docs/pricing,
 * conferido em 26/07/2026).
 *
 * A ESTIMATIVA usa a DURAÇÃO DA SESSÃO inteira (conexão até desconexão), não
 * só o tempo em que o dentista falou — superestima um pouco (conta silêncio
 * junto), mas segue o mesmo princípio do resto deste arquivo: um fallback que
 * nunca fica mais barato que a realidade é mais seguro que um que, por
 * precisão de sobra, some tempo de fala real que não temos como medir aqui.
 */
const WHISPER_USD_POR_MINUTO = 0.006

export function calcularCustoWhisperUsd(duracaoSegundos: number): number {
  return (duracaoSegundos / 60) * WHISPER_USD_POR_MINUTO
}
