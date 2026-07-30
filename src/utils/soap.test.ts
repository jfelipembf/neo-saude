import { describe, expect, it } from 'vitest'
import {
  filledSoapSections,
  isBlankSoap,
  isSameSoapNote,
  normalizeSoapNote,
  parseSoapHtml,
  pickSoapSections,
  soapPlainText,
  soapToHtml,
} from './soap'

// O que está sendo travado aqui é a PONTE com a edge function `transcribe-audio`
// (ditado por voz e "Aprimorar com IA"), que devolve HTML corrido e NÃO PODE ser
// alterada. Se o parser quebrar, o ditado passa a gravar a evolução inteira numa
// seção só — em silêncio, sem erro nenhum na tela. Daí o teste.

/** Saída canônica da edge function (ver SOAP_RULES em transcribe-audio). */
const AI_OUTPUT =
  '<p><strong>Subjetivo:</strong> Refere dor no ombro direito ao elevar o braço.</p>' +
  '<p><strong>Objetivo:</strong> Flexão de ombro 120°, força grau 4.</p>' +
  '<p><strong>Avaliação:</strong> Tendinopatia do supraespinhal em evolução favorável.</p>' +
  '<p><strong>Plano:</strong> Manter fortalecimento de manguito 3x/semana.</p>'

describe('parseSoapHtml — saída da edge function', () => {
  it('quebra as quatro seções da saída canônica', () => {
    expect(parseSoapHtml(AI_OUTPUT)).toEqual({
      subjective: '<p>Refere dor no ombro direito ao elevar o braço.</p>',
      objective: '<p>Flexão de ombro 120°, força grau 4.</p>',
      assessment: '<p>Tendinopatia do supraespinhal em evolução favorável.</p>',
      plan: '<p>Manter fortalecimento de manguito 3x/semana.</p>',
    })
  })

  it('seção ausente vira chave ausente, nunca string vazia', () => {
    const note = parseSoapHtml(
      '<p><strong>Subjetivo:</strong> Sem dor hoje.</p><p><strong>Plano:</strong> Alta na próxima.</p>',
    )
    expect(note).toEqual({ subjective: '<p>Sem dor hoje.</p>', plan: '<p>Alta na próxima.</p>' })
    expect('objective' in note).toBe(false)
    expect('assessment' in note).toBe(false)
  })

  it('rótulo em branco não cria seção (o CHECK do banco recusaria)', () => {
    const note = parseSoapHtml('<p><strong>Subjetivo:</strong> Dor lombar.</p><p><strong>Plano:</strong> </p>')
    expect(note).toEqual({ subjective: '<p>Dor lombar.</p>' })
  })

  it('ordem trocada: manda o rótulo, não a posição', () => {
    const note = parseSoapHtml(
      '<p><strong>Plano:</strong> Reavaliar em 15 dias.</p><p><strong>Subjetivo:</strong> Melhorou do sono.</p>',
    )
    expect(note).toEqual({ subjective: '<p>Melhorou do sono.</p>', plan: '<p>Reavaliar em 15 dias.</p>' })
  })

  it('mais de um parágrafo dentro da mesma seção continua junto', () => {
    const note = parseSoapHtml(
      '<p><strong>Objetivo:</strong> Flexão 120°.</p><p>Abdução 90°.</p><p><strong>Plano:</strong> Manter.</p>',
    )
    expect(note.objective).toBe('<p>Flexão 120°.</p><p>Abdução 90°.</p>')
    expect(note.plan).toBe('<p>Manter.</p>')
  })

  it('aceita <b>, dois-pontos fora do negrito, caixa alta e acento faltando', () => {
    const note = parseSoapHtml(
      '<p><b>SUBJETIVO:</b> Dor 6/10.</p><p><strong>Avaliacao</strong>: Quadro estável.</p>',
    )
    expect(note).toEqual({ subjective: '<p>Dor 6/10.</p>', assessment: '<p>Quadro estável.</p>' })
  })

  it('rótulo sem negrito, abrindo o parágrafo, também é reconhecido', () => {
    const note = parseSoapHtml('<p>Subjetivo: Refere formigamento.</p><p>Plano: Iniciar neurodinâmica.</p>')
    expect(note).toEqual({
      subjective: '<p>Refere formigamento.</p>',
      plan: '<p>Iniciar neurodinâmica.</p>',
    })
  })

  it('"plano" no MEIO da frase não é rótulo', () => {
    const note = parseSoapHtml('<p><strong>Objetivo:</strong> Mudamos o plano: agora são 3x na semana.</p>')
    expect(note).toEqual({ objective: '<p>Mudamos o plano: agora são 3x na semana.</p>' })
  })
})

