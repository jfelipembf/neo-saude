import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { AUTOMATION_CATALOG } from '@/constants/whatsappAutomations'
import type { AutomationTrigger, WhatsAppAutomation, WhatsAppConnection } from '@/types/domain'

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
const hhmm = (t: string) => t.slice(0, 5)

type ConnectionRow = {
  status: WhatsAppConnection['status']
  phone_number: string | null
  connected_at: string | null
  qr_code: string | null
  qr_expires_at: string | null
  last_error: string | null
}

export async function getWhatsAppConnection(): Promise<WhatsAppConnection> {
  const { data, error } = await supabase
    .from('whatsapp_connection')
    .select('status, phone_number, connected_at, qr_code, qr_expires_at, last_error')
    .eq('clinic_id', getCurrentClinicId())
    .maybeSingle()
  if (error) throw error
  if (!data) return { status: 'disconnected' }
  const r = data as ConnectionRow
  const qrValid = r.qr_code
    && (!r.qr_expires_at || new Date(r.qr_expires_at).getTime() > Date.now())
  return {
    status: r.status,
    phoneNumber: r.phone_number ?? undefined,
    connectedAt: r.connected_at ? fmtDateTime(r.connected_at) : undefined,
    qrCode: qrValid ? r.qr_code ?? undefined : undefined,
    qrExpiresAt: r.qr_expires_at ?? undefined,
    lastError: r.last_error ?? undefined,
  }
}

export interface WhatsAppPairingResult {
  ok: boolean
  status?: WhatsAppConnection['status']
  qrCode?: string | null
  pairingCode?: string | null
  reused?: boolean
  pending?: boolean
  error?: string
}

export type WhatsAppRecipient =
  | { type: 'patient'; id: string }
  | { type: 'supplier'; id: string }

export interface WhatsAppSendResult {
  ok: boolean
  sent: number
  pending: number
  failed: number
  results: Array<{
    type: WhatsAppRecipient['type']
    id: string
    name?: string
    sent?: boolean
    pending?: boolean
    reused?: boolean
    error?: string
  }>
  error?: string
}

async function evolutionAction(
  action: 'create' | 'connect' | 'logout',
): Promise<WhatsAppPairingResult> {
  const { data, error } = await supabase.functions.invoke<WhatsAppPairingResult>(
    'evolution-proxy',
    { body: { action, clinicId: getCurrentClinicId() } },
  )
  if (error) throw error
  if (!data?.ok) throw new Error(data?.error ?? 'evolution_request_failed')
  return data
}

/** Cria ou reaproveita a instância da clínica e devolve o QR real. */
export const connectWhatsApp = () => evolutionAction('create')

/** Encerra a sessão na Evolution, sem apagar a instância. */
export const disconnectWhatsApp = () => evolutionAction('logout')

/** Solicita um QR novo para a instância existente. */
export const refreshWhatsAppQr = () => evolutionAction('connect')

/**
 * Envia texto apenas para contatos que o backend resolve dentro da clínica.
 * Números nunca saem da IA nem do cliente como argumento.
 */
export async function sendWhatsAppMessage(
  recipients: WhatsAppRecipient[],
  message: string,
): Promise<WhatsAppSendResult> {
  const { data, error } = await supabase.functions.invoke<WhatsAppSendResult>(
    'evolution-send',
    {
      body: {
        clinicId: getCurrentClinicId(),
        recipients,
        message,
      },
    },
  )
  if (error) throw error
  if (!data?.ok) throw new Error(data?.error ?? 'whatsapp_send_failed')
  return data
}

type AutomationRow = { trigger: AutomationTrigger; status: WhatsAppAutomation['status']; message: string; send_time: string | null }

function toAutomation(row: AutomationRow): WhatsAppAutomation {
  return {
    trigger: row.trigger,
    status: row.status,
    message: row.message,
    sendTime: row.send_time ? hhmm(row.send_time) : undefined,
  }
}

export async function listAutomations(): Promise<WhatsAppAutomation[]> {
  const clinicId = getCurrentClinicId()
  const { data, error } = await supabase
    .from('whatsapp_automation')
    .select('trigger, status, message, send_time')
    .eq('clinic_id', clinicId)
  if (error) throw error

  const rows = data as AutomationRow[]
  const configured = new Set(rows.map(row => row.trigger))
  if (AUTOMATION_CATALOG.every(item => configured.has(item.trigger))) {
    return rows.map(toAutomation)
  }

  const { data: initialized, error: initializeError } = await supabase.functions.invoke<{
    ok: boolean
    automations?: AutomationRow[]
    error?: string
  }>('whatsapp-automation-save', {
    body: { action: 'bootstrap', clinicId },
  })
  if (initializeError) throw initializeError
  if (!initialized?.ok || !initialized.automations) {
    throw new Error(initialized?.error ?? 'automation_bootstrap_failed')
  }
  return initialized.automations.map(toAutomation)
}

/** Campos editáveis de uma automação (o gatilho é a chave, não muda). */
export type EditAutomation = Omit<WhatsAppAutomation, 'trigger'>

/** Cria ou atualiza a automação pelo backend autorizado da clínica. */
export async function saveAutomation(trigger: AutomationTrigger, payload: EditAutomation): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ ok: boolean; error?: string }>(
    'whatsapp-automation-save',
    {
      body: {
        clinicId: getCurrentClinicId(),
        trigger,
        status: payload.status,
        message: payload.message,
        sendTime: payload.sendTime ?? null,
      },
    },
  )
  if (error) throw error
  if (!data?.ok) throw new Error(data?.error ?? 'automation_save_failed')
}
