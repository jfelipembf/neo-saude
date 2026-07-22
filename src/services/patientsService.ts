import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import type { ClientInsert, Insert } from '@/lib/db'
import { capitalizeName, cepToDb, phoneToDb, emailToDb, ufToDb, digitsOnly } from '@/utils/text'
import { brToIsoDate, isoToBrDate } from '@/utils/date'
import type { Patient, Gender } from '@/types/domain'

const COLUMNS =
  'id, clinic_id, code, name, cpf, phone, insurance_id, last_visit, status, photo_url, sex, birth_date, email, whatsapp, cep, state, city, neighborhood, number'

// Rótulo do "sem convênio": no banco é insurance_id NULL (não é linha de insurance).
const PARTICULAR = 'Particular'

type PatientRow = {
  id: string
  clinic_id: string
  code: string
  name: string
  cpf: string | null
  phone: string
  insurance_id: string | null
  last_visit: string | null
  status: Patient['status']
  photo_url: string | null
  sex: Gender | null
  birth_date: string | null
  email: string | null
  whatsapp: string | null
  cep: string | null
  state: string | null
  city: string | null
  neighborhood: string | null
  number: string | null
}

/** Convênios da clínica como mapa id→nome (o domínio usa o NOME). */
async function insuranceNameById(clinicId: string): Promise<Map<string, string>> {
  const { data, error } = await supabase.from('insurance').select('id, name').eq('clinic_id', clinicId)
  if (error) throw error
  return new Map((data ?? []).map(i => [i.id as string, i.name as string]))
}

async function insuranceIdByName(clinicId: string, name: string | undefined): Promise<string | null> {
  if (!name || name === PARTICULAR) return null
  const { data, error } = await supabase
    .from('insurance')
    .select('id')
    .eq('clinic_id', clinicId)
    .eq('name', name)
    .maybeSingle()
  if (error) throw error
  return data?.id ?? null
}

function toPatient(row: PatientRow, insMap: Map<string, string>): Patient {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    code: row.code,
    name: row.name,
    cpf: row.cpf ?? undefined,
    phone: row.phone,
    insurance: row.insurance_id ? (insMap.get(row.insurance_id) ?? PARTICULAR) : PARTICULAR,
    lastVisit: isoToBrDate(row.last_visit) ?? '—',
    status: row.status,
    photo: row.photo_url ?? undefined,
    sex: row.sex ?? undefined,
    birthDate: isoToBrDate(row.birth_date),
    email: row.email ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    cep: row.cep ?? undefined,
    state: row.state ?? undefined,
    city: row.city ?? undefined,
    neighborhood: row.neighborhood ?? undefined,
    number: row.number ?? undefined,
  }
}

export async function listPatients(): Promise<Patient[]> {
  const clinicId = getCurrentClinicId()
  const [insMap, { data, error }] = await Promise.all([
    insuranceNameById(clinicId),
    supabase.from('patient').select(COLUMNS).eq('clinic_id', clinicId).order('name'),
  ])
  if (error) throw error
  return (data as PatientRow[]).map(row => toPatient(row, insMap))
}

export async function getPatient(id: string): Promise<Patient | null> {
  const clinicId = getCurrentClinicId()
  const [insMap, { data, error }] = await Promise.all([
    insuranceNameById(clinicId),
    supabase.from('patient').select(COLUMNS).eq('id', id).maybeSingle(),
  ])
  if (error) throw error
  return data ? toPatient(data as PatientRow, insMap) : null
}

/** Dados do formulário de novo paciente (id/status/última visita nascem no banco). */
export interface NewPatient {
  firstName: string
  lastName: string
  sex?: Gender
  birthDate?: string    // dd/mm/aaaa
  email?: string
  phone: string
  whatsapp?: string
  cep?: string
  state?: string
  city?: string
  neighborhood?: string
  number?: string
}

/** Cadastra um paciente novo (entra ativo, sem convênio/última visita). */
export async function addPatient(payload: NewPatient): Promise<void> {
  const { firstName, lastName, birthDate, sex, email, phone, whatsapp, cep, state, city, neighborhood, number } = payload
  const row: ClientInsert<'patient'> = {
    clinic_id: getCurrentClinicId(),
    // O nome nasce normalizado aqui — o form não se preocupa com CAPS/"de souza".
    name: capitalizeName(`${firstName} ${lastName}`),
    sex: sex ?? null,
    birth_date: brToIsoDate(birthDate),
    email: emailToDb(email),
    phone: digitsOnly(phone),      // obrigatório: 10–13 díg. (o form valida)
    whatsapp: phoneToDb(whatsapp),
    cep: cepToDb(cep),
    state: ufToDb(state),
    city: city ?? null,
    neighborhood: neighborhood ?? null,
    number: number ?? null,
  }
  const { error } = await supabase.from('patient').insert(row as Insert<'patient'>)
  if (error) throw error
}

/** Dados do formulário de edição (tudo do cadastro + convênio). */
export interface EditPatient extends NewPatient {
  insurance: string
}

/** Atualiza o cadastro do paciente (inclui o convênio, resolvido para insurance_id). */
export async function updatePatient(id: string, payload: EditPatient): Promise<void> {
  const clinicId = getCurrentClinicId()
  const insuranceId = await insuranceIdByName(clinicId, payload.insurance)
  const { firstName, lastName, birthDate, sex, email, phone, whatsapp, cep, state, city, neighborhood, number } = payload
  const { error } = await supabase
    .from('patient')
    .update({
      name: capitalizeName(`${firstName} ${lastName}`),
      sex: sex ?? null,
      birth_date: brToIsoDate(birthDate),
      email: emailToDb(email),
      phone: digitsOnly(phone),
      whatsapp: phoneToDb(whatsapp),
      insurance_id: insuranceId,
      cep: cepToDb(cep),
      state: ufToDb(state),
      city: city ?? null,
      neighborhood: neighborhood ?? null,
      number: number ?? null,
    })
    .eq('id', id)
  if (error) throw error
}

/** Troca só a foto (avatar) do paciente — ação rápida, fora do formulário. */
export async function updatePatientPhoto(id: string, photo: string | undefined): Promise<void> {
  const { error } = await supabase
    .from('patient')
    .update({ photo_url: photo ?? null })
    .eq('id', id)
  if (error) throw error
}
