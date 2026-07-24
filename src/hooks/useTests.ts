import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { addTest, deleteTest, listTests, updateTest } from '@/services/testsService'
import type { EditTest } from '@/services/testsService'

export function useTests() {
  return useQuery({ queryKey: queryKeys.tests.all, queryFn: listTests })
}

export function useCreateTest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EditTest) => addTest(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tests.all }),
  })
}

export function useUpdateTest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EditTest }) => updateTest(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tests.all }),
  })
}

export function useDeleteTest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tests.all }),
  })
}
