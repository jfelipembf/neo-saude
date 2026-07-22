import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listLeads, setStatusLead } from '@/services/leadsService'
import type { LeadStatus } from '@/types/domain'

export function useLeads() {
  return useQuery({ queryKey: queryKeys.leads.all, queryFn: listLeads })
}

/** Move um lead de etapa no funil (arrastar/setas do kanban) e atualiza o quadro. */
export function useSetLeadStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) => setStatusLead(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.leads.all }),
  })
}
