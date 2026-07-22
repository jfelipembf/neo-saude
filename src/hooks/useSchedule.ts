import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addScheduleSlot, listScheduleSlots, updateScheduleSlot } from '@/services/scheduleService'
import type { EditScheduleSlot } from '@/services/scheduleService'

export function useScheduleSlots() {
  return useQuery({ queryKey: queryKeys.schedule.all, queryFn: listScheduleSlots })
}

/** Cria um agendamento (modal da grade) e atualiza a grade. */
export function useCreateScheduleSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EditScheduleSlot) => addScheduleSlot(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.schedule.all }),
  })
}

/** Edita um agendamento existente (clique no card da grade). */
export function useUpdateScheduleSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EditScheduleSlot }) => updateScheduleSlot(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.schedule.all }),
  })
}
