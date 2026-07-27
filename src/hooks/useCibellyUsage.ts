import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listCibellyUsage } from '@/services/cibellyUsageService'

/**
 * MEDIÇÃO TEMPORÁRIA — as últimas sessões de voz e o que cada uma custou de
 * verdade. Ver src/lib/cibelly/pricing.ts: bloco isolado, feito para sair
 * inteiro (este hook, o service, a tabela e o card do Dashboard) quando a
 * comparação OpenAI × Gemini terminar.
 *
 * `staleTime` curto: é um painel de comparação em uso ativo, não um relatório
 * — vale a pena ver a sessão que acabou de encerrar sem precisar recarregar.
 */
export function useCibellyUsage() {
  return useQuery({
    queryKey: queryKeys.cibellyUsage.recent,
    queryFn: () => listCibellyUsage(20),
    staleTime: 15_000,
  })
}
