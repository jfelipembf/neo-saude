import { describe, expect, it } from 'vitest'
import {
  guiaPodeSerEmitida, pendenciasDaGuia, resumoDasPendencias,
  type CadastroDaGuia,
} from './tissReadiness'

/** Cadastro COMPLETO — cada teste estraga só o campo que quer testar. */
function cadastro(over: Partial<CadastroDaGuia> = {}): CadastroDaGuia {
  return {
    clinica: { cnes: '1234567' },
    convenio: { nome: 'Unimed', ans: '30.437-3', providerCode: 'A9981' },
    profissional: {
      nome: 'Dra. Ana', license: '4567', council: 'CRM', councilState: 'SE', cbo: '225125',
    },
    paciente: {
      nome: 'Lucas', insuranceCard: '0123456789', insuranceCardValidUntil: '31/12/2027',
    },
    procedimentos: [
      { descricao: 'Consulta', tussCode: '10101012', tussTable: '22', valor: 120 },
    ],
    atendimentoIso: '2026-07-27',
    ...over,
  }
}

describe('pendenciasDaGuia', () => {
  it('cadastro completo não tem pendência', () => {
    expect(pendenciasDaGuia(cadastro())).toEqual([])
    expect(guiaPodeSerEmitida(cadastro())).toBe(true)
  })

  it('cada campo obrigatório vazio vira uma pendência', () => {
    const casos: [Partial<CadastroDaGuia>, string][] = [
      [{ clinica: {} }, 'CNES'],
      [{ convenio: { nome: 'Unimed', providerCode: 'A1' } }, 'registro ANS'],
      [{ convenio: { nome: 'Unimed', ans: '1' } }, 'código do prestador'],
    ]
    for (const [estrago, esperado] of casos) {
      const faltas = pendenciasDaGuia(cadastro(estrago))
      expect(faltas.some(f => f.texto.includes(esperado))).toBe(true)
    }
  })

  it('profissional sem conselho, UF, registro ou CBO não fatura', () => {
    const faltas = pendenciasDaGuia(cadastro({ profissional: { nome: 'Dra. Ana' } }))
    expect(faltas).toHaveLength(4)
    expect(faltas.every(f => f.origem === 'profissional')).toBe(true)
  })

  // A pendência tem de dizer DE QUEM é — sem o nome, numa clínica com cinco
  // profissionais a recepção não sabe qual cadastro abrir.
  it('a pendência nomeia a pessoa', () => {
    const faltas = pendenciasDaGuia(cadastro({ profissional: { nome: 'Dra. Ana', council: 'CRM', councilState: 'SE', license: '1' } }))
    expect(faltas[0].texto).toContain('Dra. Ana')
  })

  it('paciente sem carteirinha não fatura', () => {
    const faltas = pendenciasDaGuia(cadastro({ paciente: { nome: 'Lucas' } }))
    expect(faltas.some(f => f.texto.includes('carteirinha'))).toBe(true)
  })

  // A data que vale é a DO ATENDIMENTO, não a de hoje: guia atrasada de um
  // atendimento antigo pode estar perfeitamente válida.
  it('carteirinha vencida ANTES do atendimento é pendência', () => {
    const faltas = pendenciasDaGuia(cadastro({
      paciente: { nome: 'Lucas', insuranceCard: '1', insuranceCardValidUntil: '30/06/2026' },
      atendimentoIso: '2026-07-27',
    }))
    expect(faltas.some(f => f.texto.includes('venceu'))).toBe(true)
  })

  it('carteirinha vencida DEPOIS do atendimento não é pendência', () => {
    const faltas = pendenciasDaGuia(cadastro({
      paciente: { nome: 'Lucas', insuranceCard: '1', insuranceCardValidUntil: '30/06/2026' },
      atendimentoIso: '2026-05-10',
    }))
    expect(faltas).toEqual([])
  })

  it('validade em formato inválido não inventa pendência', () => {
    const faltas = pendenciasDaGuia(cadastro({
      paciente: { nome: 'Lucas', insuranceCard: '1', insuranceCardValidUntil: 'sei lá' },
    }))
    expect(faltas).toEqual([])
  })

  it('guia sem procedimento nenhum não sai', () => {
    const faltas = pendenciasDaGuia(cadastro({ procedimentos: [] }))
    expect(faltas.some(f => f.origem === 'guia')).toBe(true)
  })

  it('procedimento sem TUSS, sem tabela ou sem valor não sai', () => {
    const faltas = pendenciasDaGuia(cadastro({
      procedimentos: [{ descricao: 'Retorno', valor: 0 }],
    }))
    expect(faltas).toHaveLength(3)
    expect(faltas.every(f => f.origem === 'procedimento')).toBe(true)
    expect(faltas.every(f => f.texto.includes('Retorno'))).toBe(true)
  })

  // Valor zero é ausência de contrato, não "a operadora paga zero" — mesma
  // distinção do insuranceServicePricesService.
  it('valor zero cita a operadora, para saber com quem negociar', () => {
    const faltas = pendenciasDaGuia(cadastro({
      procedimentos: [{ descricao: 'Consulta', tussCode: '1', tussTable: '22', valor: 0 }],
    }))
    expect(faltas[0].texto).toContain('Unimed')
  })

  it('cada procedimento é checado, não só o primeiro', () => {
    const faltas = pendenciasDaGuia(cadastro({
      procedimentos: [
        { descricao: 'Consulta', tussCode: '1', tussTable: '22', valor: 120 },
        { descricao: 'Curativo', tussCode: '2', tussTable: '22', valor: 0 },
      ],
    }))
    expect(faltas).toHaveLength(1)
    expect(faltas[0].texto).toContain('Curativo')
  })
})

describe('resumoDasPendencias', () => {
  it('sem pendência, diz que está pronta', () => {
    expect(resumoDasPendencias([])).toBe('Pronta para faturar.')
  })

  it('agrupa por quem resolve', () => {
    const texto = resumoDasPendencias(pendenciasDaGuia(cadastro({
      clinica: {},
      profissional: { nome: 'Dra. Ana', council: 'CRM', councilState: 'SE', license: '1' },
    })))
    expect(texto).toContain('Clínica:')
    expect(texto).toContain('Profissional:')
  })
})
