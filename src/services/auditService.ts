import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import type { AuditEntry, AuditFilters } from '@/types/domain'

/** Janela máxima carregada por vez — a paginação da tela é sobre esta janela.
 *  (A RPC limita internamente; acima disso, refinar os filtros por período.) */
export const AUDIT_FETCH_LIMIT = 200

// Linha crua devolvida pela RPC list_audit_log (snake_case).
type AuditRow = {
  id: string
  created_at: string
  actor_id: string | null
  actor_name: string | null
  action: AuditEntry['action']
  table_name: string
  record_id: string
  record_label: string | null
  changed_fields: string[] | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
}

function toAuditEntry(r: AuditRow): AuditEntry {
  return {
    id: r.id,
    createdAt: r.created_at,
    actorId: r.actor_id ?? undefined,
    actorName: r.actor_name ?? undefined,
    action: r.action,
    tableName: r.table_name,
    recordId: r.record_id,
    recordLabel: r.record_label ?? undefined,
    changedFields: r.changed_fields ?? [],
    oldData: r.old_data ?? undefined,
    newData: r.new_data ?? undefined,
  }
}

/**
 * Trilha de auditoria da clínica corrente — RPC `list_audit_log` (admin-only via
 * RLS de audit_log). Traz os mais recentes (até AUDIT_FETCH_LIMIT) para os
 * filtros dados; a paginação por página é feita na tela sobre essa janela.
 */
export async function listAuditLog(filters: AuditFilters): Promise<AuditEntry[]> {
  const { data, error } = await supabase.rpc('list_audit_log', {
    p_clinic: getCurrentClinicId(),
    p_table: filters.table || undefined,
    p_action: filters.action || undefined,
    p_actor: filters.actorId || undefined,
    p_from: filters.from || undefined,
    // `to` é uma data (dia); inclui o dia inteiro somando o fim do dia.
    p_to: filters.to ? `${filters.to}T23:59:59.999` : undefined,
    p_search: filters.search?.trim() || undefined,
    p_before_at: undefined,
    p_before_id: undefined,
    p_limit: AUDIT_FETCH_LIMIT,
  })
  if (error) throw error
  return ((data ?? []) as AuditRow[]).map(toAuditEntry)
}
