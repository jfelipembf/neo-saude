import { describe, expect, it } from 'vitest'
import {
  DEFAULT_VOICE_PROVIDER,
  extractFunctionCalls,
  resolveVoiceProvider,
  shouldTranscribeUser,
} from './sessionUtils'

describe('configuração da sessão da Cibelly', () => {
  it('mantém Gemini como provedor padrão', () => {
    expect(DEFAULT_VOICE_PROVIDER).toBe('gemini')
    expect(resolveVoiceProvider('')).toBe('gemini')
    expect(resolveVoiceProvider('?voz=invalido')).toBe('gemini')
  })

  it('permite comparar os provedores pela URL', () => {
    expect(resolveVoiceProvider('?voz=openai')).toBe('openai')
    expect(resolveVoiceProvider('?voz=gemini')).toBe('gemini')
  })

  it('só desliga a transcrição quando solicitado explicitamente', () => {
    expect(shouldTranscribeUser('')).toBe(true)
    expect(shouldTranscribeUser('?transcrever=nao')).toBe(false)
  })
})

describe('eventos de ferramenta da OpenAI Realtime', () => {
  it('extrai a chamada do evento individual', () => {
    expect(extractFunctionCalls({
      type: 'response.function_call_arguments.done',
      call_id: 'call-1',
      name: 'marcar_dente',
      arguments: '{"dentes":[24]}',
    })).toEqual([{
      call_id: 'call-1',
      name: 'marcar_dente',
      arguments: '{"dentes":[24]}',
    }])
  })

  it('extrai apenas function calls válidas de response.done', () => {
    expect(extractFunctionCalls({
      type: 'response.done',
      response: {
        output: [
          { type: 'message' },
          {
            type: 'function_call',
            call_id: 'call-2',
            name: 'consultar_materiais',
            arguments: '{}',
          },
        ],
      },
    })).toEqual([{
      call_id: 'call-2',
      name: 'consultar_materiais',
      arguments: '{}',
    }])
  })
})
