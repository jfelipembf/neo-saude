import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listGoals, removeGoal, saveGoal } from '@/services/goalsService'
import type { GoalMetric } from '@/types/domain'

export function useGoals() {
  return useQuery({ queryKey: queryKeys.goals.all, queryFn: listGoals })
}

/**
 * As duas mutações invalidam TAMBÉM `appointments.stats`: a meta viaja de volta
 * dentro da RPC `dashboard_stats` (em `metrics.*.target`), então mexer numa meta
 * sem refazer os cartões deixaria o Dashboard mostrando a meta antiga até o
 * próximo refetch — e o usuário que acabou de salvar leria isso como falha.
 */
function useGoalMutation<TArg>(mutationFn: (arg: TArg) => Promise<void>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.stats })
    },
  })
}

/** Grava (ou regrava) a meta de uma métrica. */
export function useSaveGoal() {
  return useGoalMutation(({ metric, targetValue }: { metric: GoalMetric; targetValue: number }) =>
    saveGoal(metric, targetValue))
}

/** Apaga a meta de uma métrica. */
export function useRemoveGoal() {
  return useGoalMutation((metric: GoalMetric) => removeGoal(metric))
}
