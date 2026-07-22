import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { brToIsoDate, localDate, toShortDate } from '@/utils/date'
import type { TaskPriority, TaskStatus, Task } from '@/types/domain'

/** Dados do formulário de nova tarefa (o resto — id, status — nasce no banco). */
export interface NewTask {
  title: string
  priority: TaskPriority
  dueDate?: string   // dd/mm
}

type TaskRow = {
  id: string
  clinic_id: string
  title: string
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
}

export async function listTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('task')
    .select('id, clinic_id, title, priority, status, due_date')
    .eq('clinic_id', getCurrentClinicId())
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as TaskRow[]).map(r => ({
    id: r.id,
    clinicId: r.clinic_id,
    title: r.title,
    priority: r.priority,
    // due_date é DATE completa no banco; o domínio mostra só dd/mm.
    dueDate: r.due_date ? toShortDate(localDate(r.due_date)) : undefined,
    status: r.status,
  }))
}

/** Cria uma tarefa nova (entra como "a fazer" pelo default da coluna status). */
export async function addTask(payload: NewTask): Promise<void> {
  // dueDate vem como 'dd/mm' (sem ano) — assume o ano corrente para a coluna DATE.
  const dueIso = payload.dueDate ? brToIsoDate(`${payload.dueDate}/${new Date().getFullYear()}`) : null
  const { error } = await supabase.from('task').insert({
    clinic_id: getCurrentClinicId(),
    title: payload.title,
    priority: payload.priority,
    due_date: dueIso,
  })
  if (error) throw error
}

/** Move a tarefa de coluna/estado (o trigger tg_task_stamp_completion cuida do completed_at). */
export async function setTaskStatus(id: string, status: TaskStatus): Promise<void> {
  const { error } = await supabase.from('task').update({ status }).eq('id', id)
  if (error) throw error
}

/** Exclui uma tarefa. */
export async function removeTask(id: string): Promise<void> {
  const { error } = await supabase.from('task').delete().eq('id', id)
  if (error) throw error
}
