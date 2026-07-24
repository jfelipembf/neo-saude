import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { setCurrentClinicId } from '@/lib/tenant'
import type { AppPage, ClinicSpecialty } from '@/types/domain'

/**
 * Permissão efetiva por feature (passou nos DOIS portões: plano + cargo).
 * Detalhe interno de propósito: fora daqui o acesso se lê por `canView`/`canEdit`,
 * que são fail-closed — ler o mapa cru burlaria esse portão.
 */
interface FeatureAccess {
  view: boolean
  edit: boolean
}

/** Recorte do `my_session()` que o app usa (chaves já em camelCase). */
export interface SessionInfo {
  clinicId: string
  clinicName: string
  /** Ramo de atuação da clínica — filtra abas/telas específicas (ver constants/specialty). */
  specialty?: ClinicSpecialty
  /** Mapa feature_key → { view, edit } — o front esconde menu/aba/botão por aqui. */
  features: Record<string, FeatureAccess>
  accessProfileName: string | null
}

interface SessionContextValue {
  session: Session | null
  /** Contexto da clínica corrente (null enquanto não resolvido ou sem vínculo). */
  info: SessionInfo | null
  /** true enquanto a sessão inicial ainda não foi resolvida (evita flash de login). */
  loading: boolean
  /** Ramo de atuação da clínica corrente (undefined enquanto não resolvido). */
  specialty: ClinicSpecialty | undefined
  /** O cargo permite VER a feature? (esconde menu/rota). */
  canView: (feature: AppPage) => boolean
  /** O cargo permite EDITAR a feature? (esconde botões de salvar/criar). */
  canEdit: (feature: AppPage) => boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  /** Envia o e-mail de recuperação de senha. */
  resetPassword: (email: string) => Promise<{ error: string | null }>
}

const SessionContext = createContext<SessionContextValue | null>(null)

/** Converte o jsonb do `my_session()` (snake_case) no recorte camelCase do app. */
function parseSessionInfo(raw: unknown): SessionInfo | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Record<string, unknown>
  const clinic = (data.clinic ?? null) as Record<string, unknown> | null
  if (!clinic?.id) return null
  const membership = (data.membership ?? null) as Record<string, unknown> | null
  const rawFeatures = (data.features ?? {}) as Record<string, { view?: boolean; edit?: boolean }>
  const features: Record<string, FeatureAccess> = {}
  for (const [key, val] of Object.entries(rawFeatures)) {
    features[key] = { view: Boolean(val?.view), edit: Boolean(val?.edit) }
  }
  return {
    clinicId: String(clinic.id),
    clinicName: String(clinic.name ?? ''),
    specialty: clinic.specialty ? (String(clinic.specialty) as ClinicSpecialty) : undefined,
    features,
    accessProfileName: membership?.access_profile_name ? String(membership.access_profile_name) : null,
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [info, setInfo] = useState<SessionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  // Bootstrap do contexto da clínica: chama `my_session()` e guarda o clinicId
  // corrente (tenant.ts) que os services usam em todas as queries/inserts.
  async function loadSessionInfo() {
    const { data, error } = await supabase.rpc('my_session')
    if (error) {
      setInfo(null)
      setCurrentClinicId(null)
      return
    }
    const parsed = parseSessionInfo(data)
    setInfo(parsed)
    setCurrentClinicId(parsed?.clinicId ?? null)
  }

  useEffect(() => {
    // Sessão persistida (localStorage) resolve primeiro; depois o listener
    // mantém o estado em dia (login, logout, refresh de token).
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await loadSessionInfo()
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      if (newSession) {
        // SIGNED_IN é a transição do login: liga `loading` até my_session() resolver,
        // senão o FeatureGuard decide com `info` ainda null (fail-closed) e bloqueia
        // por um instante — o "acesso restrito" que pisca antes de liberar. Os
        // demais eventos (TOKEN_REFRESHED…) não mexem em `loading`: a sessão já
        // está de pé, então recarregar as features em silêncio não deve interromper
        // quem já está usando o app com um loader de tela cheia.
        if (event === 'SIGNED_IN') setLoading(true)
        await loadSessionInfo()
        if (event === 'SIGNED_IN') setLoading(false)
      } else {
        setInfo(null)
        setCurrentClinicId(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    // O onAuthStateChange dispara o loadSessionInfo() após o login.
    return { error: error ? 'E-mail ou senha inválidos.' : null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setInfo(null)
    setCurrentClinicId(null)
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    return { error: error ? 'Não foi possível enviar o e-mail. Tente novamente.' : null }
  }

  // Portões de permissão por cargo. FAIL-CLOSED: só liberamos o que o mapa de
  // features do my_session() traz explicitamente (chave ausente = sem acesso).
  // Sessão sem features resolvidas (cargo desconhecido, usuário suspenso, ou
  // falha do my_session) não vê nada — o backend/RLS é a parede real, mas o
  // front não deve exibir o que o cargo não pode acessar. O dono (cargo
  // Administrador) sempre traz as features todas, então nunca é trancado.
  const canView = (feature: AppPage) => Boolean(info?.features?.[feature]?.view)
  const canEdit = (feature: AppPage) => Boolean(info?.features?.[feature]?.edit)

  return (
    <SessionContext.Provider value={{ session, info, loading, specialty: info?.specialty, canView, canEdit, signIn, signOut, resetPassword }}>
      {children}
    </SessionContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession deve ser usado dentro de <SessionProvider>')
  return ctx
}
