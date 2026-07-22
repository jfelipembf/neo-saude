import { MOCK_CLINIC, MOCK_TECHNICAL_MANAGER } from '@/mocks/clinic'
import type { ClinicData, TechnicalManager } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('clinic')… mantendo a MESMA assinatura —
// páginas e hooks não mudam.
// Cópias ({ ...mock }) para o cache do TanStack Query não apontar para o objeto mutável.

export async function getClinic(): Promise<ClinicData> {
  return { ...MOCK_CLINIC }
}

export async function updateClinic(payload: ClinicData): Promise<void> {
  Object.assign(MOCK_CLINIC, payload)
}

export async function getTechnicalManager(): Promise<TechnicalManager> {
  return { ...MOCK_TECHNICAL_MANAGER }
}

export async function updateTechnicalManager(payload: TechnicalManager): Promise<void> {
  Object.assign(MOCK_TECHNICAL_MANAGER, payload)
}
