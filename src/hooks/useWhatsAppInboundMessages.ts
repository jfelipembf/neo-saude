import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/context/SessionProvider'
import { queryKeys } from '@/lib/queryKeys'
import {
  dismissWhatsAppMessage, listUndismissedWhatsAppMessages,
} from '@/services/whatsappInboundMessagesService'

/**
 * Mensagens de paciente ainda não vistas na tela — a notificação persistente
 * some quando `dismiss` é chamado, nunca sozinha (ver WhatsAppReplyNotifications).
 *
 * Carrega a lista uma vez e depois só ouve o Realtime (INSERT de mensagem
 * nova, UPDATE de descarte — inclusive descarte feito por outra aba/pessoa):
 * sem isso, a única forma de saber que o paciente respondeu seria o dentista
 * dar F5 de tempos em tempos.
 */
export function useWhatsAppInboundMessages() {
  const { info } = useSession()
  const clinicId = info?.clinicId
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.whatsapp.inboundMessages,
    queryFn: listUndismissedWhatsAppMessages,
    enabled: Boolean(clinicId),
  })

  useEffect(() => {
    if (!clinicId) return

    const channel = supabase
      .channel(`whatsapp_inbound_message:${clinicId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_inbound_message',
          filter: `clinic_id=eq.${clinicId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: queryKeys.whatsapp.inboundMessages }),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clinicId, queryClient])

  return query
}

export function useDismissWhatsAppInboundMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: dismissWhatsAppMessage,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.whatsapp.inboundMessages }),
  })
}
