import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { toShortDate } from '@/utils/date'
import type { Lead, LeadStatus } from '@/types/domain'

type LeadRow = {
  id: string
  clinic_id: string
  name: string
  phone: string
  source: string
  interest: string
  status: LeadStatus
  created_at: string
}

export async function listLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('lead')
    .select('id, clinic_id, name, phone, source, interest, status, created_at')
    .eq('clinic_id', getCurrentClinicId())
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as LeadRow[]).map(row => ({
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    phone: row.phone,
    source: row.source,
    interest: row.interest,
    createdAt: toShortDate(new Date(row.created_at)),
    status: row.status,
  }))
}

/** Move o lead de etapa no funil. */
export async function setStatusLead(id: string, status: LeadStatus): Promise<void> {
  const { error } = await supabase.from('lead').update({ status }).eq('id', id)
  if (error) throw error
}
