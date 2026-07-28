import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { searchDrugs } from '@/services/drugCatalogService'

/**
 * Busca no catálogo de medicamentos.
 *
 * `keepPreviousData` de propósito: sem ele a lista pisca em branco a cada
 * tecla, e quem está digitando o nome de um fármaco no meio do atendimento
 * perde a referência do que já apareceu. O termo já chega debounced da tela.
 */
export function useDrugCatalog(termo: string) {
  return useQuery({
    queryKey: queryKeys.drugCatalog(termo),
    queryFn: () => searchDrugs(termo),
    placeholderData: keepPreviousData,
    // Catálogo publicado uma vez por mês pela CMED — refazer a busca a cada
    // foco de janela seria consulta à toa.
    staleTime: 30 * 60 * 1000,
  })
}
