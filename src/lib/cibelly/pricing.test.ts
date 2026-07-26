import { describe, expect, it } from 'vitest'
import {
  acumularGemini, acumularOpenAI, calcularCustoUsd, calcularCustoWhisperUsd, totalTokens, USO_ZERADO,
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
})

describe('calcularCustoUsd', () => {
  it('sem uso nenhum, custo zero', () => {
    expect(calcularCustoUsd(USO_ZERADO, 'openai', 'gpt-realtime-2.1-mini')).toBe(0)
  })

  it('openai mini: 1M de áudio de entrada custa exatamente a tabela ($10)', () => {
    const uso = { ...USO_ZERADO, audioEntrada: 1_000_000 }
    expect(calcularCustoUsd(uso, 'openai', 'gpt-realtime-2.1-mini')).toBeCloseTo(10, 6)
  })

  it('openai full custa mais que o mini para o mesmo uso', () => {
    const uso = { ...USO_ZERADO, audioEntrada: 1_000_000, audioSaida: 1_000_000 }
    const mini = calcularCustoUsd(uso, 'openai', 'gpt-realtime-2.1-mini')
    const full = calcularCustoUsd(uso, 'openai', 'gpt-realtime-2.1')
    expect(full).toBeGreaterThan(mini)
  })

  it('cache reduz o custo comparado ao mesmo volume sem cache', () => {
    const semCache = calcularCustoUsd({ ...USO_ZERADO, audioEntrada: 10_000 }, 'openai', 'gpt-realtime-2.1-mini')
    const comCache = calcularCustoUsd({ ...USO_ZERADO, audioEntradaCache: 10_000 }, 'openai', 'gpt-realtime-2.1-mini')
    expect(comCache).toBeLessThan(semCache)
  })

  it('nome de modelo não reconhecido cai na tabela CHEIA, não na mini', () => {
    const uso = { ...USO_ZERADO, audioEntrada: 1_000_000 }
    const desconhecido = calcularCustoUsd(uso, 'openai', 'gpt-realtime-3.0-nova-versao')
    const mini = calcularCustoUsd(uso, 'openai', 'gpt-realtime-2.1-mini')
    expect(desconhecido).toBeGreaterThan(mini)
  })

  it('gemini não tem desconto de cache — texto e cache custam o mesmo', () => {
    const semCache = calcularCustoUsd({ ...USO_ZERADO, audioEntrada: 10_000 }, 'gemini', 'gemini-3.1-flash-live-preview')
    const comCache = calcularCustoUsd({ ...USO_ZERADO, audioEntradaCache: 10_000 }, 'gemini', 'gemini-3.1-flash-live-preview')
    expect(comCache).toBeCloseTo(semCache, 6)
  })

  // O caso medido nesta sessão: mini cacheado é MUITO mais barato que o
  // Gemini para o mesmo volume de áudio (a Realtime cacheia; a Live não).
  it('para o mesmo volume, mini com cache sai muito mais barato que o gemini', () => {
    const openai = calcularCustoUsd({ ...USO_ZERADO, audioEntradaCache: 9_000, audioSaida: 40 }, 'openai', 'gpt-realtime-2.1-mini')
    const gemini = calcularCustoUsd({ ...USO_ZERADO, audioEntrada: 9_000, audioSaida: 40 }, 'gemini', 'gemini-3.1-flash-live-preview')
    expect(openai).toBeLessThan(gemini)
  })
})

describe('calcularCustoWhisperUsd', () => {
  it('30 minutos custa exatamente a tabela oficial ($0,006/min)', () => {
    expect(calcularCustoWhisperUsd(30 * 60)).toBeCloseTo(0.18, 6)
  })

  it('zero segundos custa zero', () => {
    expect(calcularCustoWhisperUsd(0)).toBe(0)
  })

  it('cresce linearmente com a duração', () => {
    const dez = calcularCustoWhisperUsd(10 * 60)
    const vinte = calcularCustoWhisperUsd(20 * 60)
    expect(vinte).toBeCloseTo(dez * 2, 6)
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
