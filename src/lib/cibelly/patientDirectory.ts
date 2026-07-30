import { matchesSearch } from '@/utils/search'
import { pareceMesmoNome } from '@/utils/spokenNameMatch'

export interface PatientDirectoryEntry {
  id: string
  code: string
  name: string
  commonName?: string
  status?: 'active' | 'inactive'
  insurance?: string
  lastVisit?: string
}

export type PatientReferenceResolution<T extends PatientDirectoryEntry> =
  | { ok: true; patient: T }
  | { ok: false; error: string }

export interface PatientDirectoryQuery {
  busca?: string
  situacao?: 'ativos' | 'inativos' | 'todos'
}

const MAX_SPOKEN_PATIENTS = 20

export function describeDirectoryPatient(
  patient: PatientDirectoryEntry,
): string {
  return `${patient.name} (${patient.code})`
}

export function resolvePatientReference<T extends PatientDirectoryEntry>(
  patients: T[],
  reference: string,
): PatientReferenceResolution<T> {
  const search = reference.trim()
  if (!search) return { ok: false, error: 'Diga o nome ou o código do paciente.' }

  const normalized = search.toLocaleLowerCase('pt-BR')
  const exact = patients.filter(patient =>
    patient.code.toLocaleLowerCase('pt-BR') === normalized
    || patient.name.trim().toLocaleLowerCase('pt-BR') === normalized
    || patient.commonName?.trim().toLocaleLowerCase('pt-BR') === normalized)
  const porTrecho = patients.filter(patient =>
    matchesSearch(patient.code, search)
    || matchesSearch(patient.name, search)
    || Boolean(patient.commonName && matchesSearch(patient.commonName, search)))

  /**
   * TERCEIRA CAMADA: o nome como ele FOI DITO.
   *
   * A busca por trecho basta para quem digita. Para quem fala, não: a
   * transcrição erra em nome próprio e erra calada. "michele dotrovisk" contra
   * "Michelle Dratovsky" falha nas duas palavras — `'michelle'.includes(
   * 'michele')` é falso por causa do segundo L —, e a resposta era "não
   * encontrei paciente" com o nome certo na base.
   *
   * SÓ QUANDO AS DUAS ANTERIORES NÃO ACHARAM NADA, nesta ordem de propósito:
   * quem escreveu o nome exato nunca é levado a uma aproximação, e a
   * aproximação nunca disputa com uma correspondência literal. Se ela trouxer
   * mais de um, o caminho abaixo já pergunta qual — aproximar demais custa uma
   * pergunta, aproximar de menos custa um paciente que existe e não é achado.
   *
   * O código (PAC-000123) fica FORA: ele é sequência, não fala. Aproximar
   * dígito acharia o paciente vizinho, e sem nada na frase que denuncie a
   * troca.
   */
  const matches = exact.length > 0
    ? exact
    : porTrecho.length > 0
      ? porTrecho
      : patients.filter(patient =>
        pareceMesmoNome(patient.name, search)
        || Boolean(patient.commonName && pareceMesmoNome(patient.commonName, search)))

  if (matches.length === 0) {
    return { ok: false, error: `Não encontrei paciente com nome ou código "${search}".` }
  }
  if (matches.length > 1) {
    const options = matches
      .slice(0, 8)
      .map(describeDirectoryPatient)
      .join('; ')
    const remaining = matches.length > 8 ? ` e mais ${matches.length - 8}` : ''
    return {
      ok: false,
      error: `Há mais de um paciente: ${options}${remaining}. Pergunte qual, pelo nome completo ou pelo código.`,
    }
  }
  return { ok: true, patient: matches[0] }
}

export function queryPatientDirectory(
  patients: PatientDirectoryEntry[],
  query: PatientDirectoryQuery = {},
) {
  const search = query.busca?.trim()
  const situation = query.situacao ?? 'todos'
  const matches = patients
    .filter(patient => situation === 'todos'
      || (situation === 'ativos' && patient.status !== 'inactive')
      || (situation === 'inativos' && patient.status === 'inactive'))
    .filter(patient => !search
      || matchesSearch(patient.code, search)
      || matchesSearch(patient.name, search)
      || Boolean(patient.commonName && matchesSearch(patient.commonName, search)))
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))

  if (matches.length === 0) {
    return {
      ok: true,
      total: 0,
      pacientes: [],
      resposta: search
        ? `Não encontrei paciente com nome ou código "${search}".`
        : 'Não há pacientes cadastrados nesse filtro.',
    }
  }

  const visible = matches.slice(0, MAX_SPOKEN_PATIENTS)
  const patientsSafe = visible.map(patient => ({
    nome: patient.name,
    nomeComum: patient.commonName,
    codigo: patient.code,
    situacao: patient.status === 'inactive' ? 'inativo' : 'ativo',
    convenio: patient.insurance,
    ultimaVisita: patient.lastVisit,
  }))
  const list = visible.map(describeDirectoryPatient).join('; ')
  const continuation = matches.length > visible.length
    ? ` Mostrei os primeiros ${visible.length}; diga um nome ou código para filtrar.`
    : ''

  return {
    ok: true,
    total: matches.length,
    exibidos: visible.length,
    pacientes: patientsSafe,
    resposta: `${matches.length === 1 ? 'Paciente encontrado' : `${matches.length} pacientes encontrados`}: ${list}.${continuation}`,
  }
}
