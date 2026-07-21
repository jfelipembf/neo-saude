import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addLembrete, listLembretes, removeLembrete, toggleLembrete } from '@/services/lembretesService'
import type { NewReminder } from '@/services/lembretesService'

export function useLembretes() {
  return useQuery({ queryKey: queryKeys.lembretes.all, queryFn: listLembretes })
}

/** Cria um lembrete (modal "Novo lembrete") e atualiza a lista. */
export function useCriarLembrete() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: NewReminder) => addLembrete(dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.lembretes.all }),
  })
}

/** Marca/desmarca um lembrete como concluído. */
export function useAlternarLembrete() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => toggleLembrete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.lembretes.all }),
  })
}

/** Exclui um lembrete. */
export function useRemoverLembrete() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => removeLembrete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.lembretes.all }),
  })
}
