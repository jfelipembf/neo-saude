import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addTarefa, listTarefas, setStatusTarefa } from '@/services/tarefasService'
import type { NovaTarefa } from '@/services/tarefasService'
import type { StatusTarefa } from '@/types/domain'

export function useTarefas() {
  return useQuery({ queryKey: queryKeys.tarefas.all, queryFn: listTarefas })
}

/** Cria uma tarefa (modal do TasksCard) e atualiza a lista. */
export function useCriarTarefa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: NovaTarefa) => addTarefa(dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tarefas.all }),
  })
}

/** Muda o status de uma tarefa (check no card, arrastar no kanban) e atualiza as listas. */
export function useSetStatusTarefa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusTarefa }) => setStatusTarefa(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tarefas.all }),
  })
}
