import { supabase } from '@/lib/supabase'
import { getCurrentClinicId, type ClientPayload } from '@/lib/tenant'
import type { AppPage, Role } from '@/types/domain'

// As "páginas" do cargo são exatamente as features de categoria `module`.
const MODULE_KEYS: AppPage[] = ['dashboard', 'schedule', 'patients', 'professionals', 'finance', 'admin', 'settings']

/**
 * Cargos da clínica. Lidos da VIEW `role`, que já agrega
 * `access_profile` + `access_profile_permission` no formato do domínio
 * (pages = feature_keys de módulo com can_view). Filtro por clínica explícito
 * por segurança, independente do modo da view.
 */
export async function listRoles(): Promise<Role[]> {
  const { data, error } = await supabase
    .from('role')
    .select('id, clinic_id, name, pages')
    .eq('clinic_id', getCurrentClinicId())
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id as string,
    clinicId: r.clinic_id as string,
    name: r.name as string,
    pages: ((r.pages ?? []) as string[]) as AppPage[],
  }))
}

/** Campos editáveis do cargo. */
export type EditRole = ClientPayload<Role>

/**
 * Cria (id null) ou atualiza um cargo, e reconcilia suas permissões de módulo.
 *
 * Modelo dos DOIS portões: o que grava aqui é o portão do CARGO
 * (access_profile_permission); o portão do PLANO (plan_feature) é fixo do
 * schema. Cada página marcada vira uma linha com can_view + can_edit = true
 * (o toggle da aba Cargos é acesso total à página; view/edit separados ficam
 * para uma futura granularidade).
 *
 * Nota: os passos (upsert do cargo → delete → insert das permissões) não são
 * atômicos entre si por serem chamadas HTTP separadas. Se virar requisito,
 * mover para uma RPC `save_role(...)` transacional no banco.
 */
export async function saveRole(id: string | null, payload: EditRole): Promise<void> {
  const clinicId = getCurrentClinicId()

  let profileId = id
  if (id) {
    const { error } = await supabase.from('access_profile').update({ name: payload.name }).eq('id', id)
    if (error) throw error
  } else {
    const { data, error } = await supabase
      .from('access_profile')
      .insert({ clinic_id: clinicId, name: payload.name, is_system: false })
      .select('id')
      .single()
    if (error) throw error
    profileId = data.id
  }

  // Reconcilia só as permissões de MÓDULO (preserva specialty/whatsapp etc.).
  const { error: delError } = await supabase
    .from('access_profile_permission')
    .delete()
    .eq('access_profile_id', profileId!)
    .in('feature_key', MODULE_KEYS)
  if (delError) throw delError

  if (payload.pages.length > 0) {
    const rows = payload.pages.map(page => ({
      clinic_id: clinicId,
      access_profile_id: profileId!,
      feature_key: page,
      can_view: true,
      can_edit: true,
    }))
    const { error: insError } = await supabase.from('access_profile_permission').insert(rows)
    if (insError) throw insError
  }
}
