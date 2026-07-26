import { describe, expect, it } from 'vitest'
import {
  isToothMutationTool,
  looksLikeUnservedToothCommand,
  mutationToolMatchesSpeech,
  parseDeterministicToothCommand,
  toothCommandFingerprint,
} from './commandGuard'

describe('toothCommandFingerprint', () => {
  it('deduplica dentes e superfícies em ordens diferentes', () => {
    const a = toothCommandFingerprint('marcar_dente', {
      dentes: [18, 28],
      achado: 'carie',
      superficies: ['mesial', 'distal'],
    })
    const b = toothCommandFingerprint('marcar_dente', {
      superficies: ['distal', 'mesial'],
      achado: 'carie',
      dentes: [28, 18],
    })
    expect(a).toBe(b)
  })

  it('não cria chave para consulta ou ferramenta externa', () => {
    expect(toothCommandFingerprint('ler_odontograma', { dentes: [18] })).toBeNull()
    expect(isToothMutationTool('consultar_agenda')).toBe(false)
  })
})

describe('mutationToolMatchesSpeech', () => {
  it('distingue restaurar o dente de inserir uma marcação', () => {
    expect(mutationToolMatchesSpeech(
      'Insira o dente 48.',
      'marcar_dente',
      { dentes: [48], achado: 'ausente' },
    )).toBe(false)
    expect(mutationToolMatchesSpeech(
      'Insira o dente 48.',
      'restaurar_dente',
      { dentes: [48] },
    )).toBe(true)
    expect(mutationToolMatchesSpeech(
      'Insira uma marcação de mobilidade grau 2 no dente 16.',
      'marcar_dente',
      { dentes: [16], achado: 'mobilidade', grauMobilidade: 2 },
    )).toBe(true)
  })

  it('rejeita leitura quando a fala pediu alteração', () => {
    expect(mutationToolMatchesSpeech(
      'Reverta o dente 48.',
      'ler_odontograma',
      { dentes: [48] },
    )).toBe(false)
  })

  it('rejeita dente, material ou grau diferentes do que foi falado', () => {
    expect(mutationToolMatchesSpeech(
      'Dente 44, obturação em amálgama mesial.',
      'marcar_dente',
      { dentes: [24], achado: 'restauracao', superficies: ['mesial'], material: 'amalgama' },
    )).toBe(false)
    expect(mutationToolMatchesSpeech(
      'Mobilidade grau 2 no dente 16.',
      'marcar_dente',
      { dentes: [16], achado: 'mobilidade', grauMobilidade: 1 },
    )).toBe(false)
    expect(mutationToolMatchesSpeech(
      'Restauração de amálgama mesial no dente 44.',
      'marcar_dente',
      { dentes: [44], achado: 'restauracao', superficies: ['mesial'], material: 'resina' },
    )).toBe(false)
  })

  it('aceita faixa expandida na chamada', () => {
    expect(mutationToolMatchesSpeech(
      'Marque cárie mesial do 14 ao 17.',
      'marcar_dente',
      { dentes: [14, 15, 16, 17], achado: 'carie', superficies: ['mesial'] },
    )).toBe(true)
  })

  it('reconhece presente e presentes como restauração do dente', () => {
    expect(mutationToolMatchesSpeech(
      'Marque o dente 38 como presente.',
      'restaurar_dente',
      { dentes: [38] },
    )).toBe(true)
    expect(mutationToolMatchesSpeech(
      'Marque os dentes 18 e 48 como presentes.',
      'restaurar_dente',
      { dentes: [18, 48] },
    )).toBe(true)
    expect(mutationToolMatchesSpeech(
      'Marque o dente 38 como presente.',
      'marcar_dente',
      { dentes: [38], achado: 'ausente' },
    )).toBe(false)
  })

  it('rejeita dentes extras mesmo quando um número foi repetido na fala', () => {
    expect(mutationToolMatchesSpeech(
      'Marque os dentes 28 e 28 como presentes.',
      'restaurar_dente',
      { dentes: [28, 48] },
    )).toBe(false)
  })

  // ⚠️ VERBOS DE TIRAR, todos de atendimento real. Antes só "remova" era
  // reconhecido — e a guarda não ficava neutra nos outros: ela APROVAVA
  // `marcar_dente` e RECUSAVA `apagar_marcacao`, o inverso exato do pedido.
  // Foi assim que "Tire a cárie do dente 24" gravou uma cárie em três faces.
  it.each([
    'Tire a cárie do dente 24.',
    'Remova a cárie do dente 24.',
    'Reverta a cárie do dente 24.',
    'Cancele a cárie do dente 24.',
    'Exclua a cárie do dente 24.',
    'Retire a cárie do dente 24.',
  ])('tirar achado exige apagar_marcacao: %s', text => {
    expect(mutationToolMatchesSpeech(text, 'apagar_marcacao', { dentes: [24], achado: 'carie' })).toBe(true)
    expect(mutationToolMatchesSpeech(text, 'marcar_dente', { dentes: [24], achado: 'carie' })).toBe(false)
  })

  it('tirar mobilidade não exige o grau (só marcar exige)', () => {
    expect(mutationToolMatchesSpeech(
      'Reverta a mobilidade do dente 24.', 'apagar_marcacao', { dentes: [24], achado: 'mobilidade' },
    )).toBe(true)
  })

  // "reverta" serve aos DOIS sentidos; quem separa é haver ou não achado
  // nomeado. Sem achado, é a presença do dente que volta.
  it('"reverta o dente" sem achado continua sendo restauração de presença', () => {
    expect(mutationToolMatchesSpeech('Reverta o dente 28.', 'restaurar_dente', { dentes: [28] })).toBe(true)
    expect(mutationToolMatchesSpeech('Reverta o dente 28.', 'marcar_dente', { dentes: [28], achado: 'carie' })).toBe(false)
  })
})

