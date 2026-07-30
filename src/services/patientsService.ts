import { supabase } from '@/lib/supabase'
import { listPatientDocuments, removeDocument } from '@/services/documentsService'
import { getCurrentClinicId } from '@/lib/tenant'
import { signAssetUrl, signAssetUrls } from '@/lib/storage'
import type { ClientInsert, Insert } from '@/lib/db'
import { capitalizeName, cepToDb, phoneToDb, emailToDb, ufToDb, digitsOnly } from '@/utils/text'
import { brToIsoDate, isoToBrDate } from '@/utils/date'
import type { Patient, Gender } from '@/types/domain'

const COLUMNS =
  'id, clinic_id, code, name, common_name, cpf, phone, insurance_id, last_visit, status, photo_url, sex, birth_date, email, whatsapp, cep, state, city, neighborhood, street, number, insurance_card, insurance_card_valid_until, insurance_plan, cns, weight_kg, height_cm, bmi'

// Rótulo do "sem convênio": no banco é insurance_id NULL (não é linha de insurance).
const PARTICULAR = 'Particular'

type PatientRow = {
  id: string
  clinic_id: string
  code: string
  name: string
  common_name: string | null
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
  street: string | null
  number: string | null
  insurance_card: string | null
  insurance_card_valid_until: string | null
  insurance_plan: string | null
  cns: string | null
  weight_kg: number | string | null
  height_cm: number | string | null
  bmi: number | string | null
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

/**
 * Campo de medida do formulário → número ou null.
 *
 * Aceita vírgula decimal, que é como se digita em pt-BR: "72,5" chegaria como
 * NaN num Number() direto e o peso sumiria sem aviso.
 */
function medidaToDb(v: string | undefined): number | null {
  const t = v?.trim().replace(',', '.')
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

function toPatient(row: PatientRow, insMap: Map<string, string>): Patient {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    code: row.code,
    name: row.name,
    commonName: row.common_name ?? undefined,
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
    street: row.street ?? undefined,
    number: row.number ?? undefined,
    insuranceCard: row.insurance_card ?? undefined,
    insuranceCardValidUntil: isoToBrDate(row.insurance_card_valid_until),
    insurancePlan: row.insurance_plan ?? undefined,
    cns: row.cns ?? undefined,
    weightKg: row.weight_kg != null ? Number(row.weight_kg) : undefined,
    heightCm: row.height_cm != null ? Number(row.height_cm) : undefined,
    bmi: row.bmi != null ? Number(row.bmi) : undefined,
  }
}

export async function listPatients(): Promise<Patient[]> {
  const clinicId = getCurrentClinicId()
  const [insMap, { data, error }] = await Promise.all([
    insuranceNameById(clinicId),
    supabase.from('patient').select(COLUMNS).eq('clinic_id', clinicId).order('name'),
  ])
  if (error) throw error
  const rows = data as PatientRow[]
  // photo_url guarda o PATH do bucket privado — assina o lote de uma vez.
  const signed = await signAssetUrls(rows.map(r => r.photo_url))
  return rows.map(row => {
    const p = toPatient(row, insMap)
    p.photo = row.photo_url ? signed.get(row.photo_url) : undefined
    return p
  })
}

export async function getPatient(id: string): Promise<Patient | null> {
  const clinicId = getCurrentClinicId()
  const [insMap, { data, error }] = await Promise.all([
    insuranceNameById(clinicId),
    supabase.from('patient').select(COLUMNS).eq('id', id).maybeSingle(),
  ])
  if (error) throw error
  if (!data) return null
  const p = toPatient(data as PatientRow, insMap)
  p.photo = await signAssetUrl((data as PatientRow).photo_url)
  return p
}

/** Dados do formulário de novo paciente (id/status/última visita nascem no banco). */
export interface NewPatient {
  firstName: string
  lastName: string
  /** Como a pessoa é geralmente chamada, quando difere do nome completo. */
  commonName?: string
  sex?: Gender
  birthDate?: string    // dd/mm/aaaa
  email?: string
  phone: string
  whatsapp?: string
  cep?: string
  state?: string
  city?: string
  neighborhood?: string
  street?: string
  number?: string
}

/** Cadastra um paciente novo (entra ativo, sem convênio/última visita). */
export async function addPatient(payload: NewPatient): Promise<void> {
  // Os campos TISS (carteirinha, plano, CNS) NÃO entram aqui: o cadastro rápido
  // pede o mínimo para a pessoa existir, e carteirinha se preenche na ficha,
  // com a operadora escolhida. Ver updatePatient.
  const { firstName, lastName, commonName, birthDate, sex, email, phone, whatsapp, cep, state, city, neighborhood, street, number } = payload
  const row: ClientInsert<'patient'> = {
    clinic_id: getCurrentClinicId(),
    // O nome nasce normalizado aqui — o form não se preocupa com CAPS/"de souza".
    name: capitalizeName(`${firstName} ${lastName}`),
    common_name: commonName?.trim() ? capitalizeName(commonName) : null,
    sex: sex ?? null,
    birth_date: brToIsoDate(birthDate),
    email: emailToDb(email),
    phone: digitsOnly(phone),      // obrigatório: 10–13 díg. (o form valida)
    whatsapp: phoneToDb(whatsapp),
    cep: cepToDb(cep),
    state: ufToDb(state),
    city: city ?? null,
    neighborhood: neighborhood ?? null,
    street: street ?? null,
    number: number ?? null,
  }
  const { error } = await supabase.from('patient').insert(row as Insert<'patient'>)
  if (error) throw error
}

/** Dados do formulário de edição (tudo do cadastro + convênio). */
export interface EditPatient extends NewPatient {
  insurance: string
  // ── TISS (beneficiário) ── só na EDIÇÃO: o cadastro rápido cria a pessoa,
  // a carteirinha se preenche na ficha, junto da operadora escolhida.
  insuranceCard?: string
  insuranceCardValidUntil?: string   // dd/mm/aaaa
  insurancePlan?: string
  cns?: string
  /** Vazio no formulário → null no banco (o IMC volta a ser null junto). */
  weightKg?: string
  heightCm?: string
}

/** Atualiza o cadastro do paciente (inclui o convênio, resolvido para insurance_id). */
export async function updatePatient(id: string, payload: EditPatient): Promise<void> {
  const clinicId = getCurrentClinicId()
  const insuranceId = await insuranceIdByName(clinicId, payload.insurance)
  const {
    firstName, lastName, commonName, birthDate, sex, email, phone, whatsapp,
    cep, state, city, neighborhood, street, number,
    insuranceCard, insuranceCardValidUntil, insurancePlan, cns,
    weightKg, heightCm,
  } = payload
  const { error } = await supabase
    .from('patient')
    .update({
      name: capitalizeName(`${firstName} ${lastName}`),
      common_name: commonName?.trim() ? capitalizeName(commonName) : null,
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
      street: street ?? null,
      number: number ?? null,
      // ── TISS (beneficiário) ── Carteirinha e CNS vão sem máscara no XML.
      insurance_card: insuranceCard?.trim() || null,
      insurance_card_valid_until: brToIsoDate(insuranceCardValidUntil),
      insurance_plan: insurancePlan?.trim() || null,
      cns: cns ? digitsOnly(cns) || null : null,
      // `bmi` NÃO entra: é coluna gerada pelo banco. Mandá-la daria erro do
      // Postgres — e é justamente essa recusa que garante que o IMC exibido
      // seja sempre o do peso corrente.
      weight_kg: medidaToDb(weightKg),
      height_cm: medidaToDb(heightCm),
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


/**
 * SE O PACIENTE PODE SER APAGADO — e o que impede.
 *
 * Perguntado ANTES do diálogo de confirmação, e não descoberto depois: das 27
 * chaves estrangeiras que apontam para `patient`, 12 são RESTRICT. Um paciente
 * com consulta, recebível ou receita é recusado pelo banco com uma mensagem de
 * constraint que ninguém entende — e impedir é o certo, porque apagá-lo
 * destruiria a trilha financeira e clínica que responde por ele.
 */
export interface PatientDeletionCheck {
  pode: boolean
  eDono: boolean
  impedimentos: { oQue: string; quantos: number }[]
  /** O que será apagado JUNTO, para o diálogo dizer antes do clique. */
  emCascata: {
    documentos: number
    anamnese: number
    odontograma: number
    anotacoes: number
    medicacoes: number
    lembretes: number
  }
}

export async function checkPatientDeletion(patientId: string): Promise<PatientDeletionCheck> {
  const { data, error } = await supabase.rpc('paciente_pode_ser_excluido', { p_patient: patientId })
  if (error) throw error
  const c = data as unknown as {
    pode: boolean
    e_dono: boolean
    impedimentos: { o_que: string; quantos: number }[]
    em_cascata: PatientDeletionCheck['emCascata']
  }
  return {
    pode: Boolean(c.pode),
    eDono: Boolean(c.e_dono),
    impedimentos: (c.impedimentos ?? []).map(i => ({ oQue: i.o_que, quantos: Number(i.quantos) })),
    emCascata: c.em_cascata ?? {
      documentos: 0, anamnese: 0, odontograma: 0, anotacoes: 0, medicacoes: 0, lembretes: 0,
    },
  }
}

/**
 * Apaga o cadastro. A policy `patient_delete` só deixa o DONO — esconder o
 * botão é conforto, a parede é a RLS.
 *
 * OS ARQUIVOS SAEM PRIMEIRO, e isso não é detalhe de ordem.
 *
 * `patient_document` está em CASCADE: apagar o paciente apaga a LINHA do banco
 * e deixa o objeto no bucket para sempre — invisível, ocupando espaço, e ainda
 * contendo dado do paciente. Numa exclusão pedida por titular, isso é o
 * oposto do que foi pedido: o dado continua lá, só que fora do alcance de
 * quem poderia apagá-lo.
 *
 * Por isso os documentos são removidos um a um por `removeDocument`, que tira
 * do Storage antes de tirar do banco. Se essa parte falhar, a exclusão do
 * paciente NÃO acontece — melhor um cadastro que sobrou do que um arquivo
 * órfão que ninguém encontra.
 */
export async function removePatient(patientId: string): Promise<void> {
  const documentos = await listPatientDocuments(patientId)
  for (const doc of documentos) {
    await removeDocument(doc.id)
  }

  const { data, error } = await supabase
    .from('patient').delete().eq('id', patientId).select('id')
  if (error) throw error
  // Zero linhas = a RLS recusou. Sem esta conferência a tela diria "excluído"
  // sobre um cadastro que continua lá.
  if (!data?.length) throw new Error('Só o proprietário da clínica pode excluir um cadastro de paciente.')
}
