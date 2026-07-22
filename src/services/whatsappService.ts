import {
  MOCK_WHATSAPP_AUTOMATIONS, MOCK_WHATSAPP_CONNECTION, MOCK_WHATSAPP_NUMBER,
} from '@/mocks/whatsapp'
import type { AutomationTrigger, WhatsAppAutomation, WhatsAppConnection } from '@/types/domain'

// MODO MOCK: a conexão é simulada — nenhuma sessão real do WhatsApp é aberta.
// Quando existir o gateway (Cloud API ou serviço de sessão), trocar SÓ o corpo
// destas funções, mantendo a MESMA assinatura.
// Cópias ({ ...mock }) para o cache do TanStack Query não apontar para o objeto
// mutável (senão salvar não re-renderiza quem assina a query).

export async function getWhatsAppConnection(): Promise<WhatsAppConnection> {
  return { ...MOCK_WHATSAPP_CONNECTION }
}

/** Simula o pareamento pelo QR: o aparelho "leu" e a sessão subiu. */
export async function connectWhatsApp(): Promise<void> {
  MOCK_WHATSAPP_CONNECTION.status = 'connected'
  MOCK_WHATSAPP_CONNECTION.phoneNumber = MOCK_WHATSAPP_NUMBER
  MOCK_WHATSAPP_CONNECTION.connectedAt = new Date().toLocaleString('pt-BR', {
    dateStyle: 'short', timeStyle: 'short',
  })
}

/** Encerra a sessão e gera um QR novo para o próximo pareamento. */
export async function disconnectWhatsApp(): Promise<void> {
  MOCK_WHATSAPP_CONNECTION.status = 'disconnected'
  MOCK_WHATSAPP_CONNECTION.phoneNumber = undefined
  MOCK_WHATSAPP_CONNECTION.connectedAt = undefined
  MOCK_WHATSAPP_CONNECTION.qrCode = `neo-saude-pareamento-${Date.now()}`
}

/** Gera um QR novo sem derrubar a sessão (o anterior expirou). */
export async function refreshWhatsAppQr(): Promise<void> {
  MOCK_WHATSAPP_CONNECTION.qrCode = `neo-saude-pareamento-${Date.now()}`
}

export async function listAutomations(): Promise<WhatsAppAutomation[]> {
  return MOCK_WHATSAPP_AUTOMATIONS.map(a => ({ ...a }))
}

/** Campos editáveis de uma automação (o gatilho é a chave, não muda). */
export type EditAutomation = Omit<WhatsAppAutomation, 'trigger'>

export async function saveAutomation(
  trigger: AutomationTrigger,
  payload: EditAutomation,
): Promise<void> {
  const index = MOCK_WHATSAPP_AUTOMATIONS.findIndex(a => a.trigger === trigger)
  if (index >= 0) MOCK_WHATSAPP_AUTOMATIONS[index] = { trigger, ...payload }
}
