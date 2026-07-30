import { describe, expect, it } from 'vitest'
import {
  ehCodigoDePedal,
  pedalEngolidoPorCampo,
  pedalScopeError,
  pedalTurnInstruction,
} from './pedal'
import { PEDAL_PADRAO } from './pedalConfig'

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

/**
 * O SINTOMA: "desliguei e liguei o pedal e ele não aciona a Cibelly" — e abrir
 * a tela de configuração e fechar, MESMO SEM SALVAR, fazia voltar. Sem salvar
 * significa que a configuração não mudou: o que mudava era o FOCO, que o modal
 * tirava de cima de um campo de texto.
 */
describe('pedal com o foco num campo', () => {
  const config = { patientCode: 'PageDown', generalCode: 'PageUp', activation: 'hold' as const }
  const campo = document.createElement('input')
  const dente = document.createElement('div')

  it('o pisão vale mesmo com o foco num campo', () => {
    expect(pedalEngolidoPorCampo('PageDown', campo, config)).toBe(false)
    expect(pedalEngolidoPorCampo('PageUp', campo, config)).toBe(false)
  })

  // Se J e F passassem por cima do campo, escrever "jejum" numa anotação
  // abriria o microfone no meio da palavra.
  it('J e F continuam cedendo a vez para quem está digitando', () => {
    expect(pedalEngolidoPorCampo(PEDAL_PADRAO.patientCode, campo, config)).toBe(true)
    expect(pedalEngolidoPorCampo(PEDAL_PADRAO.generalCode, campo, config)).toBe(true)
  })

  it('fora de campo, tudo passa', () => {
    expect(pedalEngolidoPorCampo('PageDown', dente, config)).toBe(false)
    expect(pedalEngolidoPorCampo(PEDAL_PADRAO.patientCode, dente, config)).toBe(false)
    expect(pedalEngolidoPorCampo('KeyZ', dente, config)).toBe(false)
  })

  it('reconhece o que é pedal e o que é teclado', () => {
    expect(ehCodigoDePedal('PageDown', config)).toBe(true)
    expect(ehCodigoDePedal(PEDAL_PADRAO.patientCode, config)).toBe(false)
    expect(ehCodigoDePedal('KeyZ', config)).toBe(false)
  })
})
