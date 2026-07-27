import type { AutomationTrigger } from '@/types/domain'

// ─────────────────────────────────────────────────────────────────────────────
// Catálogo dos gatilhos — FONTE ÚNICA. Um gatilho novo entra aqui (e no tipo
// `AutomationTrigger`); a tela se monta sozinha a partir desta lista.
// ─────────────────────────────────────────────────────────────────────────────

export interface AutomationCatalog {
  trigger: AutomationTrigger
  title: string
  description: string
  /** Dispara por HORÁRIO (precisa do campo de hora) ou na hora do evento. */
  scheduled: boolean
  /** Variáveis que o texto pode usar, além das comuns. */
  variables: string[]
  /** Texto inicial para clínicas que ainda não personalizaram o gatilho. */
  defaultMessage: string
  /** Horário inicial dos gatilhos agendados. */
  defaultSendTime?: string
}

/** Disponíveis em qualquer mensagem. */
export const COMMON_VARIABLES = ['{paciente}', '{clinica}']

export const AUTOMATION_CATALOG: AutomationCatalog[] = [
  {
    trigger: 'after_booking',
    title: 'Após o agendamento',
    description: 'Confirma o horário assim que a consulta é marcada.',
    scheduled: false,
    variables: ['{data}', '{hora}', '{profissional}'],
    defaultMessage:
      'Olá, {paciente}! Seu atendimento na {clinica} foi agendado para {data}, às {hora}, com {profissional}. Se precisar alterar o horário, avise-nos com antecedência.',
  },
  {
    trigger: 'appointment_day',
    title: 'No dia da consulta',
    description: 'Lembrete na manhã do atendimento — reduz falta.',
    scheduled: true,
    variables: ['{hora}', '{profissional}'],
    defaultMessage:
      'Olá, {paciente}! Passando para lembrar que seu atendimento na {clinica} é hoje, às {hora}, com {profissional}. Até breve!',
    defaultSendTime: '08:00',
  },
  {
    trigger: 'no_show',
    title: 'Paciente não compareceu',
    description: 'Enviada quando a consulta é marcada como falta, convidando a remarcar.',
    scheduled: true,
    variables: ['{data}', '{profissional}'],
    defaultMessage:
      'Olá, {paciente}. Sentimos sua ausência no atendimento de {data}, na {clinica}. Podemos ajudar a encontrar um novo horário?',
    defaultSendTime: '18:00',
  },
  {
    trigger: 'birthday',
    title: 'Aniversário do paciente',
    description: 'Mensagem de felicitação na data de nascimento do cadastro.',
    scheduled: true,
    variables: [],
    defaultMessage:
      'Olá, {paciente}! A equipe da {clinica} deseja um feliz aniversário, com muita saúde e bons momentos!',
    defaultSendTime: '09:00',
  },
  {
    trigger: 'billing',
    title: 'Cobrança de saldo devedor',
    description: 'Aviso de pagamento em aberto — usa os vencidos e pendentes do financeiro.',
    scheduled: true,
    variables: ['{valor}', '{data}'],
    defaultMessage:
      'Olá, {paciente}. Identificamos na {clinica} um saldo em aberto de {valor}, com vencimento em {data}. Se o pagamento já foi realizado, desconsidere esta mensagem. Em caso de dúvida, estamos à disposição.',
    defaultSendTime: '09:00',
  },
]

export function automationCatalogItem(trigger: AutomationTrigger): AutomationCatalog {
  const item = AUTOMATION_CATALOG.find(entry => entry.trigger === trigger)
  if (!item) throw new Error(`Gatilho de WhatsApp sem catálogo: ${trigger}`)
  return item
}
