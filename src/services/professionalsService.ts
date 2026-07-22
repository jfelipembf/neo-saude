import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import type { ClientPayload } from '@/lib/tenant'
import type { ClientInsert, Insert, Update } from '@/lib/db'
import { capitalizeName, cepToDb, phoneToDb, emailToDb, ufToDb } from '@/utils/text'
import { brToIsoDate, isoToBrDate } from '@/utils/date'
import type { Professional, EducationItem, ExperienceItem } from '@/types/domain'

/** Núcleo do profissional (sem currículo). Exportado porque o responsável
 *  técnico é lido da MESMA tabela por outro recorte (ver clinicService). */
export const PROFESSIONAL_CORE_COLUMNS =
  'id, clinic_id, code, name, specialty, description, rating, license, color, photo_url, status, sex, birth_date, email, phone, whatsapp, cep, state, city, neighborhood, number, specializations, courses, languages'

export type ProfessionalRow = {
  id: string
  clinic_id: string
  code: string
  name: string
  specialty: string
  description: string | null
  rating: number | null
  license: string
  color: string | null
  photo_url: string | null
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

export function toProfessionalCore(row: ProfessionalRow): Professional {
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
    photo: row.photo_url ?? undefined,
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
    .select(PROFESSIONAL_CORE_COLUMNS)
    .eq('clinic_id', getCurrentClinicId())
    .order('name')
  if (error) throw error
  return (data as ProfessionalRow[]).map(toProfessionalCore)
}

// Perfil: núcleo + currículo (education/experiences das tabelas filhas).
export async function getProfessional(id: string): Promise<Professional | undefined> {
  const [{ data, error }, education, experiences] = await Promise.all([
    supabase.from('professional').select(PROFESSIONAL_CORE_COLUMNS).eq('id', id).maybeSingle(),
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
  photo?: string
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
  color: 'color', photo: 'photo_url', sex: 'sex', email: 'email', phone: 'phone', whatsapp: 'whatsapp',
  cep: 'cep', state: 'state', city: 'city', neighborhood: 'neighborhood', number: 'number',
  status: 'status', specializations: 'specializations', courses: 'courses', languages: 'languages',
}

/** Regrava a formação acadêmica (tabela filha). `undefined` = o form não enviou
 *  a seção, então nada é tocado; `[]` = o form esvaziou a seção. */
async function replaceEducation(
  clinicId: string,
  professionalId: string,
  items: EducationItem[] | undefined,
): Promise<void> {
  if (items === undefined) return
  const { error: delError } = await supabase
    .from('professional_education')
    .delete()
    .eq('professional_id', professionalId)
  if (delError) throw delError
  if (items.length === 0) return
  const rows = items.map((item, index) => ({
    clinic_id: clinicId,
    professional_id: professionalId,
    course: item.course,
    institution: item.institution,
    year: item.year ? Number(item.year) : null,
    sort_order: index,
  }))
  const { error } = await supabase.from('professional_education').insert(rows)
  if (error) throw error
}

/** Regrava as passagens profissionais (tabela filha). Mesma regra do currículo. */
async function replaceExperiences(
  clinicId: string,
  professionalId: string,
  items: ExperienceItem[] | undefined,
): Promise<void> {
  if (items === undefined) return
  const { error: delError } = await supabase
    .from('professional_experience')
    .delete()
    .eq('professional_id', professionalId)
  if (delError) throw delError
  if (items.length === 0) return
  const rows = items.map((item, index) => ({
    clinic_id: clinicId,
    professional_id: professionalId,
    position: item.position,
    workplace: item.workplace,
    period: item.period,
    sort_order: index,
  }))
  const { error } = await supabase.from('professional_experience').insert(rows)
  if (error) throw error
}

/**
 * O que o formulário de novo profissional envia: tudo do domínio MENOS os
 * campos que nascem no servidor (`id`, `clinicId`, `code`).
 */
export type NewProfessional = ClientPayload<Professional>

/** Cadastra um profissional e devolve o `id` criado. */
export async function addProfessional(payload: NewProfessional): Promise<string> {
  const clinicId = getCurrentClinicId()

  // `code` NÃO vai daqui: quem o preenche é o trigger `tr_code` (BEFORE INSERT),
  // como em todo cadastro do app — daí o `ClientInsert`. Pré-alocar pela RPC
  // `next_code` só faz sentido quando o número precisa aparecer ANTES de salvar
  // (é o caso do orçamento); aqui ele nunca é exibido, e cada insert recusado
  // (limite de vagas do plano, RLS) queimaria um PRO-000001 à toa.
  //
  // `rating` fica de fora: é a nota média dos atendimentos, não é digitada.
  const row: ClientInsert<'professional'> = {
    clinic_id: clinicId,
    name: capitalizeName(payload.name),
    specialty: payload.specialty,
    description: payload.description ?? null,
    license: payload.license,
    color: payload.color ?? null,
    status: payload.status,
    sex: payload.sex ?? null,
    birth_date: brToIsoDate(payload.birthDate),
    email: emailToDb(payload.email),
    phone: phoneToDb(payload.phone),
    whatsapp: phoneToDb(payload.whatsapp),
    cep: cepToDb(payload.cep),
    state: ufToDb(payload.state),
    city: payload.city ?? null,
    neighborhood: payload.neighborhood ?? null,
    number: payload.number ?? null,
    specializations: payload.specializations ?? [],
    courses: payload.courses ?? [],
    languages: payload.languages ?? [],
  }

  const { data, error } = await supabase
    .from('professional')
    .insert(row as Insert<'professional'>)
    .select('id')
    .single()
  if (error) throw error

  const id = data.id
  await replaceEducation(clinicId, id, payload.education)
  await replaceExperiences(clinicId, id, payload.experiences)
  return id
}

/**
 * Liga o profissional a um login da clínica (a RPC valida o vínculo em
 * `clinic_user` e recusa um login já usado por outro profissional).
 */
export async function linkProfessionalToUser(professionalId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('link_professional_user', {
    p_professional: professionalId,
    p_user: userId,
  })
  if (error) throw error
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
  // Normaliza os campos com domínio de formato (evita erro de constraint).
  if (payload.cep !== undefined) patch.cep = cepToDb(payload.cep)
  if (payload.state !== undefined) patch.state = ufToDb(payload.state)
  if (payload.email !== undefined) patch.email = emailToDb(payload.email)
  if (payload.phone !== undefined) patch.phone = phoneToDb(payload.phone)
  if (payload.whatsapp !== undefined) patch.whatsapp = phoneToDb(payload.whatsapp)
  if (payload.birthDate !== undefined) patch.birth_date = brToIsoDate(payload.birthDate)
  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from('professional').update(patch as Update<'professional'>).eq('id', id)
    if (error) throw error
  }

  // 2) Currículo em tabelas filhas — reconcilia só se o form enviou a seção.
  await replaceEducation(clinicId, id, payload.education)
  await replaceExperiences(clinicId, id, payload.experiences)
}
