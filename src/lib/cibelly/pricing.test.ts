import { describe, expect, it } from 'vitest'
import {
  acumularGemini, acumularOpenAI, totalTokens, USO_ZERADO,
  type UsageMetadataGemini, type UsoRealtimeOpenAI,
} from './pricing'

describe('acumularOpenAI', () => {
  it('sem usage, não muda o acumulado', () => {
    expect(acumularOpenAI(USO_ZERADO, undefined)).toEqual(USO_ZERADO)
  })

  it('com detalhe por modalidade, separa cache de texto e de áudio', () => {
    const usage: UsoRealtimeOpenAI = {
      input_token_details: {
        text_tokens: 9200, audio_tokens: 300,
        cached_tokens: 9344,
        cached_tokens_details: { text_tokens: 9190, audio_tokens: 154 },
      },
      output_token_details: { text_tokens: 5, audio_tokens: 40 },
    }
    const r = acumularOpenAI(USO_ZERADO, usage)
    expect(r.textoEntrada).toBe(10)       // 9200 - 9190
    expect(r.audioEntrada).toBe(146)      // 300 - 154
    expect(r.textoEntradaCache).toBe(9190)
    expect(r.audioEntradaCache).toBe(154)
    expect(r.textoSaida).toBe(5)
    expect(r.audioSaida).toBe(40)
  })

  it('soma turno após turno, não substitui', () => {
    const usage: UsoRealtimeOpenAI = {
      input_token_details: { text_tokens: 10, audio_tokens: 0, cached_tokens: 0 },
      output_token_details: { text_tokens: 1, audio_tokens: 0 },
    }
    const r1 = acumularOpenAI(USO_ZERADO, usage)
    const r2 = acumularOpenAI(r1, usage)
    expect(r2.textoEntrada).toBe(20)
    expect(r2.textoSaida).toBe(2)
  })

  // Sem input_token_details, o fallback trata tudo como ÁUDIO — pessimista de
  // propósito, para o número nunca parecer mais barato do que é.
  it('sem detalhe por modalidade, cai tudo em áudio', () => {
    const usage: UsoRealtimeOpenAI = { input_tokens: 1000, output_tokens: 50 }
    const r = acumularOpenAI(USO_ZERADO, usage)
    expect(r.audioEntrada).toBe(1000)
    expect(r.audioSaida).toBe(50)
    expect(r.textoEntrada).toBe(0)
  })

  it('cache sem detalhe por modalidade cai em áudio, não em texto', () => {
    const usage: UsoRealtimeOpenAI = {
      input_token_details: { text_tokens: 100, audio_tokens: 900, cached_tokens: 800 },
    }
    const r = acumularOpenAI(USO_ZERADO, usage)
    expect(r.audioEntradaCache).toBe(800)
    expect(r.textoEntradaCache).toBe(0)
    // 900 de áudio, 800 já contado como cache → sobra 100 de áudio "cheio".
    expect(r.audioEntrada).toBe(100)
  })
})

describe('acumularGemini', () => {
  it('sem metadata, não muda o acumulado', () => {
    expect(acumularGemini(USO_ZERADO, undefined)).toEqual(USO_ZERADO)
  })

  it('separa por modalidade quando o detalhe vem', () => {
    const meta: UsageMetadataGemini = {
      promptTokenCount: 9250,
      candidatesTokenCount: 45,
      promptTokensDetails: [{ modality: 'TEXT', tokenCount: 9200 }, { modality: 'AUDIO', tokenCount: 50 }],
      candidatesTokensDetails: [{ modality: 'AUDIO', tokenCount: 45 }],
    }
    const r = acumularGemini(USO_ZERADO, meta)
    expect(r.textoEntrada).toBe(9200)
    expect(r.audioEntrada).toBe(50)
    expect(r.audioSaida).toBe(45)
  })

  it('sem detalhe por modalidade, cai tudo em áudio', () => {
    const meta: UsageMetadataGemini = { promptTokenCount: 500, candidatesTokenCount: 30 }
    const r = acumularGemini(USO_ZERADO, meta)
    expect(r.audioEntrada).toBe(500)
    expect(r.audioSaida).toBe(30)
    expect(r.textoEntrada).toBe(0)
  })

  it('soma turno após turno', () => {
    const meta: UsageMetadataGemini = { promptTokenCount: 100, candidatesTokenCount: 10 }
    const r = acumularGemini(acumularGemini(USO_ZERADO, meta), meta)
    expect(r.audioEntrada).toBe(200)
    expect(r.audioSaida).toBe(20)
  })

  // A Live API chama a saída de `responseTokenCount`, e NÃO de
  // `candidatesTokenCount` como o generateContent normal. Ler o campo errado
  // não dá erro — grava zero. Foi o que fez a fatura da Google vir 4× maior
  // que o card do Dashboard, então este caso é o que trava a regressão.
  it('lê a saída de responseTokenCount, o campo real da Live API', () => {
    const meta: UsageMetadataGemini = {
      promptTokenCount: 17500,
      promptTokensDetails: [{ modality: 'TEXT', tokenCount: 17500 }],
      responseTokenCount: 480,
      responseTokensDetails: [{ modality: 'AUDIO', tokenCount: 480 }],
    }
    const r = acumularGemini(USO_ZERADO, meta)
    expect(r.textoEntrada).toBe(17500)
    expect(r.audioSaida).toBe(480)
  })

  it('cai em candidatesTokenCount só quando responseTokenCount não vem', () => {
    const r = acumularGemini(USO_ZERADO, { candidatesTokenCount: 30 })
    expect(r.audioSaida).toBe(30)
  })

  it('response tem precedência sobre candidates quando os dois vêm', () => {
    const r = acumularGemini(USO_ZERADO, { responseTokenCount: 80, candidatesTokenCount: 30 })
    expect(r.audioSaida).toBe(80)
  })

  it('prompt de ferramenta entra como ENTRADA', () => {
    const meta: UsageMetadataGemini = {
      toolUsePromptTokenCount: 1200,
      toolUsePromptTokensDetails: [{ modality: 'TEXT', tokenCount: 1200 }],
    }
    expect(acumularGemini(USO_ZERADO, meta).textoEntrada).toBe(1200)
  })

  it('raciocínio entra como texto de SAÍDA', () => {
    expect(acumularGemini(USO_ZERADO, { thoughtsTokenCount: 250 }).textoSaida).toBe(250)
  })

  it('conteúdo em cache não é cobrado como entrada cheia', () => {
    const meta: UsageMetadataGemini = {
      cachedContentTokenCount: 9000,
      cacheTokensDetails: [{ modality: 'TEXT', tokenCount: 9000 }],
    }
    const r = acumularGemini(USO_ZERADO, meta)
    expect(r.textoEntradaCache).toBe(9000)
    expect(r.textoEntrada).toBe(0)
  })
})



describe('totalTokens', () => {
  it('soma todas as categorias', () => {
    const uso = {
      textoEntrada: 1, audioEntrada: 2, textoEntradaCache: 3,
      audioEntradaCache: 4, textoSaida: 5, audioSaida: 6,
    }
    expect(totalTokens(uso)).toBe(21)
  })
})
