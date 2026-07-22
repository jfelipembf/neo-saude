import { MOCK_TASKS } from '@/mocks/tasks'
import type { TaskPriority, TaskStatus, Task } from '@/types/domain'
import { CURRENT_CLINIC } from '@/lib/tenant'

/** Dados do formulário de nova tarefa (o resto — id, status — nasce aqui). */
export interface NewTask {
  title: string
  priority: TaskPriority
  dueDate?: string   // dd/mm
}

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('tasks')… mantendo a MESMA assinatura.
// Cópias ({ ...mock }) para o cache do TanStack Query não apontar para o objeto
// mutável: devolver a MESMA referência faz o React Query concluir que nada mudou
// e deixar de re-renderizar quem assina a query (o card do Dashboard e o quadro).
export async function listTasks(): Promise<Task[]> {
  return MOCK_TASKS.map(t => ({ ...t }))
}

// Contador de id do mock — no Supabase o id virá do banco.
let nextId = 100

/** Cria uma tarefa nova (entra como "a fazer"). */
export async function addTask(payload: NewTask): Promise<void> {
  MOCK_TASKS.push({ id: `t${nextId++}`, clinicId: CURRENT_CLINIC, status: 'todo', ...payload })
}

/** Move a tarefa de coluna/estado (mock: muta o array em memória). */
export async function setTaskStatus(id: string, status: TaskStatus): Promise<void> {
  const task = MOCK_TASKS.find(t => t.id === id)
  if (task) task.status = status
}

/** Exclui uma tarefa. */
export async function removeTask(id: string): Promise<void> {
  const index = MOCK_TASKS.findIndex(t => t.id === id)
  if (index >= 0) MOCK_TASKS.splice(index, 1)
}
