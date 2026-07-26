import { describe, expect, it } from 'vitest'
import {
  canCreateFollowUp, isActiveResponseConflict, isRealtimeBusy,
  type RealtimeContinuationState,
} from './responseContinuation'

const idle: RealtimeContinuationState = {
  responseActive: false,
  responseRequested: false,
  toolsInFlight: 0,
  followUpRequested: false,
}

describe('continuação de respostas Realtime', () => {
  it('só continua depois que todas as ferramentas terminam', () => {
    expect(canCreateFollowUp({ ...idle, followUpRequested: true, toolsInFlight: 5 })).toBe(false)
    expect(canCreateFollowUp({ ...idle, followUpRequested: true, toolsInFlight: 1 })).toBe(false)
    expect(canCreateFollowUp({ ...idle, followUpRequested: true })).toBe(true)
  })

  it('não cria outra resposta enquanto uma está ativa ou já foi solicitada', () => {
    expect(canCreateFollowUp({ ...idle, followUpRequested: true, responseActive: true })).toBe(false)
    expect(canCreateFollowUp({ ...idle, followUpRequested: true, responseRequested: true })).toBe(false)
  })

  it('reduz cinco conclusões de ferramenta a uma única continuação', () => {
    const state = { ...idle, toolsInFlight: 5, followUpRequested: true }
    let creations = 0

    for (let i = 0; i < 5; i += 1) {
      state.toolsInFlight -= 1
      if (!canCreateFollowUp(state)) continue
      creations += 1
      state.followUpRequested = false
      state.responseRequested = true
    }

    expect(creations).toBe(1)
  })

  it('mantém o indicador ocupado durante toda a cadeia', () => {
    expect(isRealtimeBusy({ ...idle, toolsInFlight: 2 })).toBe(true)
    expect(isRealtimeBusy({ ...idle, followUpRequested: true })).toBe(true)
    expect(isRealtimeBusy({ ...idle, responseRequested: true })).toBe(true)
    expect(isRealtimeBusy(idle)).toBe(false)
  })

  it('reconhece especificamente o conflito de resposta ativa', () => {
    expect(isActiveResponseConflict(
      'Conversation already has an active response in progress: resp_123.',
    )).toBe(true)
    expect(isActiveResponseConflict('Invalid tool arguments.')).toBe(false)
  })
})
