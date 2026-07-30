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

/**
 * O PREÇO NÃO MORA MAIS AQUI. As tabelas por provedor/modelo foram para o banco
 * (`cibelly_price` / `cibelly_whisper_price`), e o custo de cada sessão é
 * calculado por trigger no INSERT de `cibelly_usage`.
 *
 * O motivo é de segurança, não de organização: enquanto o valor era calculado
 * no navegador e enviado pronto, bastava um POST no PostgREST para a base de
 * custo mentir. Manter uma cópia da tabela aqui recriaria o problema por outro
 * caminho — duas fontes de verdade para dinheiro divergem, e a que o front
 * mostra não é a que fecha a fatura.
 *
 * O que continua aqui é a CONTAGEM de tokens, que só o cliente tem: os
 * contadores vêm da sessão WebRTC dele, turno a turno.
 */
export type Provedor = 'openai' | 'gemini'


// Gemini Live NÃO tem camada de cache (a página oficial não lista uma para os
// modelos Live — bate com o que medimos antes: cachedContentTokenCount sempre
// 0). Por isso não há *EntradaCache aqui: todo token de entrada é cobrado no
// preço cheio.

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

/**
 * Formato de `usageMetadata` no protocolo BidiGenerateContent do Gemini Live.
 *
 * ⚠️ O LADO DA SAÍDA CHAMA `responseTokenCount`, não `candidatesTokenCount`.
 * A Live API foge da convenção do generateContent normal, e ler o campo errado
 * não dá erro nenhum: `undefined ?? 0` vira zero e a sessão inteira é gravada
 * como se ela nunca tivesse falado. Foi exatamente o que aconteceu — 11 sessões
 * com saída zerada, e o painel da Google cobrando 4× o que o cartão mostrava.
 * `candidates*` fica como fallback só porque outras superfícies da API usam.
 */
export interface UsageMetadataGemini {
  promptTokenCount?: number
  responseTokenCount?: number
  candidatesTokenCount?: number
  /** Prompt das chamadas de ferramenta — cobrado como ENTRADA, e nesta
   *  assistente é justamente o que mais roda. */
  toolUsePromptTokenCount?: number
  /** Raciocínio dos modelos "thinking" — cobrado como SAÍDA. */
  thoughtsTokenCount?: number
  cachedContentTokenCount?: number
  promptTokensDetails?: { modality?: string; tokenCount?: number }[]
  responseTokensDetails?: { modality?: string; tokenCount?: number }[]
  candidatesTokensDetails?: { modality?: string; tokenCount?: number }[]
  toolUsePromptTokensDetails?: { modality?: string; tokenCount?: number }[]
  cacheTokensDetails?: { modality?: string; tokenCount?: number }[]
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
  const ferramentas = porModalidade(
    meta.toolUsePromptTokensDetails,
    meta.toolUsePromptTokenCount ?? 0,
  )
  const cache = porModalidade(meta.cacheTokensDetails, meta.cachedContentTokenCount ?? 0)
  const saida = porModalidade(
    meta.responseTokensDetails ?? meta.candidatesTokensDetails,
    meta.responseTokenCount ?? meta.candidatesTokenCount ?? 0,
  )

  return {
    textoEntrada: acc.textoEntrada + entrada.texto + ferramentas.texto,
    audioEntrada: acc.audioEntrada + entrada.audio + ferramentas.audio,
    textoEntradaCache: acc.textoEntradaCache + cache.texto,
    audioEntradaCache: acc.audioEntradaCache + cache.audio,
    // O raciocínio entra como TEXTO de saída: é o que ele é, e a tabela do
    // Gemini cobra saída de texto mais barato que saída de áudio — somar em
    // áudio inflaria a conta por engano.
    textoSaida: acc.textoSaida + saida.texto + (meta.thoughtsTokenCount ?? 0),
    audioSaida: acc.audioSaida + saida.audio,
  }
}

/** Custo em dólar do uso acumulado, na tabela do modelo. */

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

