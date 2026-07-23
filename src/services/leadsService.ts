import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import type { ClientInsert, Insert } from '@/lib/db'
import { capitalizeName, digitsOnly, emailToDb } from '@/utils/text'
import { toShortDate } from '@/utils/date'
import type { Lead, LeadHistoryEntry, LeadStatus } from '@/types/domain'

/** Origem gravada para contato cadastrado à mão (botão "Novo contato" do
 *  Kanban) — diferencia de leads que chegam por Instagram/Google/Indicação. */
const MANUAL_SOURCE = 'Manual'

type LeadRow = {
  id: string
  clinic_id: string
  name: string
  email: string | null
  phone: string
  source: string
  interest: string
  notes: string | null
  status: LeadStatus
  created_at: string
  patient_id: string | null
}

export async function listLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('lead')
    .select('id, clinic_id, name, email, phone, source, interest, notes, status, created_at, patient_id')
    .eq('clinic_id', getCurrentClinicId())
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as LeadRow[]).map(row => ({
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone,
    source: row.source,
    interest: row.interest,
    notes: row.notes ?? undefined,
    createdAt: toShortDate(new Date(row.created_at)),
    status: row.status,
    patientId: row.patient_id ?? undefined,
  }))
}

/**
 * Converte o lead em paciente (RPC transacional): cria o paciente a partir do
 * lead ou vincula ao existente de MESMO telefone, marca o lead como convertido
 * e devolve o id do paciente e se foi criado (true) ou vinculado (false).
 */
export async function convertLeadToPatient(id: string): Promise<{ patientId: string; created: boolean }> {
  const { data, error } = await supabase.rpc('convert_lead_to_patient', { p_lead: id })
  if (error) throw error
  const r = data as { patient_id: string; created: boolean }
  return { patientId: r.patient_id, created: r.created }
}

/** Move o lead de etapa no funil (arrastar entre colunas do Kanban) — NUNCA
 *  toca em `notes`, mesmo que o painel do lead tenha um rascunho não salvo. */
export async function setStatusLead(id: string, status: LeadStatus): Promise<void> {
  const { error } = await supabase.from('lead').update({ status }).eq('id', id)
  if (error) throw error
}

/** Salva do painel lateral: status ("o que aconteceu") + observação, juntos. */
export async function updateLeadDetails(
  id: string,
  payload: { status: LeadStatus; notes: string | null },
): Promise<void> {
  const { error } = await supabase.from('lead').update(payload).eq('id', id)
  if (error) throw error
}

type LeadHistoryRow = {
  id: string
  created_at: string
  actor_name: string | null
  action: LeadHistoryEntry['action']
  changed_fields: string[] | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
}

/** Histórico de UM lead (RPC list_lead_history) — mudanças de status e
 *  observação, com data e quem fez. Alimenta o painel lateral. */
export async function listLeadHistory(leadId: string): Promise<LeadHistoryEntry[]> {
  const { data, error } = await supabase.rpc('list_lead_history', { p_lead: leadId })
  if (error) throw error
  return (data as LeadHistoryRow[]).map(row => ({
    id: row.id,
    createdAt: row.created_at,
    actorName: row.actor_name ?? undefined,
    action: row.action,
    changedFields: row.changed_fields ?? [],
    oldData: row.old_data ?? undefined,
    newData: row.new_data ?? undefined,
  }))
}

/** Dados do formulário de novo contato (botão "Novo contato" do Kanban). */
export interface NewLead {
  firstName: string
  lastName: string
  email?: string
  phone: string
  interest: string
}

/** Cadastra um contato manual — entra na primeira etapa do funil ('new'). */
export async function addLead(payload: NewLead): Promise<void> {
  const { firstName, lastName, email, phone, interest } = payload
  const row: ClientInsert<'lead'> = {
    clinic_id: getCurrentClinicId(),
    // Mesma normalização do cadastro de paciente — o form não se preocupa com CAPS.
    name: capitalizeName(`${firstName} ${lastName}`),
    email: emailToDb(email),
    phone: digitsOnly(phone),
    source: MANUAL_SOURCE,
    interest,
    // status → default 'new'; created_at é o que mede o tempo de resposta do
    // funil (ver comment da coluna), então nasce do servidor, não do form.
  }
  const { error } = await supabase.from('lead').insert(row as Insert<'lead'>)
  if (error) throw error
}