describe('looksLikeUnservedToothCommand', () => {
  it.each([
    'Cárie mesial no dente 25.',
    'Mobilidade grau 2 no dente 16.',
    'Marque os dentes 18 e 28 como ausentes.',
    'Remova a marcação de ausência do dente 48.',
    'Insira o dente 38.',
    'Dente 48 está presente.',
  ])('detecta comando completo: %s', text => {
    expect(looksLikeUnservedToothCommand(text)).toBe(true)
  })

  it.each([
    'Como está o dente 25?',
    'O dente 48 está presente?',
    'Qual o achado do dente 16?',
    'Cibelly, vamos trabalhar no dente 44.',
    'Mobilidade no dente 16.',
    'Obturação mesial no dente 24.',
    'Amálgama.',
    'Sim, estou aqui.',
  ])('não recupera pergunta ou fala incompleta: %s', text => {
    expect(looksLikeUnservedToothCommand(text)).toBe(false)
  })

  // Superfície/grau/material são exigência de MARCAR (sem eles o motor
  // descarta). Para TIRAR, a ordem já está completa — e era exatamente aqui
  // que o watchdog ficava cego: "Tire a cárie do 24" não disparava nada.
  it.each([
    'Tire a cárie do dente 24.',
    'Remova a mobilidade do dente 24.',
    'Exclua a restauração do dente 24.',
  ])('detecta comando de remoção sem exigir superfície/grau: %s', text => {
    expect(looksLikeUnservedToothCommand(text)).toBe(true)
  })
})

describe('parseDeterministicToothCommand', () => {
  it.each([
    ['Marque os dentes 18 e 48 como presentes.', [18, 48]],
    ['Marque os dentes 28 e 28 como presentes.', [28]],
    ['Insira o dente 38.', [38]],
    ['Reverta os dentes 48 e 38.', [38, 48]],
  ] as const)('recupera restauração inequívoca: %s', (text, dentes) => {
    expect(parseDeterministicToothCommand(text)).toEqual({
      tool: 'restaurar_dente',
      args: { dentes: [...dentes] },
    })
  })

  it.each([
    'O dente 38 está presente?',
    'Insira uma marcação de mobilidade grau 2 no dente 16.',
    'Reverta a mobilidade do dente 24.',
  ])('não executa diretamente fala ambígua ou outro achado: %s', text => {
    expect(parseDeterministicToothCommand(text)).toBeNull()
  })
})
