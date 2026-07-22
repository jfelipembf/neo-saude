import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isMockMode } from '@/lib/supabase'
import { setCurrentClinicId } from '@/lib/tenant'

/** Permissão efetiva por feature (passou nos DOIS portões: plano + cargo). */
export interface FeatureAccess {
  view: boolean
  edit: boolean
}

/** Recorte do `my_session()` que o app usa (chaves já em camelCase). */
export interface SessionInfo {
  clinicId: string
  clinicName: string
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
  /** O cargo permite VER a feature? (esconde menu/rota). */
  canView: (feature: string) => boolean
  /** O cargo permite EDITAR a feature? (esconde botões de salvar/criar). */
  canEdit: (feature: string) => boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  /** Envia o e-mail de recuperação de senha. */
  resetPassword: (email: string) => Promise<{ error: string | null }>
}

const SessionContext = createContext<SessionContextValue | null>(null)

// Sessão fake do modo demonstração (só os campos que o app usa).
const MOCK_SESSION = {
  user: { id: 'mock-user', email: 'demo@neosaude.com.br' },
} as Session

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
    features,
    accessProfileName: membership?.access_profile_name ? String(membership.access_profile_name) : null,
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  // Modo mock: já entra logado — o app abre direto no Dashboard.
  const [session, setSession] = useState<Session | null>(isMockMode ? MOCK_SESSION : null)
  const [info, setInfo] = useState<SessionInfo | null>(null)
  const [loading, setLoading] = useState(!isMockMode)

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
    if (isMockMode) return

    // Sessão persistida (localStorage) resolve primeiro; depois o listener
    // mantém o estado em dia (login, logout, refresh de token).
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await loadSessionInfo()
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession) {
        await loadSessionInfo()
      } else {
        setInfo(null)
        setCurrentClinicId(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    if (isMockMode) {
      setSession(MOCK_SESSION)
      return { error: null }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    // O onAuthStateChange dispara o loadSessionInfo() após o login.
    return { error: error ? 'E-mail ou senha inválidos.' : null }
  }

  async function signOut() {
    if (isMockMode) {
      setSession(null)
      return
    }
    await supabase.auth.signOut()
    setInfo(null)
    setCurrentClinicId(null)
  }

  async function resetPassword(email: string) {
    if (isMockMode) return { error: null }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    return { error: error ? 'Não foi possível enviar o e-mail. Tente novamente.' : null }
  }

  // Portões de permissão por cargo. FAIL-CLOSED numa sessão real: só liberamos
  // o que o mapa de features do my_session() traz explicitamente (chave ausente
  // = sem acesso). Sessão sem features resolvidas (cargo desconhecido, usuário
  // suspenso, ou falha do my_session) não vê nada — o backend/RLS é a parede
  // real, mas o front não deve exibir o que o cargo não pode acessar. O modo
  // demonstração (mock) libera tudo. O dono (cargo Administrador) sempre traz
  // as 13 features, então nunca é trancado.
  const canView = (feature: string) => isMockMode || Boolean(info?.features?.[feature]?.view)
  const canEdit = (feature: string) => isMockMode || Boolean(info?.features?.[feature]?.edit)

  return (
    <SessionContext.Provider value={{ session, info, loading, canView, canEdit, signIn, signOut, resetPassword }}>
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
