import { MOCK_LEADS } from '@/mocks/leads'
import type { Lead, StatusLead } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('leads')… mantendo a MESMA assinatura.
export async function listLeads(): Promise<Lead[]> {
  return MOCK_LEADS
}

/** Move o lead de etapa no funil (mock: muta o array em memória). */
export async function setStatusLead(id: string, status: StatusLead): Promise<void> {
  const lead = MOCK_LEADS.find(l => l.id === id)
  if (lead) lead.status = status
}
