import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import type { Collaborator, MembershipStatus } from '@/types/domain'

// Linha crua da RPC list_clinic_staff.
type StaffRow = {
  clinic_user_id: string
  user_id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  phone: string | null
  access_profile_id: string
  role_name: string
  status: MembershipStatus
}

function toCollaborator(r: StaffRow): Collaborator {
  return {
    clinicUserId: r.clinic_user_id,
    userId: r.user_id,
    name: (r.full_name ?? '').trim() || (r.email ?? '—'),
    email: r.email ?? '',
    photo: r.avatar_url ?? undefined,
    phone: r.phone ?? undefined,
    roleId: r.access_profile_id,
    roleName: r.role_name,
    status: r.status,
  }
}

/** Colaboradores da clínica (exclui especialistas) — via RPC SECURITY DEFINER. */
export async function listCollaborators(): Promise<Collaborator[]> {
  const { data, error } = await supabase.rpc('list_clinic_staff', { p_clinic: getCurrentClinicId() })
  if (error) throw error
  return (data as StaffRow[]).map(toCollaborator)
}

/** Troca o cargo de um colaborador (access_profile). */
export async function setCollaboratorRole(clinicUserId: string, roleId: string): Promise<void> {
  const { error } = await supabase.rpc('set_collaborator', {
    p_clinic_user: clinicUserId,
    p_access_profile: roleId,
  })
  if (error) throw error
}

/** Suspende / reativa um colaborador. */
export async function setCollaboratorStatus(clinicUserId: string, status: MembershipStatus): Promise<void> {
  const { error } = await supabase.rpc('set_collaborator', {
    p_clinic_user: clinicUserId,
    p_status: status,
  })
  if (error) throw error
}

/** Chama a Edge Function extraindo a mensagem `{ error }` do corpo (não só o HTTP). */
async function invokeManage(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.functions.invoke('manage-collaborator', {
    body: { ...body, clinicId: getCurrentClinicId() },
  })
  if (error) {
    let message = error.message
    try {
      const ctx = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context
      const parsed = ctx?.json ? await ctx.json() : null
      if (parsed?.error) message = parsed.error
    } catch { /* mantém a mensagem HTTP */ }
    throw new Error(message)
  }
  if (data?.error) throw new Error(String(data.error))
  return data ?? {}
}

export interface NewCollaborator {
  email: string
  password: string
  fullName: string
  roleId: string
}

/** Cria o login do colaborador (Edge Function service_role) e vincula ao cargo. */
export async function createCollaborator(payload: NewCollaborator): Promise<void> {
  await invokeManage({
    action: 'create',
    email: payload.email,
    password: payload.password,
    fullName: payload.fullName,
    accessProfileId: payload.roleId,
  })
}

/** Redefine a senha de um colaborador (Edge Function service_role). */
export async function resetCollaboratorPassword(userId: string, password: string): Promise<void> {
  await invokeManage({ action: 'set_password', userId, password })
}
