import { MOCK_PATIENTS } from '@/mocks/patients'
import { capitalizeName } from '@/utils/text'
import type { Patient, Gender } from '@/types/domain'
import { CURRENT_CLINIC, nextCode } from '@/lib/tenant'

/** Dados do formulário de novo paciente (id/status/última visita nascem aqui). */
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

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('patients')… mantendo a MESMA assinatura —
// páginas e hooks não mudam.
export async function listPatients(): Promise<Patient[]> {
  return MOCK_PATIENTS
}

export async function getPatient(id: string): Promise<Patient | null> {
  return MOCK_PATIENTS.find(p => p.id === id) ?? null
}

// Contador de id do mock — no Supabase o id virá do banco.
let nextId = 100

/** Cadastra um paciente novo (entra ativo, sem visita registrada). */
export async function addPatient(payload: NewPatient): Promise<void> {
  const { firstName, lastName, ...rest } = payload
  MOCK_PATIENTS.push({
    id: `p${nextId++}`,
    clinicId: CURRENT_CLINIC,
    code: nextCode('PAC', MOCK_PATIENTS),
    // O nome nasce normalizado aqui — o formulário não precisa se preocupar
    // com CAPS LOCK nem com "maria DE souza".
    name: capitalizeName(`${firstName} ${lastName}`),
    insurance: 'Particular',
    lastVisit: '—',
    status: 'active',
    ...rest,
  })
}

/** Dados do formulário de edição (tudo do cadastro + convênio). */
export interface EditPatient extends NewPatient {
  insurance: string
}

/** Atualiza o cadastro do paciente (mock: muta o registro em memória). */
export async function updatePatient(id: string, payload: EditPatient): Promise<void> {
  const patient = MOCK_PATIENTS.find(p => p.id === id)
  if (!patient) return
  const { firstName, lastName, ...rest } = payload
  Object.assign(patient, { name: capitalizeName(`${firstName} ${lastName}`), ...rest })
}
