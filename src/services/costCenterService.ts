import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import type { Insert, ClientInsert } from '@/lib/db'
import type { CostCenter } from '@/types/domain'

const clinic = () => getCurrentClinicId()

const COLS = 'id, clinic_id, name, status'

interface Row {
  id: string
  clinic_id: string
  name: string
  status: 'active' | 'inactive'
}

const toDomain = (r: Row): CostCenter => ({
  id: r.id,
  clinicId: r.clinic_id,
  name: r.name,
  status: r.status,
})

/**
 * Centros de custo da clínica — ATIVOS E INATIVOS.
 *
 * A tela de manutenção precisa enxergar os inativos (é como um setor extinto
 * "sai" da lista sem sumir do histórico, e sem vê-los ninguém reativa). Quem
 * monta seletor de lançamento filtra com `activeOnly`.
 */
export async function listCostCenters(): Promise<CostCenter[]> {
  const { data, error } = await supabase
    .from('cost_center')
    .select(COLS)
    .eq('clinic_id', clinic())
    .order('name')

  if (error) throw error
  return ((data ?? []) as Row[]).map(toDomain)
}

/** O que um seletor de lançamento deve oferecer. */
export function activeOnly(list: CostCenter[]): CostCenter[] {
  return list.filter(c => c.status === 'active')
}

export interface CostCenterInput {
  name: string
  status?: 'active' | 'inactive'
}

export async function addCostCenter(input: CostCenterInput): Promise<void> {
  const row: ClientInsert<'cost_center'> = {
    clinic_id: clinic(),
    name: input.name,
    // status → default 'active'.
  }
  const { error } = await supabase.from('cost_center').insert(row as Insert<'cost_center'>)
  if (error) throw error
}

export async function updateCostCenter(id: string, input: CostCenterInput): Promise<void> {
  const { error } = await supabase
    .from('cost_center')
    .update({
      name: input.name,
      ...(input.status ? { status: input.status } : {}),
    })
    .eq('id', id)
    .eq('clinic_id', clinic())
  if (error) throw error
}

export async function setCostCenterStatus(
  id: string,
  status: 'active' | 'inactive',
): Promise<void> {
  const { error } = await supabase
    .from('cost_center')
    .update({ status })
    .eq('id', id)
    .eq('clinic_id', clinic())
  if (error) throw error
}

/**
 * Exclui um centro de custo.
 *
 * O `.select('id')` não é enfeite: aqui não há linha protegida por policy como
 * em finance_category, mas RLS ainda pode não enxergar a linha (clínica errada,
 * permissão retirada no meio da sessão) — e DELETE que não casa nada devolve
 * sucesso com zero linhas. Sem conferir, a tela diria "excluído" com o registro
 * ainda em pé. Centro com lançamento levanta 23503 e cai no catch de quem chama.
 */
export async function deleteCostCenter(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('cost_center')
    .delete()
    .eq('id', id)
    .eq('clinic_id', clinic())
    .select('id')
  if (error) throw error
  if ((data?.length ?? 0) === 0) throw new Error('Nenhum centro de custo foi excluído.')
}
