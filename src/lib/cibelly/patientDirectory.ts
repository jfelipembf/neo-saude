import { matchesSearch } from '@/utils/search'

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
  const matches = exact.length > 0
    ? exact
    : patients.filter(patient =>
      matchesSearch(patient.code, search)
      || matchesSearch(patient.name, search)
      || Boolean(patient.commonName && matchesSearch(patient.commonName, search)))

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
