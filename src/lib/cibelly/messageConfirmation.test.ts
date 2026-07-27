import { describe, expect, it } from 'vitest'
import {
  matchesPendingMessage,
  messageConfirmationFingerprint,
  pendingMessageConfirmation,
} from './messageConfirmation'

describe('message confirmation', () => {
  it('ignora ordem dos destinatários e espaços excedentes', () => {
    expect(messageConfirmationFingerprint(['b', 'a'], '  Olá,   tudo bem? '))
      .toBe(messageConfirmationFingerprint(['a', 'b'], 'Olá, tudo bem?'))
  })

  it('aceita somente a mesma mensagem dentro do prazo', () => {
    const pending = pendingMessageConfirmation(['patient-1'], 'Mensagem original', 1_000)
    expect(matchesPendingMessage(pending, ['patient-1'], 'Mensagem original', 2_000)).toBe(true)
    expect(matchesPendingMessage(pending, ['patient-1'], 'Mensagem alterada', 2_000)).toBe(false)
    expect(matchesPendingMessage(pending, ['patient-2'], 'Mensagem original', 2_000)).toBe(false)
  })

  it('recusa confirmação expirada', () => {
    const pending = pendingMessageConfirmation(['patient-1'], 'Mensagem', 1_000)
    expect(matchesPendingMessage(pending, ['patient-1'], 'Mensagem', 121_001)).toBe(false)
  })
})
