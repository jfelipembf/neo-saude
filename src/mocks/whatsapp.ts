import type { WhatsAppAutomation, WhatsAppConnection } from '@/types/domain'

// Começa desconectado com um QR "válido" — é o estado que o usuário vê ao abrir
// a aba pela primeira vez. Parear (mock) troca para conectado.
export const MOCK_WHATSAPP_CONNECTION: WhatsAppConnection = {
  status: 'disconnected',
  qrCode: 'neo-saude-pareamento-demo-2026',
}

/** Número que a conexão simulada assume ao parear. */
export const MOCK_WHATSAPP_NUMBER = '(79) 3211-0000'

export const MOCK_WHATSAPP_AUTOMATIONS: WhatsAppAutomation[] = [
  {
    trigger: 'after_booking',
    status: 'active',
    message:
      'Olá, {paciente}! Sua consulta foi agendada para {data} às {hora} com {profissional}. '
      + 'Qualquer imprevisto, é só responder por aqui. — {clinica}',
  },
  {
    trigger: 'appointment_day',
    status: 'active',
    sendTime: '08:00',
    message:
      'Bom dia, {paciente}! Passando para lembrar da sua consulta hoje às {hora} com {profissional}. '
      + 'Até logo! — {clinica}',
  },
  {
    trigger: 'no_show',
    status: 'active',
    sendTime: '18:00',
    message:
      'Olá, {paciente}. Sentimos sua falta na consulta de hoje. '
      + 'Quer remarcar? É só responder esta mensagem. — {clinica}',
  },
  {
    trigger: 'birthday',
    status: 'active',
    sendTime: '09:00',
    message: 'Feliz aniversário, {paciente}! Que seu novo ano seja cheio de saúde. — {clinica}',
  },
  {
    trigger: 'billing',
    status: 'inactive',
    sendTime: '10:00',
    message:
      'Olá, {paciente}. Consta um saldo em aberto de {valor}, com vencimento em {data}. '
      + 'Se já tiver pago, desconsidere. — {clinica}',
  },
]
