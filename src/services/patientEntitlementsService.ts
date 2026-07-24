import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { isoToBrDate } from '@/utils/date'
import type { PatientServiceEntitlement } from '@/types/domain'

type EntitlementRow = {
  id: string
  service_id: string
  total_sessions: number
  used_sessions: number
  scheduled_sessions: number
  purchased_at: string
  expires_at: string | null
}

function toEntitlement(row: EntitlementRow, serviceName: string | undefined): PatientServiceEntitlement {
  return {
    id: row.id,
    serviceId: row.service_id,
    serviceName: serviceName ?? '—',
    totalSessions: row.total_sessions,
    usedSessions: row.used_sessions,
    scheduledSessions: row.scheduled_sessions,
    remaining: row.total_sessions - row.used_sessions - row.scheduled_sessions,
    purchasedAt: isoToBrDate(row.purchased_at) ?? row.purchased_at,
    expiresAt: isoToBrDate(row.expires_at),
  }
}

/** Pacotes de sessão comprados por UM paciente — mais recente primeiro. Inclui
 *  os já esgotados/vencidos (histórico); quem precisa só dos disponíveis
 *  filtra por `remaining > 0` (e `expiresAt` contra a data de hoje). */
export async function listPatientEntitlements(patientId: string): Promise<PatientServiceEntitlement[]> {
  const { data, error } = await supabase
    .from('patient_service_entitlement')
    .select('id, service_id, total_sessions, used_sessions, scheduled_sessions, purchased_at, expires_at')
    .eq('patient_id', patientId)
    .eq('clinic_id', getCurrentClinicId())
    .order('purchased_at', { ascending: false })
  if (error) throw error
  const rows = data as EntitlementRow[]
  if (rows.length === 0) return []

  const { data: services, error: servicesError } = await supabase
    .from('service')
    .select('id, name')
    .in('id', [...new Set(rows.map(r => r.service_id))])
  if (servicesError) throw servicesError
  const nameById = new Map((services ?? []).map(s => [s.id, s.name as string]))

  return rows.map(row => toEntitlement(row, nameById.get(row.service_id)))
}
