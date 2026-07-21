import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listProfissionais } from '@/services/profissionaisService'

export function useProfissionais() {
  return useQuery({ queryKey: queryKeys.profissionais.all, queryFn: listProfissionais })
}
