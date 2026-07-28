import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  addToWaitingList, listWaitingList, resolveWaitingListEntry, updateWaitingListEntry,
} from '@/services/waitingListService'
import type { NewWaitingListEntry } from '@/services/waitingListService'
import type { WaitingListStatus } from '@/types/domain'

export function useWaitingList() {
  return useQuery({ queryKey: queryKeys.waitingList, queryFn: listWaitingList })
}

/** Recarrega a fila depois de qualquer escrita — ela é curta e sempre visível. */
function useWaitingListMutation<T>(fn: (payload: T) => Promise<void>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.waitingList }),
  })
}

export function useAddToWaitingList() {
  return useWaitingListMutation((p: NewWaitingListEntry) => addToWaitingList(p))
}

export function useUpdateWaitingListEntry() {
  return useWaitingListMutation(
    ({ id, ...payload }: { id: string } & Omit<NewWaitingListEntry, 'patientId'>) =>
      updateWaitingListEntry(id, payload),
  )
}

/** Tira da fila: `scheduled` quando virou consulta, `canceled` quando desistiu. */
export function useResolveWaitingListEntry() {
  return useWaitingListMutation(
    ({ id, status, appointmentId }: {
      id: string
      status: Exclude<WaitingListStatus, 'waiting'>
      appointmentId?: string
    }) => resolveWaitingListEntry(id, status, appointmentId),
  )
}
