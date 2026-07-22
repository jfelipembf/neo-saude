import type { AutomationTrigger } from '@/types/domain'

// ─────────────────────────────────────────────────────────────────────────────
// Catálogo dos gatilhos — FONTE ÚNICA. Um gatilho novo entra aqui (e no tipo
// `AutomationTrigger`); a tela se monta sozinha a partir desta lista.
// ─────────────────────────────────────────────────────────────────────────────

export interface CatalogoAutomacao {
  gatilho: AutomationTrigger
  titulo: string
  descricao: string
  /** Dispara por HORÁRIO (precisa do campo de hora) ou na hora do evento. */
  agendado: boolean
  /** Variáveis que o texto pode usar, além das comuns. */
  variaveis: string[]
}

/** Disponíveis em qualquer mensagem. */
export const VARIAVEIS_COMUNS = ['{paciente}', '{clinica}']

export const CATALOGO_AUTOMACOES: CatalogoAutomacao[] = [
  {
    gatilho: 'apos_agendamento',
    titulo: 'Após o agendamento',
    descricao: 'Confirma o horário assim que a consulta é marcada.',
    agendado: false,
    variaveis: ['{data}', '{hora}', '{profissional}'],
  },
  {
    gatilho: 'dia_da_consulta',
    titulo: 'No dia da consulta',
    descricao: 'Lembrete na manhã do atendimento — reduz falta.',
    agendado: true,
    variaveis: ['{hora}', '{profissional}'],
  },
  {
    gatilho: 'falta',
    titulo: 'Paciente não compareceu',
    descricao: 'Enviada quando a consulta é marcada como falta, convidando a remarcar.',
    agendado: true,
    variaveis: ['{data}', '{profissional}'],
  },
  {
    gatilho: 'aniversario',
    titulo: 'Aniversário do paciente',
    descricao: 'Mensagem de felicitação na data de nascimento do cadastro.',
    agendado: true,
    variaveis: [],
  },
  {
    gatilho: 'cobranca',
    titulo: 'Cobrança de saldo devedor',
    descricao: 'Aviso de pagamento em aberto — usa os vencidos e pendentes do financeiro.',
    agendado: true,
    variaveis: ['{valor}', '{data}'],
  },
]
