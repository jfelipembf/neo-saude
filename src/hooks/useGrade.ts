import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addGradeSessao, listGradeSessoes, updateGradeSessao } from '@/services/gradeService'
import type { EditScheduleSlot } from '@/services/gradeService'

export function useGradeSessoes() {
  return useQuery({ queryKey: queryKeys.grade.all, queryFn: listGradeSessoes })
}

/** Cria um agendamento (modal da grade) e atualiza a grade. */
export function useCriarGradeSessao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: EditScheduleSlot) => addGradeSessao(dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.grade.all }),
  })
}

/** Edita um agendamento existente (clique no card da grade). */
export function useAtualizarGradeSessao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: EditScheduleSlot }) => updateGradeSessao(id, dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.grade.all }),
  })
}
