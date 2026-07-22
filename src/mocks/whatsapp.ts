import type { WhatsAppAutomation, WhatsAppConnection } from '@/types/domain'

// Começa desconectado com um QR "válido" — é o estado que o usuário vê ao abrir
// a aba pela primeira vez. Parear (mock) troca para conectado.
export const MOCK_WHATSAPP_CONEXAO: WhatsAppConnection = {
  status: 'desconectado',
  qrCode: 'neo-saude-pareamento-demo-2026',
}

/** Número que a conexão simulada assume ao parear. */
export const MOCK_WHATSAPP_NUMERO = '(79) 3211-0000'

export const MOCK_WHATSAPP_AUTOMACOES: WhatsAppAutomation[] = [
  {
    gatilho: 'apos_agendamento',
    status: 'ativo',
    mensagem:
      'Olá, {paciente}! Sua consulta foi agendada para {data} às {hora} com {profissional}. '
      + 'Qualquer imprevisto, é só responder por aqui. — {clinica}',
  },
  {
    gatilho: 'dia_da_consulta',
    status: 'ativo',
    horario: '08:00',
    mensagem:
      'Bom dia, {paciente}! Passando para lembrar da sua consulta hoje às {hora} com {profissional}. '
      + 'Até logo! — {clinica}',
  },
  {
    gatilho: 'falta',
    status: 'ativo',
    horario: '18:00',
    mensagem:
      'Olá, {paciente}. Sentimos sua falta na consulta de hoje. '
      + 'Quer remarcar? É só responder esta mensagem. — {clinica}',
  },
  {
    gatilho: 'aniversario',
    status: 'ativo',
    horario: '09:00',
    mensagem: 'Feliz aniversário, {paciente}! Que seu novo ano seja cheio de saúde. — {clinica}',
  },
  {
    gatilho: 'cobranca',
    status: 'inativo',
    horario: '10:00',
    mensagem:
      'Olá, {paciente}. Consta um saldo em aberto de {valor}, com vencimento em {data}. '
      + 'Se já tiver pago, desconsidere. — {clinica}',
  },
]
