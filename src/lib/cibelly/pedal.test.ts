import { describe, expect, it } from 'vitest'
import {
  listeningModeFromKey,
  pedalScopeError,
  pedalTurnInstruction,
} from './pedal'

describe('pedal da Cibelly', () => {
  it('mapeia J para o paciente atual e F para o modo geral', () => {
    expect(listeningModeFromKey({ code: 'KeyJ', key: 'j' })).toBe('patient')
    expect(listeningModeFromKey({ code: 'KeyF', key: 'f' })).toBe('general')
    expect(listeningModeFromKey({ code: '', key: 'J' })).toBe('patient')
    expect(listeningModeFromKey({ code: 'KeyK', key: 'k' })).toBeNull()
  })

  it('isola explicitamente o escopo de cada turno', () => {
    expect(pedalTurnInstruction('patient')).toContain('somente do paciente')
    expect(pedalTurnInstruction('patient')).toContain('pedal F')
    expect(pedalTurnInstruction('general')).toContain('Não presuma')
    expect(pedalTurnInstruction('general')).toContain('nome ou código')
  })

  it('bloqueia efeitos fora do paciente atual no pedal J', () => {
    expect(pedalScopeError(
      'patient',
      'inventory',
      'consultar_materiais',
      {},
    )).toContain('pedal F')
    expect(pedalScopeError(
      'patient',
      'communication',
      'enviar_mensagem_paciente',
      { paciente: 'Ana' },
    )).toContain('pedal F')
    expect(pedalScopeError(
      'patient',
      'odontogram',
      'marcar_dente',
      { dentes: [24] },
    )).toBeNull()
    expect(pedalScopeError(
      'general',
      'inventory',
      'consultar_materiais',
      {},
    )).toBeNull()
  })
})
