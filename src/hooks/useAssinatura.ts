import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getAssinatura, listFaturas } from '@/services/assinaturaService'

export function useAssinatura() {
  return useQuery({ queryKey: queryKeys.assinatura.plano, queryFn: getAssinatura })
}

export function useFaturas() {
  return useQuery({ queryKey: queryKeys.assinatura.faturas, queryFn: listFaturas })
}
