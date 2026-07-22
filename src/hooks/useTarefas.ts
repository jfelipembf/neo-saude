import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addTarefa, listTarefas, removeTarefa, setStatusTarefa } from '@/services/tarefasService'
import type { NewTask } from '@/services/tarefasService'
import type { TaskStatus } from '@/types/domain'

export function useTarefas() {
  return useQuery({ queryKey: queryKeys.tarefas.all, queryFn: listTarefas })
}

/** Cria uma tarefa (modal do TasksCard) e atualiza a lista. */
export function useCriarTarefa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: NewTask) => addTarefa(dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tarefas.all }),
  })
}

/** Muda o status de uma tarefa (check no card, arrastar no kanban) e atualiza as listas. */
export function useSetStatusTarefa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => setStatusTarefa(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tarefas.all }),
  })
}

/** Exclui uma tarefa (lixeira do card do Dashboard). */
export function useRemoverTarefa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => removeTarefa(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tarefas.all }),
  })
}