describe('parseSoapHtml — texto que não casa com nenhum rótulo', () => {
  // DECISÃO: cai em SUBJETIVO. É a seção do relato corrido (como a pessoa fala
  // quando não dita em SOAP) e é a única escolha que não PERDE o texto ditado.
  it('texto solto, sem nenhum rótulo, vai inteiro para Subjetivo', () => {
    expect(parseSoapHtml('<p>Paciente chegou andando sem auxílio.</p>')).toEqual({
      subjective: '<p>Paciente chegou andando sem auxílio.</p>',
    })
  })

  it('texto ANTES do primeiro rótulo entra no Subjetivo, junto do que vier rotulado', () => {
    const note = parseSoapHtml('<p>Chegou atrasado.</p><p><strong>Subjetivo:</strong> Dor ao subir escada.</p>')
    expect(note.subjective).toBe('<p>Chegou atrasado.</p><p>Dor ao subir escada.</p>')
  })

  it('HTML vazio/nulo devolve nota sem nenhuma seção', () => {
    expect(parseSoapHtml('')).toEqual({})
    expect(parseSoapHtml(null)).toEqual({})
    expect(parseSoapHtml('<p></p>')).toEqual({})
  })
})

describe('parseSoapHtml — ditado SOMANDO ao que já estava escrito', () => {
  // O ditado por voz manda `soapToHtml(nota) + htmlDitado` para o onChange: o
  // rótulo aparece DUAS vezes no mesmo texto. Sem juntar, a primeira metade da
  // evolução sumiria a cada ditado.
  it('rótulo repetido junta na mesma seção, na ordem em que foi escrito', () => {
    const already = soapToHtml({ objective: '<p>Flexão 120°.</p>' })
    const dictated = '<p><strong>Objetivo:</strong> Abdução 90°.</p><p><strong>Plano:</strong> Manter carga.</p>'
    expect(parseSoapHtml(already + dictated)).toEqual({
      objective: '<p>Flexão 120°.</p><p>Abdução 90°.</p>',
      plan: '<p>Manter carga.</p>',
    })
  })

  // O que já estava escrito passa pelo parser a CADA ditado: se ele reescreve
  // o parágrafo, o alinhamento aplicado pelo profissional some — e some em
  // silêncio, um pouco a cada gravação.
  it('não perde a formatação do parágrafo que já estava no editor', () => {
    const already = soapToHtml({ objective: '<p style="text-align: center">Flexão 120°.</p>' })
    const dictated = '<p><strong>Plano:</strong> Manter carga.</p>'
    expect(parseSoapHtml(already + dictated).objective).toBe('<p style="text-align: center">Flexão 120°.</p>')
  })
})

describe('soapToHtml', () => {
  it('devolve a nota num HTML só, no formato que a IA entende', () => {
    expect(soapToHtml({ subjective: '<p>Dor 3/10.</p>', plan: '<p>Manter.</p>' })).toBe(
      '<p><strong>Subjetivo:</strong></p><p>Dor 3/10.</p><p><strong>Plano:</strong></p><p>Manter.</p>',
    )
  })

  it('sempre na ordem canônica S-O-A-P, mesmo com a nota montada fora de ordem', () => {
    const html = soapToHtml({ plan: '<p>P</p>', subjective: '<p>S</p>', assessment: '<p>A</p>' })
    expect(html.indexOf('Subjetivo')).toBeLessThan(html.indexOf('Avaliação'))
    expect(html.indexOf('Avaliação')).toBeLessThan(html.indexOf('Plano'))
  })

  it('nota vazia/indefinida vira string vazia', () => {
    expect(soapToHtml(undefined)).toBe('')
    expect(soapToHtml({})).toBe('')
  })

  it('faz ida e volta com o parser sem perder nem inventar seção', () => {
    const note = parseSoapHtml(AI_OUTPUT)
    expect(parseSoapHtml(soapToHtml(note))).toEqual(note)
  })

  it('lista não é fatiada em parágrafos na ida e volta', () => {
    const note = { plan: '<ul><li><p>Alongar</p></li><li><p>Gelo 20min</p></li></ul>' }
    expect(parseSoapHtml(soapToHtml(note))).toEqual(note)
  })
})

