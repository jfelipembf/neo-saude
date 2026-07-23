import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { signAssetUrl } from '@/lib/storage'
import { cepToDb, cnpjToDb, emailToDb, phoneToDb, ufToDb } from '@/utils/text'
import { PROFESSIONAL_CORE_COLUMNS, toProfessionalCore } from '@/services/professionalsService'
import type { ProfessionalRow } from '@/services/professionalsService'
import type { ClinicData, Professional } from '@/types/domain'

// Colunas lidas/escritas na tabela `clinic`. `logo_url` ↔ domínio `photo`.
const CLINIC_COLUMNS = 'id, specialty, logo_url, name, cnpj, email, phone, cep, state, city, neighborhood, street, number'

type ClinicRow = {
  id: string
  specialty: ClinicData['specialty']
  logo_url: string | null
  name: string
  cnpj: string | null
  email: string | null
  phone: string | null
  cep: string | null
  state: string | null
  city: string | null
  neighborhood: string | null
  street: string | null
  number: string | null
}

function toClinicData(row: ClinicRow): ClinicData {
  return {
    id: row.id,
    specialty: row.specialty,
    photo: row.logo_url ?? undefined,
    name: row.name,
    cnpj: row.cnpj ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    cep: row.cep ?? '',
    state: row.state ?? '',
    city: row.city ?? '',
    neighborhood: row.neighborhood ?? '',
    street: row.street ?? '',
    number: row.number ?? '',
  }
}

/** Dados do consultório da clínica corrente (Administrativo → Inicial). */
export async function getClinic(): Promise<ClinicData> {
  const { data, error } = await supabase
    .from('clinic')
    .select(CLINIC_COLUMNS)
    .eq('id', getCurrentClinicId())
    .single()
  if (error) throw error
  const clinic = toClinicData(data as ClinicRow)
  // logo_url agora guarda o PATH do bucket privado — assina para exibir.
  clinic.photo = await signAssetUrl(clinic.photo)
  return clinic
}

/** Atualiza o cadastro da clínica. Não toca em plan_key/status (fora do form). */
export async function updateClinic(payload: ClinicData): Promise<void> {
  const { error } = await supabase
    .from('clinic')
    .update({
      name: payload.name,
      cnpj: cnpjToDb(payload.cnpj),
      email: emailToDb(payload.email),
      phone: phoneToDb(payload.phone),
      logo_url: payload.photo ?? null,
      // specialty NÃO é enviado: o ramo é definido pelo dono do SaaS (form
      // read-only) e o grant de UPDATE de `clinic` nem inclui a coluna.
      cep: cepToDb(payload.cep),
      state: ufToDb(payload.state),
      city: payload.city,
      neighborhood: payload.neighborhood,
      street: payload.street,
      number: payload.number,
    })
    .eq('id', getCurrentClinicId())
  if (error) throw error
}

// ── Responsável técnico ──────────────────────────────────────────────────────
// O RT NÃO é um cadastro à parte: pela norma do conselho ele é inscrito no CRO,
// logo já é uma linha de `professional` — marcada com `is_technical_manager`.
// Um índice único parcial garante um RT por clínica, e um CHECK exige que ele
// esteja ativo. Editar os dados do RT = editar o profissional (updateProfessional).

/** O profissional que responde tecnicamente pela clínica, ou `null` quando
 *  ainda não foi designado (estado de uma clínica recém-criada). */
export async function getTechnicalManager(): Promise<Professional | null> {
  const { data, error } = await supabase
    .from('professional')
    .select(PROFESSIONAL_CORE_COLUMNS)
    .eq('clinic_id', getCurrentClinicId())
    .eq('is_technical_manager', true)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const rt = toProfessionalCore(data as ProfessionalRow)
  rt.photo = await signAssetUrl((data as ProfessionalRow).photo_url)
  return rt
}

/** Promove um profissional a RT. A RPC desmarca o anterior e marca o novo na
 *  mesma transação — sem ela o índice único barraria a troca. */
export async function setTechnicalManager(professionalId: string): Promise<void> {
  const { error } = await supabase.rpc('set_technical_manager', { p_professional: professionalId })
  if (error) throw error
}
