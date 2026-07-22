import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types/domain'

// Recorte do `my_session()` usado aqui.
type SessionUser = { id: string; full_name: string | null; email: string | null; phone: string | null; avatar_url: string | null }
type SessionClinic = { id: string }

type ProfessionalRow = {
  id: string
  name: string
  specialty: string
  license: string
  email: string | null
  phone: string | null
  cep: string | null
  state: string | null
  city: string | null
  street: string | null
  number: string | null
  created_at: string
}

function formatBrDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR')
}

function joinParts(parts: (string | null | undefined)[], sep: string): string {
  return parts.filter(Boolean).join(sep)
}

/**
 * Perfil do usuário logado (cabeçalho / menu de perfil). É um COMPÓSITO:
 * dados da conta vêm de `profile` (via my_session) e os dados profissionais
 * (especialidade, conselho, endereço) do `professional` vinculado ao usuário.
 * O parâmetro `email` (da sessão) sobrepõe o e-mail quando presente.
 */
export async function getCurrentUser(email?: string): Promise<UserProfile> {
  const { data: sessionData, error: sessionError } = await supabase.rpc('my_session')
  if (sessionError) throw sessionError

  const s = (sessionData ?? {}) as { user?: SessionUser; clinic?: SessionClinic }
  const user = s.user
  const clinic = s.clinic
  if (!user || !clinic) throw new Error('Sessão sem usuário/clínica resolvidos.')

  // Profissional vinculado (pode não existir — usuário administrativo puro).
  const { data: prof, error: profError } = await supabase
    .from('professional')
    .select('id, name, specialty, license, email, phone, cep, state, city, street, number, created_at')
    .eq('user_id', user.id)
    .eq('clinic_id', clinic.id)
    .maybeSingle()
  if (profError) throw profError
  const p = prof as ProfessionalRow | null

  return {
    id: user.id,
    clinicId: clinic.id,
    // TODO(neoSaude): a origem do código humano "NS-000016" do UserProfile não
    // existe no schema (professional usa PRO-, paciente PAC-…). Deixado em branco
    // até o produto definir de onde sai esse código.
    code: '',
    professionalId: p?.id,
    photo: user.avatar_url ?? undefined,
    name: p?.name ?? user.full_name ?? '',
    specialty: p?.specialty ?? '',
    license: p?.license ?? '',
    email: email ?? user.email ?? p?.email ?? '',
    phone: p?.phone ?? user.phone ?? '',
    address: joinParts([p?.street, p?.number], ', '),
    city: joinParts([p?.city, p?.state], '/'),
    cep: p?.cep ?? '',
    memberSince: formatBrDate(p?.created_at),
  }
}
