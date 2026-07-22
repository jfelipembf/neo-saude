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
  },
  {
    trigger: 'appointment_day',
    title: 'No dia da consulta',
    description: 'Lembrete na manhã do atendimento — reduz falta.',
    scheduled: true,
    variables: ['{hora}', '{profissional}'],
  },
  {
    trigger: 'no_show',
    title: 'Paciente não compareceu',
    description: 'Enviada quando a consulta é marcada como falta, convidando a remarcar.',
    scheduled: true,
    variables: ['{data}', '{profissional}'],
  },
  {
    trigger: 'birthday',
    title: 'Aniversário do paciente',
    description: 'Mensagem de felicitação na data de nascimento do cadastro.',
    scheduled: true,
    variables: [],
  },
  {
    trigger: 'billing',
    title: 'Cobrança de saldo devedor',
    description: 'Aviso de pagamento em aberto — usa os vencidos e pendentes do financeiro.',
    scheduled: true,
    variables: ['{valor}', '{data}'],
  },
]
