import { MOCK_CONSULTORIO, MOCK_RESPONSAVEL } from '@/mocks/consultorio'
import type { DadosConsultorio, ResponsavelTecnico } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('consultorio')… mantendo a MESMA assinatura —
// páginas e hooks não mudam.
// Cópias ({ ...mock }) para o cache do TanStack Query não apontar para o objeto mutável.

export async function getConsultorio(): Promise<DadosConsultorio> {
  return { ...MOCK_CONSULTORIO }
}

export async function updateConsultorio(dados: DadosConsultorio): Promise<void> {
  Object.assign(MOCK_CONSULTORIO, dados)
}

export async function getResponsavel(): Promise<ResponsavelTecnico> {
  return { ...MOCK_RESPONSAVEL }
}

export async function updateResponsavel(dados: ResponsavelTecnico): Promise<void> {
  Object.assign(MOCK_RESPONSAVEL, dados)
}
