import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { searchCid10 } from '@/services/cid10Service'

/** Busca no CID-10. Só dispara com 2+ caracteres — ver searchCid10. */
export function useCid10Search(termo: string) {
  return useQuery({
    queryKey: queryKeys.cid10.search(termo),
    queryFn: () => searchCid10(termo),
    enabled: termo.trim().length >= 2,
    // O CID não muda entre uma digitada e outra: cacheia à vontade.
    staleTime: 1000 * 60 * 60,
  })
}
