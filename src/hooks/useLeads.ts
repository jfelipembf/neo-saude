import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addLead, listLeadHistory, listLeads, setStatusLead, updateLeadDetails, convertLeadToPatient } from '@/services/leadsService'
import type { LeadStatus } from '@/types/domain'

export function useLeads() {
  return useQuery({ queryKey: queryKeys.leads.all, queryFn: listLeads })
}

/** Move um lead de etapa no funil (arrastar entre colunas do kanban) e atualiza o quadro. */
export function useSetLeadStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) => setStatusLead(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.leads.all }),
  })
}

/** Converte um lead em paciente (cria ou vincula) e refaz Leads + Pacientes. */
export function useConvertLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => convertLeadToPatient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all })
    },
  })
}

/** Cadastra um contato manual (botão "Novo contato" do Kanban). */
export function useCreateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addLead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.leads.all }),
  })
}

/** Histórico de um lead — alimenta o painel lateral aberto ao clicar no card. */
export function useLeadHistory(leadId: string) {
  return useQuery({ queryKey: queryKeys.leads.history(leadId), queryFn: () => listLeadHistory(leadId) })
}

/** Salva do painel lateral: status ("o que aconteceu") + observação, juntos.
 *  Refaz o quadro (a coluna pode mudar) e o histórico deste lead (nova linha). */
export function useUpdateLeadDetails() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; status: LeadStatus; notes: string | null }) =>
      updateLeadDetails(vars.id, { status: vars.status, notes: vars.notes }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.history(vars.id) })
    },
  })
}
