import type { Task } from '@/types/domain'

export const MOCK_TAREFAS: Task[] = [
  { id: 't1', titulo: 'Confirmar consultas de amanhã',        prioridade: 'alta',  prazo: '21/07', status: 'a_fazer' },
  { id: 't2', titulo: 'Ligar para Maria Oliveira (retorno)',  prioridade: 'media', prazo: '22/07', status: 'a_fazer' },
  { id: 't3', titulo: 'Repor material de curativo',           prioridade: 'alta',  prazo: '23/07', status: 'a_fazer' },
  { id: 't4', titulo: 'Enviar relatório ao convênio',         prioridade: 'media', prazo: '25/07', status: 'em_andamento' },
  { id: 't5', titulo: 'Atualizar cadastro de pacientes',      prioridade: 'baixa',                 status: 'em_andamento' },
  { id: 't6', titulo: 'Revisar agenda da próxima semana',     prioridade: 'media', prazo: '24/07', status: 'em_andamento' },
  { id: 't7', titulo: 'Emitir notas fiscais de junho',        prioridade: 'alta',  prazo: '18/07', status: 'concluida' },
  { id: 't8', titulo: 'Agendar manutenção do autoclave',      prioridade: 'baixa',                 status: 'concluida' },
]
