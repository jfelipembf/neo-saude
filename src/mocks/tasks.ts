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
export const MOCK_TASKS: Task[] = [
  { id: 't1', clinicId: 'c1',  title: 'Ligar para confirmar consulta de Carlos Pereira', priority: 'high',  dueDate: diasAPartirDeHoje(0),  status: 'todo' },
  { id: 't2', clinicId: 'c1',  title: 'Pedir reposição de luvas de procedimento M',      priority: 'high',  dueDate: diasAPartirDeHoje(-3), status: 'todo' },
  { id: 't3', clinicId: 'c1',  title: 'Confirmar consultas de amanhã',                   priority: 'high',  dueDate: diasAPartirDeHoje(1),  status: 'todo' },
  { id: 't4', clinicId: 'c1',  title: 'Reagendar retorno da Sra. Maria Oliveira',        priority: 'medium',                               status: 'todo' },
  { id: 't5', clinicId: 'c1',  title: 'Repor material de curativo',                      priority: 'high',  dueDate: diasAPartirDeHoje(2),  status: 'todo' },
  { id: 't6', clinicId: 'c1',  title: 'Enviar relatório mensal para a contabilidade',    priority: 'medium', dueDate: diasAPartirDeHoje(4),  status: 'in_progress' },
  { id: 't7', clinicId: 'c1',  title: 'Revisar agenda da próxima semana',                priority: 'medium', dueDate: diasAPartirDeHoje(3),  status: 'in_progress' },
  { id: 't8', clinicId: 'c1',  title: 'Atualizar cadastro de pacientes',                 priority: 'low',                               status: 'in_progress' },
  { id: 't9', clinicId: 'c1',  title: 'Renovar alvará sanitário',                        priority: 'low', dueDate: diasAPartirDeHoje(9),  status: 'done' },
  { id: 't10', clinicId: 'c1', title: 'Emitir notas fiscais de junho',                   priority: 'high',  dueDate: diasAPartirDeHoje(-3), status: 'done' },
  { id: 't11', clinicId: 'c1', title: 'Agendar manutenção do autoclave',                 priority: 'low',                               status: 'done' },
]
