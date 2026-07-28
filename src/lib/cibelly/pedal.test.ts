import { describe, expect, it } from 'vitest'
import {
  pedalScopeError,
  pedalTurnInstruction,
} from './pedal'

describe('pedal da Cibelly', () => {

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
      'patients',
      'consultar_pacientes',
      {},
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
    expect(pedalScopeError(
      'general',
      'schedule',
      'agendar_consulta',
      { data: '2026-07-30', hora: '14:00' },
    )).toContain('Nenhuma consulta foi alterada')
    expect(pedalScopeError(
      'general',
      'schedule',
      'agendar_consulta',
      { paciente: 'Lucas', data: '2026-07-30', hora: '14:00' },
    )).toBeNull()
  })
})
