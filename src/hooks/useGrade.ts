import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listGradeSessoes } from '@/services/gradeService'

export function useGradeSessoes() {
  return useQuery({ queryKey: queryKeys.grade.all, queryFn: listGradeSessoes })
}
