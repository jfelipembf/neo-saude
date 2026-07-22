import { MOCK_PROFESSIONALS } from '@/mocks/professionals'
import { capitalizeName } from '@/utils/text'
import type { Professional } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('professionals')… mantendo a MESMA assinatura.
export async function listProfessionals(): Promise<Professional[]> {
  return MOCK_PROFESSIONALS
}

export async function getProfessional(id: string): Promise<Professional | undefined> {
  return MOCK_PROFESSIONALS.find(p => p.id === id)
}

/** Campos editáveis no perfil do profissional (dados pessoais E currículo —
 *  cada formulário envia só a sua parte; `undefined` não sobrescreve nada). */
export interface EditProfessional {
  name?: string
  specialty?: string
  license?: string
  description?: string
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
  education?: Professional['education']
  experiences?: Professional['experiences']
  courses?: string[]
  languages?: string[]
}

export async function updateProfessional(id: string, payload: EditProfessional): Promise<void> {
  const professional = MOCK_PROFESSIONALS.find(p => p.id === id)
  if (!professional) return
  // Só os campos realmente enviados — o form de dados pessoais não apaga o
  // currículo (e vice-versa).
  const defined = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined))
  // O nome nasce normalizado aqui, independente de como foi digitado
  // ("dra. camila duarte" → "Dra. Camila Duarte").
  if (typeof defined.name === 'string') defined.name = capitalizeName(defined.name)
  Object.assign(professional, defined)
}
