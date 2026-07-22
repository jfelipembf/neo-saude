import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addTask, listTasks, removeTask, setTaskStatus } from '@/services/tasksService'
import type { NewTask } from '@/services/tasksService'
import type { TaskStatus } from '@/types/domain'

export function useTasks() {
  return useQuery({ queryKey: queryKeys.tasks.all, queryFn: listTasks })
}

/** Cria uma tarefa (modal do TasksCard) e atualiza a lista. */
export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NewTask) => addTask(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  })
}

/** Muda o status de uma tarefa (check no card, arrastar no kanban) e atualiza as listas. */
export function useSetTaskStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => setTaskStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  })
}

/** Exclui uma tarefa (lixeira do card do Dashboard). */
export function useRemoveTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => removeTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  })
}
