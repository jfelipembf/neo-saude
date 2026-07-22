import {
  MOCK_WHATSAPP_AUTOMACOES, MOCK_WHATSAPP_CONEXAO, MOCK_WHATSAPP_NUMERO,
} from '@/mocks/whatsapp'
import type { AutomationTrigger, WhatsAppAutomation, WhatsAppConnection } from '@/types/domain'

// MODO MOCK: a conexão é simulada — nenhuma sessão real do WhatsApp é aberta.
// Quando existir o gateway (Cloud API ou serviço de sessão), trocar SÓ o corpo
// destas funções, mantendo a MESMA assinatura.
// Cópias ({ ...mock }) para o cache do TanStack Query não apontar para o objeto
// mutável (senão salvar não re-renderiza quem assina a query).

export async function getConexaoWhatsApp(): Promise<WhatsAppConnection> {
  return { ...MOCK_WHATSAPP_CONEXAO }
}

/** Simula o pareamento pelo QR: o aparelho "leu" e a sessão subiu. */
export async function conectarWhatsApp(): Promise<void> {
  MOCK_WHATSAPP_CONEXAO.status = 'conectado'
  MOCK_WHATSAPP_CONEXAO.numero = MOCK_WHATSAPP_NUMERO
  MOCK_WHATSAPP_CONEXAO.conectadoEm = new Date().toLocaleString('pt-BR', {
    dateStyle: 'short', timeStyle: 'short',
  })
}

/** Encerra a sessão e gera um QR novo para o próximo pareamento. */
export async function desconectarWhatsApp(): Promise<void> {
  MOCK_WHATSAPP_CONEXAO.status = 'desconectado'
  MOCK_WHATSAPP_CONEXAO.numero = undefined
  MOCK_WHATSAPP_CONEXAO.conectadoEm = undefined
  MOCK_WHATSAPP_CONEXAO.qrCode = `neo-saude-pareamento-${Date.now()}`
}

/** Gera um QR novo sem derrubar a sessão (o anterior expirou). */
export async function renovarQrWhatsApp(): Promise<void> {
  MOCK_WHATSAPP_CONEXAO.qrCode = `neo-saude-pareamento-${Date.now()}`
}

export async function listAutomacoes(): Promise<WhatsAppAutomation[]> {
  return MOCK_WHATSAPP_AUTOMACOES.map(a => ({ ...a }))
}

/** Campos editáveis de uma automação (o gatilho é a chave, não muda). */
export type EditAutomation = Omit<WhatsAppAutomation, 'gatilho'>

export async function salvarAutomacao(
  gatilho: AutomationTrigger,
  dados: EditAutomation,
): Promise<void> {
  const indice = MOCK_WHATSAPP_AUTOMACOES.findIndex(a => a.gatilho === gatilho)
  if (indice >= 0) MOCK_WHATSAPP_AUTOMACOES[indice] = { gatilho, ...dados }
}