describe('normalizeSoapNote', () => {
  it('descarta seção em branco (inclusive o <p></p> do editor limpo)', () => {
    expect(normalizeSoapNote({ subjective: '<p>Dor.</p>', objective: '<p></p>', plan: '   ' })).toEqual({
      subjective: '<p>Dor.</p>',
    })
  })

  it('nota sem nenhuma seção vira undefined — é assim que a coluna fica NULL', () => {
    expect(normalizeSoapNote({ objective: '<p><br></p>' })).toBeUndefined()
    expect(normalizeSoapNote({})).toBeUndefined()
    expect(normalizeSoapNote(undefined)).toBeUndefined()
  })

  it('preserva a formatação do editor (não reprocessa o HTML)', () => {
    const rich = { objective: '<p style="text-align: center"><strong>Flexão</strong> 120°</p>' }
    expect(normalizeSoapNote(rich)).toEqual(rich)
  })
})

describe('isBlankSoap / filledSoapSections / pickSoapSections', () => {
  it('reconhece nota vazia', () => {
    expect(isBlankSoap(undefined)).toBe(true)
    expect(isBlankSoap({ plan: '<p></p>' })).toBe(true)
    expect(isBlankSoap({ plan: '<p>Manter.</p>' })).toBe(false)
  })

  it('lista as seções preenchidas na ordem canônica', () => {
    expect(filledSoapSections({ plan: '<p>P</p>', subjective: '<p>S</p>', objective: '<p></p>' }))
      .toEqual(['subjective', 'plan'])
  })

  it('"repetir última sessão" copia só Objetivo e Plano', () => {
    const previous = { subjective: '<p>S</p>', objective: '<p>O</p>', assessment: '<p>A</p>', plan: '<p>P</p>' }
    expect(pickSoapSections(previous, ['objective', 'plan'])).toEqual({ objective: '<p>O</p>', plan: '<p>P</p>' })
  })

  it('seção vazia não é copiada mesmo se pedida', () => {
    expect(pickSoapSections({ objective: '<p>O</p>', plan: '<p></p>' }, ['objective', 'plan']))
      .toEqual({ objective: '<p>O</p>' })
  })
})

describe('soapPlainText / isSameSoapNote', () => {
  it('texto puro separa os parágrafos com espaço', () => {
    expect(soapPlainText('<p>Flexão 120°.</p><p>Abdução 90°.</p>')).toBe('Flexão 120°. Abdução 90°.')
    expect(soapPlainText(undefined)).toBe('')
  })

  it('trocar só a formatação NÃO faz uma evolução nova', () => {
    const a = { objective: '<p>Flexão 120°.</p>' }
    const b = { objective: '<p style="text-align: right"><em>Flexão 120°.</em></p>' }
    expect(isSameSoapNote(a, b)).toBe(true)
  })

  it('mudar o texto de qualquer seção já diferencia', () => {
    expect(isSameSoapNote({ objective: '<p>Flexão 120°.</p>' }, { objective: '<p>Flexão 130°.</p>' })).toBe(false)
    expect(isSameSoapNote({ objective: '<p>O</p>' }, { objective: '<p>O</p>', plan: '<p>P</p>' })).toBe(false)
  })

  it('seção ausente e seção em branco contam como iguais', () => {
    expect(isSameSoapNote({ plan: '<p>P</p>' }, { plan: '<p>P</p>', subjective: '<p></p>' })).toBe(true)
  })
})
