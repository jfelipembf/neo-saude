import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addRoom, listRooms, updateRoom } from '@/services/roomsService'
import type { NewRoom } from '@/services/roomsService'

export function useRooms() {
  return useQuery({ queryKey: queryKeys.rooms.all, queryFn: listRooms })
}

/** Cadastra uma sala (modal "Nova sala") e atualiza a lista. */
export function useCreateRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NewRoom) => addRoom(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all }),
  })
}

/** Salva a edição de uma sala e atualiza a lista. */
export function useUpdateRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: NewRoom }) => updateRoom(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all }),
  })
}
