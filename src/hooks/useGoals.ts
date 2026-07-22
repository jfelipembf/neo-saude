import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listGoals, saveGoals } from '@/services/goalsService'
import type { GoalYearInput } from '@/services/goalsService'

/** Matriz de metas do ano — uma linha por métrica que tenha ao menos um mês. */
export function useGoals(year: number) {
  return useQuery({
    queryKey: queryKeys.goals.byYear(year),
    queryFn: () => listGoals(year),
  })
}

interface SaveGoalsInput {
  year: number
  rows: GoalYearInput[]
}

/**
 * Grava a matriz de um ano em LOTE (uma chamada, uma transação).
 *
 * Invalida DUAS keys:
 *
 *   `goals.byYear(year)`      só o ano salvo — mexer em 2026 não torna a
 *                             matriz de 2027 obsoleta.
 *   `appointments.stats`      a meta viaja de volta dentro de `dashboard_stats`
 *                             (em `metrics.*.target`), então salvar sem refazer
 *                             os cartões deixaria o Dashboard mostrando a meta
 *                             antiga — e quem acabou de salvar leria isso como
 *                             falha do salvamento.
 */
export function useSaveGoals() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ year, rows }: SaveGoalsInput) => saveGoals(year, rows),
    onSuccess: (_result, { year }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.byYear(year) })
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.stats })
    },
  })
}
