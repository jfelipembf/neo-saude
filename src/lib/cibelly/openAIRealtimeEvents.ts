import { errorMessage } from '@/utils/errors'
import {
  isActiveResponseConflict,
  type CibellyOrchestrator,
} from './orchestrator'
import {
  extractFunctionCalls,
  type RealtimeResponseDoneEvent,
} from './sessionUtils'
import type { CibellyActivity } from './sessionTypes'
import type { UsoRealtimeOpenAI } from './pricing'

type ActivityInput = Omit<CibellyActivity, 'id' | 'em'>

interface OpenAIRealtimeEventHandlerOptions {
  orchestrator: CibellyOrchestrator
  getDataChannel: () => RTCDataChannel | null
  clearFollowUpTimer: () => void
  continueWhenReady: () => void
  syncProcessing: () => void
  register: (item: ActivityInput) => void
  publish: () => void
  reserveUserSpeech: (itemId: string) => void
  fillUserSpeech: (itemId: string, text: string) => void
  beginConfirmationTurn: (itemId: string) => void
  setConfirmationText: (itemId: string, text: string) => void
  finishConfirmationTurn: () => void
  markConfirmationToolCall: (name: string) => void
  executeTool: (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>
  measureUsage: (usage: UsoRealtimeOpenAI | undefined) => void
  setError: (message: string | null) => void
  onIdle?: () => void
}

export function createOpenAIRealtimeEventHandler({
  orchestrator,
  getDataChannel,
  clearFollowUpTimer,
  continueWhenReady,
  syncProcessing,
  register,
  publish,
  reserveUserSpeech,
  fillUserSpeech,
  beginConfirmationTurn,
  setConfirmationText,
  finishConfirmationTurn,
  markConfirmationToolCall,
  executeTool,
  measureUsage,
  setError,
  onIdle,
}: OpenAIRealtimeEventHandlerOptions) {
  let userTurnQueuedDuringResponseRequest = false

  return async function handleRealtimeEvent(
    message: MessageEvent<string>,
  ): Promise<void> {
    let event: unknown
    try {
      event = JSON.parse(message.data)
    } catch {
      return
    }

    const type = (event as { type?: unknown }).type
    if (type === 'error') {
      console.error('[Cibelly] erro da API:', event)
      const realtimeError = event as { error?: { message?: string } }
      const messageText = realtimeError.error?.message
        ?? 'Erro da API de voz.'
      clearFollowUpTimer()

      const activeConflict = isActiveResponseConflict(messageText)
      orchestrator.responseFailed(activeConflict)
      syncProcessing()
      if (activeConflict) {
        userTurnQueuedDuringResponseRequest = false
        return
      }
      register({ tipo: 'erro', texto: messageText })
      continueWhenReady()
      return
    }

    if (type === 'response.output_audio_transcript.done') {
      const transcript = (event as { transcript?: string }).transcript?.trim()
      if (transcript) register({ tipo: 'fala', texto: transcript })
    }

    if (type === 'input_audio_buffer.committed') {
      const itemId = (event as { item_id?: string }).item_id
      if (itemId) {
        reserveUserSpeech(itemId)
        beginConfirmationTurn(itemId)
        if (orchestrator.snapshot.responseRequested) {
          userTurnQueuedDuringResponseRequest = true
        } else {
          orchestrator.requestFollowUp()
          continueWhenReady()
        }
        publish()
      }
    }

    if (typeof type === 'string'
        && type.includes('input_audio_transcription')
        && (type.endsWith('.completed') || type.endsWith('.done'))) {
      const transcription = event as {
        transcript?: string
        item_id?: string
      }
      const transcript = transcription.transcript?.trim()
      if (transcript) {
        if (transcription.item_id) {
          fillUserSpeech(transcription.item_id, transcript)
          setConfirmationText(transcription.item_id, transcript)
        } else {
          register({ tipo: 'dentista', texto: transcript })
        }
        publish()
      }
    }

    if (type === 'response.created') {
      clearFollowUpTimer()
      orchestrator.responseStarted()
      if (userTurnQueuedDuringResponseRequest) {
        userTurnQueuedDuringResponseRequest = false
        orchestrator.requestFollowUp()
      }
      setError(null)
      syncProcessing()
    }

    if (type === 'response.done') {
      clearFollowUpTimer()
      orchestrator.responseFinished()
      finishConfirmationTurn()
      measureUsage(
        (event as RealtimeResponseDoneEvent).response?.usage,
      )
    }

    if (type === 'response.created'
        || type === 'response.done'
        || type === 'input_audio_buffer.speech_started') {
      const lifecycleEvent = event as {
        type: string
        response?: { status?: string }
      }
      console.debug(
        `[Cibelly] ${Math.round(performance.now())}ms ${lifecycleEvent.type}`,
        lifecycleEvent.response?.status ?? '',
      )
    }

    const calls = extractFunctionCalls(event)
    if (calls.length === 0) {
      if (type === 'response.done') continueWhenReady()
      if (orchestrator.snapshot.phase === 'idle') onIdle?.()
      return
    }

    const newCalls = orchestrator.claimToolCalls(calls)
    if (newCalls.length === 0) {
      continueWhenReady()
      if (orchestrator.snapshot.phase === 'idle') onIdle?.()
      return
    }
    syncProcessing()

    for (const call of newCalls) {
      let args: Record<string, unknown>
      try {
        args = JSON.parse(call.arguments)
      } catch {
        args = {}
      }

      console.info('[Cibelly] ferramenta:', call.name, args)
      markConfirmationToolCall(call.name)

      let result: Record<string, unknown>
      try {
        result = await executeTool(call.name, args)
      } catch (caught) {
        result = {
          ok: false,
          erro: errorMessage(
            caught,
            'Não consegui concluir esta ação.',
          ),
        }
      }
      register({
        tipo: 'ferramenta',
        texto: call.name,
        args: JSON.stringify(args),
        resultado: JSON.stringify(result),
      })

      try {
        const dataChannel = getDataChannel()
        if (dataChannel?.readyState === 'open') {
          dataChannel.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: call.call_id,
              output: JSON.stringify(result),
            },
          }))
        }
      } finally {
        orchestrator.finishTool(call.name, result)
        syncProcessing()
      }
    }

    continueWhenReady()
    if (orchestrator.snapshot.phase === 'idle') onIdle?.()
  }
}
