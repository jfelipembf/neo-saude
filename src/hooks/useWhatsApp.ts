import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  connectWhatsApp, disconnectWhatsApp, getWhatsAppConnection, listAutomations,
  refreshWhatsAppQr, saveAutomation, sendWhatsAppTestMessage,
} from '@/services/whatsappService'
import type { EditAutomation } from '@/services/whatsappService'
import type { AutomationTrigger } from '@/types/domain'

export function useWhatsAppConnection(pollingSince: number | null = null) {
  return useQuery({
    queryKey: queryKeys.whatsapp.connection,
    queryFn: getWhatsAppConnection,
    // Consulta somente o Supabase; nenhuma repetição chega à Evolution/Meta.
    refetchInterval: query => {
      if (!pollingSince || query.state.data?.status === 'connected') return false
      return Date.now() - pollingSince <= 2 * 60_000 ? 3_000 : false
    },
  })
}

/** Parear, encerrar a sessão e renovar o QR — todas recarregam a conexão. */
export function useConnectWhatsApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: connectWhatsApp,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.whatsapp.connection }),
  })
}

export function useDisconnectWhatsApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: disconnectWhatsApp,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.whatsapp.connection }),
  })
}

export function useRefreshWhatsAppQr() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: refreshWhatsAppQr,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.whatsapp.connection }),
  })
}

/** Envio de teste para um número digitado — só a tela de Configurações usa. */
export function useSendWhatsAppTest() {
  return useMutation({ mutationFn: (phone: string) => sendWhatsAppTestMessage(phone) })
}

export function useAutomations() {
  return useQuery({ queryKey: queryKeys.whatsapp.automations, queryFn: listAutomations })
}

/** Salva uma automação (liga/desliga, texto, horário) e recarrega a lista. */
export function useSaveAutomation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ trigger, payload }: { trigger: AutomationTrigger; payload: EditAutomation }) =>
      saveAutomation(trigger, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.whatsapp.automations }),
  })
}
