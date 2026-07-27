import { describe, expect, it } from 'vitest'
import {
  functionResultErrorMessage,
  supabaseFunctionErrorMessage,
} from './supabaseFunctionError'

describe('Supabase Function errors', () => {
  it('preserva o código do corpo de uma resposta HTTP com erro', async () => {
    const context = new Response(
      JSON.stringify({ ok: false, error: 'clinic_rate_limited' }),
      { status: 429 },
    )
    await expect(supabaseFunctionErrorMessage(
      { message: 'Edge Function returned a non-2xx status code', context },
      'fallback',
    )).resolves.toBe('clinic_rate_limited')
  })

  it('inclui as causas individuais quando nenhum envio funcionou', () => {
    expect(functionResultErrorMessage({
      ok: false,
      error: 'no_message_sent',
      results: [
        { error: 'send_failed' },
        { error: 'invalid_phone' },
      ],
    }, 'fallback')).toBe('no_message_sent send_failed invalid_phone')
  })

  it('usa a mensagem original quando não há corpo estruturado', async () => {
    await expect(supabaseFunctionErrorMessage(
      { message: 'Falha de rede' },
      'fallback',
    )).resolves.toBe('Falha de rede')
  })
})
