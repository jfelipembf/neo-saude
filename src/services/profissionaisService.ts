import { MOCK_PROFISSIONAIS } from '@/mocks/profissionais'
import { capitalizarNome } from '@/utils/text'
import type { Professional } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('profissionais')… mantendo a MESMA assinatura.
export async function listProfissionais(): Promise<Professional[]> {
  return MOCK_PROFISSIONAIS
}

export async function getProfissional(id: string): Promise<Professional | undefined> {
  return MOCK_PROFISSIONAIS.find(p => p.id === id)
}

/** Campos editáveis no perfil do profissional (dados pessoais E currículo —
 *  cada formulário envia só a sua parte; `undefined` não sobrescreve nada). */
export interface EditProfessional {
  nome?: string
  especialidade?: string
  registro?: string
  descricao?: string
  sexo?: Professional['sexo']
  nascimento?: string
  email?: string
  telefone?: string
  whatsapp?: string
  cep?: string
  estado?: string
  cidade?: string
  bairro?: string
  numero?: string
  status?: Professional['status']
  especializacoes?: string[]
  formacao?: Professional['formacao']
  experiencias?: Professional['experiencias']
  cursos?: string[]
  idiomas?: string[]
}

export async function updateProfissional(id: string, dados: EditProfessional): Promise<void> {
  const profissional = MOCK_PROFISSIONAIS.find(p => p.id === id)
  if (!profissional) return
  // Só os campos realmente enviados — o form de dados pessoais não apaga o
  // currículo (e vice-versa).
  const definidos = Object.fromEntries(Object.entries(dados).filter(([, v]) => v !== undefined))
  // O nome nasce normalizado aqui, independente de como foi digitado
  // ("dra. camila duarte" → "Dra. Camila Duarte").
  if (typeof definidos.nome === 'string') definidos.nome = capitalizarNome(definidos.nome)
  Object.assign(profissional, definidos)
}
