import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import type { Insert } from '@/lib/db'
import {
  capitalizeName, phoneToDb, cpfToDb, emailToDb, cepToDb, ufToDb,
} from '@/utils/text'
import { toIsoDate } from '@/utils/date'
import type { Gender } from '@/types/domain'

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTAÇÃO DE PACIENTES por planilha (.xlsx / .csv), vindos de outra
// plataforma. O SheetJS é carregado sob demanda (import dinâmico) — só entra no
// bundle de quem abre a aba de importação.
// ─────────────────────────────────────────────────────────────────────────────

/** Colunas do modelo, na ordem em que aparecem na planilha de exemplo. */
export const IMPORT_TEMPLATE_HEADERS = [
  'nome', 'cpf', 'telefone', 'whatsapp', 'email',
  'data_nascimento', 'sexo', 'cep', 'estado', 'cidade', 'bairro', 'numero',
] as const

/** Cabeçalho da planilha (em pt, com variações) → campo do paciente. */
const HEADER_MAP: Record<string, keyof RawFields> = {
  nome: 'name', name: 'name', paciente: 'name', cliente: 'name', 'nome completo': 'name',
  cpf: 'cpf',
  telefone: 'phone', celular: 'phone', fone: 'phone', phone: 'phone', contato: 'phone', 'telefone/celular': 'phone',
  whatsapp: 'whatsapp', whats: 'whatsapp', zap: 'whatsapp',
  email: 'email', 'e-mail': 'email',
  'data_nascimento': 'birthDate', 'data de nascimento': 'birthDate', 'data nascimento': 'birthDate',
  nascimento: 'birthDate', aniversario: 'birthDate', birthdate: 'birthDate', nasc: 'birthDate',
  sexo: 'sex', genero: 'sex', sex: 'sex',
  cep: 'cep',
  estado: 'state', uf: 'state',
  cidade: 'city', municipio: 'city', city: 'city',
  bairro: 'neighborhood',
  numero: 'number', num: 'number', number: 'number', 'nº': 'number', 'n°': 'number',
}

interface RawFields {
  name?: unknown; cpf?: unknown; phone?: unknown; whatsapp?: unknown; email?: unknown
  birthDate?: unknown; sex?: unknown; cep?: unknown; state?: unknown; city?: unknown
  neighborhood?: unknown; number?: unknown
}

/** Linha pronta para inserir em `patient` (sem clinic_id, adicionado na hora). */
export interface PatientImportRow {
  name: string
  phone: string
  cpf: string | null
  whatsapp: string | null
  email: string | null
  birth_date: string | null
  sex: Gender | null
  cep: string | null
  state: string | null
  city: string | null
  neighborhood: string | null
  number: string | null
}

/** Linha que não pôde ser importada, com o motivo. */
export interface InvalidRow {
  line: number      // linha da planilha (2 = 1ª de dados, contando o cabeçalho)
  name: string
  reason: string
}

export interface ParsedImport {
  valid: PatientImportRow[]
  invalid: InvalidRow[]
  total: number
}

function normalizeHeader(h: string): string {
  // Remove os acentos (faixa de diacríticos combinantes) p/ casar cabeçalhos.
  return h.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function str(v: unknown): string {
  return v == null ? '' : String(v).trim()
}

function toSex(v: unknown): Gender | null {
  const s = str(v).toLowerCase()
  if (['m', 'masculino', 'male', 'homem', 'h'].includes(s)) return 'male'
  if (['f', 'feminino', 'female', 'mulher'].includes(s)) return 'female'
  return null
}

/** Nascimento: aceita Date (planilha), dd/mm/aaaa ou aaaa-mm-dd → ISO. */
function toBirthIso(v: unknown): string | null {
  if (v == null || v === '') return null
  if (v instanceof Date) return toIsoDate(v)
  const s = str(v)
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s)
  if (br) return `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  return null
}

function mapHeaders(obj: Record<string, unknown>): RawFields {
  const out: RawFields = {}
  for (const [key, val] of Object.entries(obj)) {
    const field = HEADER_MAP[normalizeHeader(key)]
    if (field) out[field] = val
  }
  return out
}

/**
 * Lê a planilha (.xlsx/.csv), mapeia as colunas em pt, normaliza cada campo e
 * separa as linhas VÁLIDAS (com nome e telefone com DDD) das inválidas, com o
 * motivo. Campos opcionais fora do formato viram vazio — nunca derrubam a linha.
 */
export async function parsePatientSheet(file: File): Promise<ParsedImport> {
  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { cellDates: true })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  const valid: PatientImportRow[] = []
  const invalid: InvalidRow[] = []

  rows.forEach((obj, i) => {
    const line = i + 2 // +1 pelo cabeçalho, +1 porque i é base 0
    const raw = mapHeaders(obj)
    const name = capitalizeName(str(raw.name))
    const phone = phoneToDb(str(raw.phone))

    if (!name) {
      // Linha totalmente vazia é ignorada em silêncio; só reporta se tem algo.
      if (Object.values(raw).some(v => str(v) !== '')) {
        invalid.push({ line, name: str(raw.name) || '(sem nome)', reason: 'Sem nome' })
      }
      return
    }
    if (!phone) {
      invalid.push({ line, name, reason: 'Telefone inválido — precisa de DDD (10 a 13 dígitos)' })
      return
    }

    valid.push({
      name,
      phone,
      cpf: cpfToDb(str(raw.cpf)),
      whatsapp: phoneToDb(str(raw.whatsapp)),
      email: emailToDb(str(raw.email)),
      birth_date: toBirthIso(raw.birthDate),
      sex: toSex(raw.sex),
      cep: cepToDb(str(raw.cep)),
      state: ufToDb(str(raw.state)),
      city: str(raw.city) || null,
      neighborhood: str(raw.neighborhood) || null,
      number: str(raw.number) || null,
    })
  })

  return { valid, invalid, total: rows.length }
}

/** Insere os pacientes válidos, em lotes (import grande não estoura numa tacada). */
export async function importPatients(rows: PatientImportRow[]): Promise<number> {
  const clinicId = getCurrentClinicId()
  const CHUNK = 500
  let inserted = 0
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK).map(r => ({ clinic_id: clinicId, ...r }))
    const { error } = await supabase.from('patient').insert(slice as Insert<'patient'>[])
    if (error) throw error
    inserted += slice.length
  }
  return inserted
}

/** Gera e baixa o modelo .xlsx (cabeçalhos + 2 linhas de exemplo). */
export async function downloadPatientTemplate(): Promise<void> {
  const XLSX = await import('xlsx')
  const example = [
    {
      nome: 'Maria Silva', cpf: '12345678901', telefone: '11987654321', whatsapp: '11987654321',
      email: 'maria.silva@email.com', data_nascimento: '15/03/1990', sexo: 'F',
      cep: '01310100', estado: 'SP', cidade: 'São Paulo', bairro: 'Bela Vista', numero: '1000',
    },
    {
      nome: 'João Souza', cpf: '', telefone: '2133445566', whatsapp: '',
      email: '', data_nascimento: '02/11/1985', sexo: 'M',
      cep: '', estado: 'RJ', cidade: 'Rio de Janeiro', bairro: 'Centro', numero: '',
    },
  ]
  const ws = XLSX.utils.json_to_sheet(example, { header: [...IMPORT_TEMPLATE_HEADERS] })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Pacientes')
  XLSX.writeFile(wb, 'modelo-importar-pacientes.xlsx')
}
