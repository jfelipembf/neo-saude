import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listLeads, setStatusLead } from '@/services/leadsService'
import type { StatusLead } from '@/types/domain'

export function useLeads() {
  return useQuery({ queryKey: queryKeys.leads.all, queryFn: listLeads })
}

/** Move um lead de etapa no funil (arrastar/setas do kanban) e atualiza o quadro. */
export function useSetStatusLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusLead }) => setStatusLead(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.leads.all }),
  })
}
