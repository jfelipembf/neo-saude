import { supabase } from '@/lib/supabase'
import type { DrugProduct } from '@/types/domain'

/**
 * CATÁLOGO DE MEDICAMENTOS — a Lista de Preços da CMED/ANVISA.
 *
 * É a única fonte brasileira pública e estruturada de medicamentos: marca,
 * apresentação, princípio ativo, laboratório, registro, tarja e classe
 * terapêutica. NÃO traz indicação, posologia nem contraindicação — isso não
 * existe em forma estruturada em fonte pública nenhuma, e é por isso que a
 * bula é link e não conteúdo nosso (ver utils/anvisaBula).
 *
 * Dado de REFERÊNCIA global: sem clinic_id, leitura para todo usuário logado,
 * escrita só pelo scripts/import-cmed.mjs com a chave de serviço.
 */

/** Preço NÃO entra: o PMC varia por alíquota de ICMS do estado (a planilha da
 *  CMED tem 26 colunas de preço). Guardar uma só mostraria valor errado para a
 *  maioria dos estados — e preço não é o que se procura no meio de um
 *  atendimento. */
export async function searchDrugs(termo: string, limite = 40): Promise<DrugProduct[]> {
  const { data, error } = await supabase.rpc('buscar_medicamentos', {
    p_termo: termo,
    p_limite: limite,
  })
  if (error) throw error

  return (data ?? []).map(r => ({
    id: r.id as string,
    name: r.name as string,
    presentation: (r.presentation as string | null) ?? undefined,
    manufacturer: (r.manufacturer as string | null) ?? undefined,
    substances: (r.substances as string[] | null) ?? [],
    therapeuticClass: (r.therapeutic_class as string | null) ?? undefined,
    productType: (r.product_type as string | null) ?? undefined,
    tarja: (r.tarja as string | null) ?? undefined,
    hospitalOnly: Boolean(r.hospital_only),
    anvisaRegistro: (r.anvisa_registro as string | null) ?? undefined,
  }))
}
