import { describe, expect, it } from 'vitest'
import {
  queryPatientDirectory,
  resolvePatientReference,
  type PatientDirectoryEntry,
} from './patientDirectory'

const patients: PatientDirectoryEntry[] = [
  {
    id: '1',
    code: 'PAC-000001',
    name: 'Ana Maria Ferreira',
    status: 'active',
    insurance: 'Particular',
  },
  {
    id: '2',
    code: 'PAC-000002',
    name: 'Ana Paula Souza',
    status: 'inactive',
    insurance: 'Saúde Mais',
  },
  {
    id: '3',
    code: 'PAC-000003',
    name: 'José Felipe Macedo',
    commonName: 'Felipe',
    status: 'active',
  },
]

describe('diretório de pacientes da Cibelly', () => {
  it('lista pacientes sem expor id técnico ou telefone', () => {
    const result = queryPatientDirectory(patients)

    expect(result.total).toBe(3)
    expect(result.resposta).toContain('Ana Maria Ferreira (PAC-000001)')
    expect(result.pacientes[0]).not.toHaveProperty('id')
    expect(result.pacientes[0]).not.toHaveProperty('telefone')
  })

  it('filtra por nome comum, código e situação', () => {
    expect(queryPatientDirectory(patients, { busca: 'Felipe' }).total).toBe(1)
    expect(queryPatientDirectory(patients, { busca: 'PAC-000002' }).total).toBe(1)
    expect(queryPatientDirectory(patients, { situacao: 'inativos' }).total).toBe(1)
  })

  it('não escolhe sozinho entre pacientes com o mesmo primeiro nome', () => {
    const result = resolvePatientReference(patients, 'Ana')

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toContain('Ana Maria Ferreira (PAC-000001)')
    expect(!result.ok && result.error).toContain('Ana Paula Souza (PAC-000002)')
  })

  it('resolve com segurança pelo código humano', () => {
    const result = resolvePatientReference(patients, 'PAC-000003')
    expect(result.ok && result.patient.name).toBe('José Felipe Macedo')
  })
})

/**
 * NOME DITO EM VOZ ALTA. O caso real: "agende uma consulta amanhã para michele
 * dotrovisk às 8" devolvia "não encontrei paciente", com o nome certo na base.
 */
describe('resolvePatientReference com nome falado', () => {
  const base = [
    { id: 'p1', code: 'PAC-000001', name: 'Michelle Dratovsky', status: 'active' as const },
    { id: 'p2', code: 'PAC-000002', name: 'João Santos', status: 'active' as const },
  ]

  it('acha o paciente mesmo com o sobrenome transcrito errado', () => {
    const r = resolvePatientReference(base, 'michele dotrovisk')
    expect(r.ok).toBe(true)
    expect(r.ok && r.patient.id).toBe('p1')
  })

  // A ordem importa: quem escreve o nome exato nunca deve ser levado a uma
  // aproximação, e a aproximação nunca disputa com uma correspondência literal.
  it('a correspondência literal continua tendo precedência', () => {
    const r = resolvePatientReference(base, 'joao')
    expect(r.ok && r.patient.id).toBe('p2')
  })

  it('nome que não existe continua não existindo', () => {
    const r = resolvePatientReference(base, 'roberto carvalho')
    expect(r.ok).toBe(false)
  })
})
