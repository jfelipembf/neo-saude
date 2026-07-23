import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { isoToBrDate } from '@/utils/date'
import { capitalizeName, cepToDb, phoneToDb, ufToDb } from '@/utils/text'
import type { Collaborator, Gender, MembershipStatus } from '@/types/domain'

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
  sex: Gender | null
  birth_date: string | null
  whatsapp: string | null
  cep: string | null
  state: string | null
  city: string | null
  neighborhood: string | null
  number: string | null
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
    sex: r.sex ?? undefined,
    birthDate: isoToBrDate(r.birth_date),
    whatsapp: r.whatsapp ?? undefined,
    cep: r.cep ?? undefined,
    state: r.state ?? undefined,
    city: r.city ?? undefined,
    neighborhood: r.neighborhood ?? undefined,
    number: r.number ?? undefined,
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
  phone?: string
  /** Cadastro completo (opcional campo a campo) — gravado em clinic_user. */
  details?: {
    sex?: Gender | ''
    birthDate?: string    // aaaa-mm-dd
    whatsapp?: string
    cep?: string
    state?: string
    city?: string
    neighborhood?: string
    number?: string
  }
}

/** Cria o login do colaborador (Edge Function service_role) e vincula ao cargo.
 *  Mesmos normalizadores do cadastro de PACIENTES (capitalizeName/phoneToDb/
 *  cepToDb/ufToDb): máscara e formato errado morrem aqui, não no banco. */
export async function createCollaborator(payload: NewCollaborator): Promise<void> {
  const d = payload.details
  await invokeManage({
    action: 'create',
    email: payload.email,
    password: payload.password,
    fullName: capitalizeName(payload.fullName),
    accessProfileId: payload.roleId,
    phone: phoneToDb(payload.phone) ?? '',
    details: {
      sex: d?.sex || '',
      birthDate: d?.birthDate ?? '',
      whatsapp: phoneToDb(d?.whatsapp) ?? '',
      cep: cepToDb(d?.cep) ?? '',
      state: ufToDb(d?.state) ?? '',
      city: d?.city?.trim() ?? '',
      neighborhood: d?.neighborhood?.trim() ?? '',
      number: d?.number?.trim() ?? '',
    },
  })
}

/** Redefine a senha de um colaborador (Edge Function service_role). */
export async function resetCollaboratorPassword(userId: string, password: string): Promise<void> {
  await invokeManage({ action: 'set_password', userId, password })
}
