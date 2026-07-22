import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import type { AutomationTrigger, WhatsAppAutomation, WhatsAppConnection } from '@/types/domain'

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
const hhmm = (t: string) => t.slice(0, 5)

type ConnectionRow = { status: WhatsAppConnection['status']; phone_number: string | null; connected_at: string | null; qr_code: string | null }

export async function getWhatsAppConnection(): Promise<WhatsAppConnection> {
  const { data, error } = await supabase
    .from('whatsapp_connection')
    .select('status, phone_number, connected_at, qr_code')
    .eq('clinic_id', getCurrentClinicId())
    .maybeSingle()
  if (error) throw error
  if (!data) return { status: 'disconnected' }
  const r = data as ConnectionRow
  return {
    status: r.status,
    phoneNumber: r.phone_number ?? undefined,
    connectedAt: r.connected_at ? fmtDateTime(r.connected_at) : undefined,
    qrCode: r.qr_code ?? undefined,
  }
}

// Pareamento é ato do PROVEDOR: a tabela whatsapp_connection só é escrita pelo
// webhook/edge function do provedor de sessão (service_role), nunca pelo cliente.
// Estas funções DISPARAM as Edge Functions correspondentes; a UI acompanha o
// resultado por getWhatsAppConnection (o provedor atualiza a linha).
//
// FALTA DO USUÁRIO: as Edge Functions (whatsapp-connect / whatsapp-disconnect /
// whatsapp-refresh-qr) e as credenciais do provedor (Cloud API ou serviço de
// sessão) ainda precisam ser criadas/configuradas — ver supabase/functions/.
export async function connectWhatsApp(): Promise<void> {
  const { error } = await supabase.functions.invoke('whatsapp-connect', { body: { clinicId: getCurrentClinicId() } })
  if (error) throw error
}
export async function disconnectWhatsApp(): Promise<void> {
  const { error } = await supabase.functions.invoke('whatsapp-disconnect', { body: { clinicId: getCurrentClinicId() } })
  if (error) throw error
}
export async function refreshWhatsAppQr(): Promise<void> {
  const { error } = await supabase.functions.invoke('whatsapp-refresh-qr', { body: { clinicId: getCurrentClinicId() } })
  if (error) throw error
}

type AutomationRow = { trigger: AutomationTrigger; status: WhatsAppAutomation['status']; message: string; send_time: string | null }

export async function listAutomations(): Promise<WhatsAppAutomation[]> {
  const { data, error } = await supabase
    .from('whatsapp_automation')
    .select('trigger, status, message, send_time')
    .eq('clinic_id', getCurrentClinicId())
  if (error) throw error
  return (data as AutomationRow[]).map(r => ({
    trigger: r.trigger,
    status: r.status,
    message: r.message,
    sendTime: r.send_time ? hhmm(r.send_time) : undefined,
  }))
}

/** Campos editáveis de uma automação (o gatilho é a chave, não muda). */
export type EditAutomation = Omit<WhatsAppAutomation, 'trigger'>

/** Cria ou atualiza a automação do gatilho (a clínica escreve o texto que sai). */
export async function saveAutomation(trigger: AutomationTrigger, payload: EditAutomation): Promise<void> {
  const clinicId = getCurrentClinicId()
  const row = { status: payload.status, message: payload.message, send_time: payload.sendTime ?? null }

  const { data: existing, error: findError } = await supabase
    .from('whatsapp_automation')
    .select('id')
    .eq('clinic_id', clinicId)
    .eq('trigger', trigger)
    .maybeSingle()
  if (findError) throw findError

  if (existing) {
    const { error } = await supabase.from('whatsapp_automation').update(row).eq('id', existing.id)
    if (error) throw error
    return
  }
  const { error } = await supabase.from('whatsapp_automation').insert({ clinic_id: clinicId, trigger, ...row })
  if (error) throw error
}
