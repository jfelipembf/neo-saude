import { MOCK_PACIENTES } from '@/mocks/pacientes'
import { capitalizarNome } from '@/utils/text'
import type { Patient, Gender } from '@/types/domain'

/** Dados do formulário de novo paciente (id/status/última visita nascem aqui). */
export interface NewPatient {
  nome: string
  sobrenome: string
  sexo?: Gender
  nascimento?: string    // dd/mm/aaaa
  email?: string
  telefone: string
  whatsapp?: string
  cep?: string
  estado?: string
  cidade?: string
  bairro?: string
  numero?: string
}

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('pacientes')… mantendo a MESMA assinatura —
// páginas e hooks não mudam.
export async function listPacientes(): Promise<Patient[]> {
  return MOCK_PACIENTES
}

export async function getPaciente(id: string): Promise<Patient | null> {
  return MOCK_PACIENTES.find(p => p.id === id) ?? null
}

// Contador de id do mock — no Supabase o id virá do banco.
let proximoId = 100

/** Cadastra um paciente novo (entra ativo, sem visita registrada). */
export async function addPaciente(dados: NewPatient): Promise<void> {
  const { nome, sobrenome, ...resto } = dados
  MOCK_PACIENTES.push({
    id: `p${proximoId++}`,
    // O nome nasce normalizado aqui — o formulário não precisa se preocupar
    // com CAPS LOCK nem com "maria DE souza".
    nome: capitalizarNome(`${nome} ${sobrenome}`),
    convenio: 'Particular',
    ultimaVisita: '—',
    status: 'ativo',
    ...resto,
  })
}

/** Dados do formulário de edição (tudo do cadastro + convênio). */
export interface EditPatient extends NewPatient {
  convenio: string
}

/** Atualiza o cadastro do paciente (mock: muta o registro em memória). */
export async function updatePaciente(id: string, dados: EditPatient): Promise<void> {
  const paciente = MOCK_PACIENTES.find(p => p.id === id)
  if (!paciente) return
  const { nome, sobrenome, ...resto } = dados
  Object.assign(paciente, { nome: capitalizarNome(`${nome} ${sobrenome}`), ...resto })
}
