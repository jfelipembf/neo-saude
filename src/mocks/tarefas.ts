import { toShortDate } from '@/utils/date'
import type { Task } from '@/types/domain'

/** Prazo relativo a hoje (dd/mm) — mantém o card do Dashboard sempre com os
 *  três estados de urgência (atrasado · hoje · em breve). */
function diasAPartirDeHoje(dias: number) {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return toShortDate(d)
}

// Uma lista só: o que antes eram "lembretes" viraram tarefas com prazo.
export const MOCK_TAREFAS: Task[] = [
  { id: 't1',  titulo: 'Ligar para confirmar consulta de Carlos Pereira', prioridade: 'alta',  prazo: diasAPartirDeHoje(0),  status: 'a_fazer' },
  { id: 't2',  titulo: 'Pedir reposição de luvas de procedimento M',      prioridade: 'alta',  prazo: diasAPartirDeHoje(-3), status: 'a_fazer' },
  { id: 't3',  titulo: 'Confirmar consultas de amanhã',                   prioridade: 'alta',  prazo: diasAPartirDeHoje(1),  status: 'a_fazer' },
  { id: 't4',  titulo: 'Reagendar retorno da Sra. Maria Oliveira',        prioridade: 'media',                               status: 'a_fazer' },
  { id: 't5',  titulo: 'Repor material de curativo',                      prioridade: 'alta',  prazo: diasAPartirDeHoje(2),  status: 'a_fazer' },
  { id: 't6',  titulo: 'Enviar relatório mensal para a contabilidade',    prioridade: 'media', prazo: diasAPartirDeHoje(4),  status: 'em_andamento' },
  { id: 't7',  titulo: 'Revisar agenda da próxima semana',                prioridade: 'media', prazo: diasAPartirDeHoje(3),  status: 'em_andamento' },
  { id: 't8',  titulo: 'Atualizar cadastro de pacientes',                 prioridade: 'baixa',                               status: 'em_andamento' },
  { id: 't9',  titulo: 'Renovar alvará sanitário',                        prioridade: 'baixa', prazo: diasAPartirDeHoje(9),  status: 'concluida' },
  { id: 't10', titulo: 'Emitir notas fiscais de junho',                   prioridade: 'alta',  prazo: diasAPartirDeHoje(-3), status: 'concluida' },
  { id: 't11', titulo: 'Agendar manutenção do autoclave',                 prioridade: 'baixa',                               status: 'concluida' },
]
