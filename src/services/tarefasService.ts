import { MOCK_TAREFAS } from '@/mocks/tarefas'
import type { TaskPriority, TaskStatus, Task } from '@/types/domain'

/** Dados do formulário de nova tarefa (o resto — id, status — nasce aqui). */
export interface NewTask {
  titulo: string
  prioridade: TaskPriority
  prazo?: string   // dd/mm
}

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('tarefas')… mantendo a MESMA assinatura.
// Cópias ({ ...mock }) para o cache do TanStack Query não apontar para o objeto
// mutável: devolver a MESMA referência faz o React Query concluir que nada mudou
// e deixar de re-renderizar quem assina a query (o card do Dashboard e o quadro).
export async function listTarefas(): Promise<Task[]> {
  return MOCK_TAREFAS.map(t => ({ ...t }))
}

// Contador de id do mock — no Supabase o id virá do banco.
let proximoId = 100

/** Cria uma tarefa nova (entra como "a fazer"). */
export async function addTarefa(dados: NewTask): Promise<void> {
  MOCK_TAREFAS.push({ id: `t${proximoId++}`, status: 'a_fazer', ...dados })
}

/** Move a tarefa de coluna/estado (mock: muta o array em memória). */
export async function setStatusTarefa(id: string, status: TaskStatus): Promise<void> {
  const tarefa = MOCK_TAREFAS.find(t => t.id === id)
  if (tarefa) tarefa.status = status
}

/** Exclui uma tarefa. */
export async function removeTarefa(id: string): Promise<void> {
  const indice = MOCK_TAREFAS.findIndex(t => t.id === id)
  if (indice >= 0) MOCK_TAREFAS.splice(indice, 1)
}
