import { describe, expect, it } from 'vitest'
import { isClearAffirmativeConfirmation } from './confirmationIntent'

describe('isClearAffirmativeConfirmation', () => {
  it.each([
    'Sim.',
    'Pode enviar!',
    'Mande',
    'Solicite.',
    'Confirmo',
    'Isso mesmo',
    'Faça',
  ])('aceita confirmação clara: %s', text => {
    expect(isClearAffirmativeConfirmation(text)).toBe(true)
  })

  it.each([
    '',
    'não',
    'sim, mas não agora',
    'pode enviar para outro fornecedor',
    'qual mensagem?',
  ])('recusa fala ambígua ou com alteração: %s', text => {
    expect(isClearAffirmativeConfirmation(text)).toBe(false)
  })
})
