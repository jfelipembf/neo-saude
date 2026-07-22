import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { MOCK_TECHNICAL_MANAGER } from '@/mocks/clinic'
import type { ClinicData, TechnicalManager } from '@/types/domain'

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
  return toClinicData(data as ClinicRow)
}

/** Atualiza o cadastro da clínica. Não toca em plan_key/status (fora do form). */
export async function updateClinic(payload: ClinicData): Promise<void> {
  const { error } = await supabase
    .from('clinic')
    .update({
      name: payload.name,
      cnpj: payload.cnpj,
      email: payload.email,
      phone: payload.phone,
      logo_url: payload.photo ?? null,
      specialty: payload.specialty,
      cep: payload.cep,
      state: payload.state,
      city: payload.city,
      neighborhood: payload.neighborhood,
      street: payload.street,
      number: payload.number,
    })
    .eq('id', getCurrentClinicId())
  if (error) throw error
}

// TODO(neoSaude): não há tabela para o "responsável técnico" (TechnicalManager)
// no schema atual. Decidir o mapeamento com o produto — provavelmente um
// `professional` marcado como RT, ou colunas novas na `clinic`. Até lá, segue
// em modo mock para não quebrar a aba Administrativo → Inicial.
export async function getTechnicalManager(): Promise<TechnicalManager> {
  return { ...MOCK_TECHNICAL_MANAGER }
}

export async function updateTechnicalManager(payload: TechnicalManager): Promise<void> {
  Object.assign(MOCK_TECHNICAL_MANAGER, payload)
}
