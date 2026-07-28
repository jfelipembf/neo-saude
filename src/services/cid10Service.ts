import { supabase } from '@/lib/supabase'
import { normalizarBuscaCid, pareceCodigoCid } from '@/utils/cidSearch'

/**
 * BUSCA NO CID-10.
 *
 * Tabela pública do DATASUS (sem clinic_id, ver a migration) — 12 mil códigos,
 * então a busca é SEMPRE no servidor: trazer a tabela para o navegador seria
 * 1,3 MB para preencher um campo de atestado.
 */

export interface Cid10 {
  code: string
  /** Já formatado como se escreve no atestado: A00.0 */
  display: string
  description: string
}

/**
 * Procura por código OU por palavra da descrição — o médico digita "J18" num
 * dia e "pneumonia" no outro, e a mesma caixa tem de servir aos dois.
 */
export async function searchCid10(termo: string, limite = 20): Promise<Cid10[]> {
  const { codigo, texto } = normalizarBuscaCid(termo)
  if (texto.length < 2 && codigo.length < 2) return []

  // Dois filtros no mesmo OR: quem digita "B34" acha pelo código, quem digita
  // "dengue" acha pela descrição — e "CID-B34" acha porque o rótulo já saiu.
  const filtros = [
    pareceCodigoCid(codigo) ? `code.ilike.${codigo}%` : '',
    texto.length >= 2 ? `description.ilike.%${texto}%` : '',
  ].filter(Boolean).join(',')
  if (!filtros) return []

  const { data, error } = await supabase
    .from('cid10')
    .select('code, display, description')
    .or(filtros)
    .order('code')
    .limit(limite)
  if (error) throw error
  return (data ?? []) as Cid10[]
}
