import { errorMessage } from '@/utils/errors'
import type { UsoRealtimeOpenAI } from './pricing'
import type { VoiceProvider } from './sessionTypes'

/**
 * Gemini permanece como padrão por decisão de produto. A OpenAI pode ser
 * selecionada para comparação com `?voz=openai`.
 */
export const DEFAULT_VOICE_PROVIDER: VoiceProvider = 'gemini'

function browserSearch(): string {
  return typeof window === 'undefined' ? '' : window.location.search
}

export function shouldTranscribeUser(search = browserSearch()): boolean {
  return new URLSearchParams(search).get('transcrever') !== 'nao'
}

export function resolveVoiceProvider(search = browserSearch()): VoiceProvider {
  const provider = new URLSearchParams(search).get('voz')
  return provider === 'openai' || provider === 'gemini'
    ? provider
    : DEFAULT_VOICE_PROVIDER
}

interface RealtimeFunctionCallDoneEvent {
  type: 'response.function_call_arguments.done'
  call_id: string
  name: string
  arguments: string
}

export interface RealtimeResponseDoneEvent {
  type: 'response.done'
  response?: {
    output?: Array<{
      type?: string
      call_id?: string
      name?: string
      arguments?: string
    }>
    usage?: UsoRealtimeOpenAI
  }
}

export interface RealtimeFunctionCall {
  call_id: string
  name: string
  arguments: string
}

/**
 * A chamada de ferramenta pode chegar no evento individual e novamente dentro
 * de `response.done`. O orquestrador deduplica por `call_id`.
 */
export function extractFunctionCalls(event: unknown): RealtimeFunctionCall[] {
  if (!event || typeof event !== 'object') return []
  const type = (event as { type?: unknown }).type

  if (type === 'response.function_call_arguments.done') {
    const call = event as RealtimeFunctionCallDoneEvent
    return [{
      call_id: call.call_id,
      name: call.name,
      arguments: call.arguments,
    }]
  }

  if (type !== 'response.done') return []

  const output = (event as RealtimeResponseDoneEvent).response?.output ?? []
  return output
    .filter((item): item is Required<typeof item> =>
      item.type === 'function_call'
      && !!item.call_id
      && !!item.name
      && item.arguments !== undefined)
    .map(item => ({
      call_id: item.call_id,
      name: item.name,
      arguments: item.arguments,
    }))
}

export function describeConnectError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : null
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Permissão de microfone negada. Libere o microfone para este site nas configurações do navegador (ícone de cadeado na barra de endereço) e recarregue a página.'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'Nenhum microfone foi encontrado neste dispositivo.'
    case 'NotReadableError':
      return 'Não foi possível acessar o microfone — verifique se outro programa não está usando ele.'
    case 'SecurityError':
      return err instanceof DOMException
        ? err.message
        : 'O microfone só é acessível em conexão segura (https) ou em localhost.'
    default:
      return errorMessage(
        err,
        'Não foi possível iniciar a Cibelly. Tente novamente.',
      )
  }
}

export async function extractFunctionErrorMessage(
  fnError: unknown,
): Promise<string | null> {
  const context = (fnError as { context?: unknown } | null)?.context
  if (!(context instanceof Response)) return null
  try {
    const body = await context.clone().json()
    return typeof body?.error === 'string' ? body.error : null
  } catch {
    return null
  }
}
