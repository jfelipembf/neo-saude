import { MOCK_ANAMNESIS } from '@/mocks/anamnesis'
import type { Anamnesis } from '@/types/domain'
import { CURRENT_CLINIC, type ClientPayload } from '@/lib/tenant'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('anamnesis')… mantendo a MESMA assinatura —
// páginas e hooks não mudam.
// Cópias ({ ...mock }) para o cache do TanStack Query não apontar para o objeto
// mutável (senão salvar não re-renderiza quem assina a query).

/** Ficha do paciente — `null` quando ele ainda não respondeu. */
export async function getPatientAnamnesis(patientId: string): Promise<Anamnesis | null> {
  const record = MOCK_ANAMNESIS.find(a => a.patientId === patientId)
  return record ? { ...record } : null
}

/** Campos editáveis: tudo menos a chave e a data (que é carimbada ao salvar). */
export type EditAnamnesis = Omit<ClientPayload<Anamnesis>, 'patientId' | 'updatedAt'>

/** Cria ou substitui a ficha do paciente, carimbando a data de atualização. */
export async function saveAnamnesis(patientId: string, payload: EditAnamnesis): Promise<void> {
  const today = new Date().toLocaleDateString('pt-BR')
  const index = MOCK_ANAMNESIS.findIndex(a => a.patientId === patientId)
  const record: Anamnesis = { clinicId: CURRENT_CLINIC, patientId, updatedAt: today, ...payload }
  if (index >= 0) MOCK_ANAMNESIS[index] = record
  else MOCK_ANAMNESIS.push(record)
}
