import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import type { Update } from '@/lib/db'
import { capitalizeName } from '@/utils/text'
import { brToIsoDate, isoToBrDate } from '@/utils/date'
import type { Professional, EducationItem, ExperienceItem } from '@/types/domain'

const CORE_COLUMNS =
  'id, clinic_id, code, name, specialty, description, rating, license, color, status, sex, birth_date, email, phone, whatsapp, cep, state, city, neighborhood, number, specializations, courses, languages'

type ProfessionalRow = {
  id: string
  clinic_id: string
  code: string
  name: string
  specialty: string
  description: string | null
  rating: number | null
  license: string
  color: string | null
  status: Professional['status']
  sex: Professional['sex'] | null
  birth_date: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  cep: string | null
  state: string | null
  city: string | null
  neighborhood: string | null
  number: string | null
  specializations: string[]
  courses: string[]
  languages: string[]
}

function toProfessionalCore(row: ProfessionalRow): Professional {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    code: row.code,
    name: row.name,
    specialty: row.specialty,
    description: row.description ?? undefined,
    rating: row.rating ?? undefined,
    license: row.license,
    color: row.color ?? undefined,
    status: row.status,
    sex: row.sex ?? undefined,
    birthDate: isoToBrDate(row.birth_date),
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    cep: row.cep ?? undefined,
    state: row.state ?? undefined,
    city: row.city ?? undefined,
    neighborhood: row.neighborhood ?? undefined,
    number: row.number ?? undefined,
    specializations: row.specializations ?? [],
    courses: row.courses ?? [],
    languages: row.languages ?? [],
  }
}

// Listagem: só o núcleo (a tabela não precisa do currículo — evita N joins).
export async function listProfessionals(): Promise<Professional[]> {
  const { data, error } = await supabase
    .from('professional')
    .select(CORE_COLUMNS)
    .eq('clinic_id', getCurrentClinicId())
    .order('name')
  if (error) throw error
  return (data as ProfessionalRow[]).map(toProfessionalCore)
}

// Perfil: núcleo + currículo (education/experiences das tabelas filhas).
export async function getProfessional(id: string): Promise<Professional | undefined> {
  const [{ data, error }, education, experiences] = await Promise.all([
    supabase.from('professional').select(CORE_COLUMNS).eq('id', id).maybeSingle(),
    supabase.from('professional_education').select('course, institution, year, sort_order').eq('professional_id', id).order('sort_order'),
    supabase.from('professional_experience').select('position, workplace, period, sort_order').eq('professional_id', id).order('sort_order'),
  ])
  if (error) throw error
  if (!data) return undefined
  if (education.error) throw education.error
  if (experiences.error) throw experiences.error

  const professional = toProfessionalCore(data as ProfessionalRow)
  professional.education = (education.data ?? []).map(e => ({
    course: e.course as string,
    institution: e.institution as string,
    year: e.year != null ? String(e.year) : '',
  }))
  professional.experiences = (experiences.data ?? []).map(x => ({
    position: x.position as string,
    workplace: x.workplace as string,
    period: x.period as string,
  }))
  return professional
}

/** Campos editáveis no perfil do profissional (dados pessoais E currículo —
 *  cada formulário envia só a sua parte; `undefined` não sobrescreve nada). */
export interface EditProfessional {
  name?: string
  specialty?: string
  license?: string
  description?: string
  color?: string
  sex?: Professional['sex']
  birthDate?: string
  email?: string
  phone?: string
  whatsapp?: string
  cep?: string
  state?: string
  city?: string
  neighborhood?: string
  number?: string
  status?: Professional['status']
  specializations?: string[]
  education?: EducationItem[]
  experiences?: ExperienceItem[]
  courses?: string[]
  languages?: string[]
}

// Só as chaves realmente enviadas viram colunas — o form de dados pessoais não
// apaga o currículo (e vice-versa). Chaves escalares camelCase → snake_case.
const SCALAR_MAP: Record<string, string> = {
  name: 'name', specialty: 'specialty', license: 'license', description: 'description',
  color: 'color', sex: 'sex', email: 'email', phone: 'phone', whatsapp: 'whatsapp',
  cep: 'cep', state: 'state', city: 'city', neighborhood: 'neighborhood', number: 'number',
  status: 'status', specializations: 'specializations', courses: 'courses', languages: 'languages',
}

export async function updateProfessional(id: string, payload: EditProfessional): Promise<void> {
  const clinicId = getCurrentClinicId()

  // 1) Colunas escalares/arrays da própria tabela professional.
  const patch: Record<string, unknown> = {}
  for (const [key, column] of Object.entries(SCALAR_MAP)) {
    const value = (payload as Record<string, unknown>)[key]
    if (value !== undefined) patch[column] = value
  }
  if (typeof patch.name === 'string') patch.name = capitalizeName(patch.name)
  if (payload.birthDate !== undefined) patch.birth_date = brToIsoDate(payload.birthDate)
  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from('professional').update(patch as Update<'professional'>).eq('id', id)
    if (error) throw error
  }

  // 2) Currículo em tabelas filhas — reconcilia só se o form enviou a seção.
  if (payload.education !== undefined) {
    const { error: delErr } = await supabase.from('professional_education').delete().eq('professional_id', id)
    if (delErr) throw delErr
    if (payload.education.length > 0) {
      const rows = payload.education.map((e, i) => ({
        clinic_id: clinicId,
        professional_id: id,
        course: e.course,
        institution: e.institution,
        year: e.year ? Number(e.year) : null,
        sort_order: i,
      }))
      const { error: insErr } = await supabase.from('professional_education').insert(rows)
      if (insErr) throw insErr
    }
  }

  if (payload.experiences !== undefined) {
    const { error: delErr } = await supabase.from('professional_experience').delete().eq('professional_id', id)
    if (delErr) throw delErr
    if (payload.experiences.length > 0) {
      const rows = payload.experiences.map((x, i) => ({
        clinic_id: clinicId,
        professional_id: id,
        position: x.position,
        workplace: x.workplace,
        period: x.period,
        sort_order: i,
      }))
      const { error: insErr } = await supabase.from('professional_experience').insert(rows)
      if (insErr) throw insErr
    }
  }
}
