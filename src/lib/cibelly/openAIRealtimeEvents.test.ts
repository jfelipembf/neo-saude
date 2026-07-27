import { describe, expect, it, vi } from 'vitest'
import { CibellyOrchestrator } from './orchestrator'
import { createOpenAIRealtimeEventHandler } from './openAIRealtimeEvents'

function realtimeMessage(event: unknown): MessageEvent<string> {
  return { data: JSON.stringify(event) } as MessageEvent<string>
}

function createHarness(orchestrator = new CibellyOrchestrator()) {
  const continueWhenReady = vi.fn()
  const register = vi.fn()
  const handler = createOpenAIRealtimeEventHandler({
    orchestrator,
    getDataChannel: () => null,
    clearFollowUpTimer: vi.fn(),
    continueWhenReady,
    syncProcessing: vi.fn(),
    register,
    publish: vi.fn(),
    reserveUserSpeech: vi.fn(),
    fillUserSpeech: vi.fn(),
    beginConfirmationTurn: vi.fn(),
    setConfirmationText: vi.fn(),
    finishConfirmationTurn: vi.fn(),
    markConfirmationToolCall: vi.fn(),
    executeTool: vi.fn(async () => ({ ok: true })),
    measureUsage: vi.fn(),
    setError: vi.fn(),
  })
  return { continueWhenReady, handler, orchestrator, register }
}

describe('fila de eventos da OpenAI Realtime', () => {
  it('preserva uma fala recebida enquanto response.create está pendente', async () => {
    const harness = createHarness()
    harness.orchestrator.requestFollowUp()
    expect(harness.orchestrator.claimFollowUp()).toBe('claimed')

    await harness.handler(realtimeMessage({
      type: 'input_audio_buffer.committed',
      item_id: 'turn-2',
    }))
    await harness.handler(realtimeMessage({ type: 'response.created' }))

    expect(harness.orchestrator.snapshot).toMatchObject({
      responseActive: true,
      followUpRequested: true,
    })

    await harness.handler(realtimeMessage({
      type: 'response.done',
      response: { output: [] },
    }))

    expect(harness.continueWhenReady).toHaveBeenCalledTimes(1)
  })

  it('mantém conflito de resposta ativo como erro interno recuperável', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const harness = createHarness()
    harness.orchestrator.requestFollowUp()
    harness.orchestrator.claimFollowUp()

    await harness.handler(realtimeMessage({
      type: 'error',
      error: {
        message: 'Conversation already has an active response in progress',
      },
    }))

    expect(harness.orchestrator.snapshot.responseActive).toBe(true)
    expect(harness.register).not.toHaveBeenCalled()
    expect(harness.continueWhenReady).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
