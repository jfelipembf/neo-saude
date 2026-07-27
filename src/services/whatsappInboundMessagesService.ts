import { supabase } from '@/lib/supabase'

/**
 * Mensagem recebida no WhatsApp da clínica (resposta do paciente a um envio
 * da Cibelly, ou contato espontâneo) — ver public.whatsapp_inbound_message.
 */
export interface WhatsAppInboundMessage {
  id: string
  patientId: string | null
  senderName: string | null
  senderPhone: string
  body: string
  createdAt: string
}

type Row = {
  id: string
  patient_id: string | null
  sender_name: string | null
  sender_phone: string
  body: string
  created_at: string
}

function toMessage(r: Row): WhatsAppInboundMessage {
  return {
    id: r.id,
    patientId: r.patient_id,
    senderName: r.sender_name,
    senderPhone: r.sender_phone,
    body: r.body,
    createdAt: r.created_at,
  }
}

/** Só as ainda não descartadas — RLS já escopa por clínica. */
export async function listUndismissedWhatsAppMessages(): Promise<WhatsAppInboundMessage[]> {
  const { data, error } = await supabase
    .from('whatsapp_inbound_message')
    .select('id, patient_id, sender_name, sender_phone, body, created_at')
    .eq('dismissed', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as Row[]).map(toMessage)
}

/** Marca como vista — some da notificação, mas a linha continua no histórico. */
export async function dismissWhatsAppMessage(id: string): Promise<void> {
  const { error } = await supabase
    .from('whatsapp_inbound_message')
    .update({ dismissed: true, dismissed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
