import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listAuditLog } from '@/services/auditService'
import type { AuditFilters } from '@/types/domain'

/**
 * Trilha de auditoria para os filtros dados (mais recentes primeiro). A
 * paginação por página é feita na tela (usePagination) sobre a janela carregada.
 */
export function useAuditLog(filters: AuditFilters) {
  return useQuery({
    queryKey: queryKeys.audit.list(filters),
    queryFn: () => listAuditLog(filters),
  })
}
