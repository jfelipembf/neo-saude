import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isMockMode } from '@/lib/supabase'

interface SessionContextValue {
  session: Session | null
  /** true enquanto a sessão inicial ainda não foi resolvida (evita flash de login). */
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

// Sessão fake do modo demonstração (só os campos que o app usa).
const MOCK_SESSION = {
  user: { id: 'mock-user', email: 'demo@neosaude.com.br' },
} as Session

export function SessionProvider({ children }: { children: ReactNode }) {
  // Modo mock: já entra logado — o app abre direto no Dashboard.
  const [session, setSession] = useState<Session | null>(isMockMode ? MOCK_SESSION : null)
  const [loading, setLoading] = useState(!isMockMode)

  useEffect(() => {
    if (isMockMode) return

    // Sessão persistida (localStorage) resolve primeiro; depois o listener
    // mantém o estado em dia (login, logout, refresh de token).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    if (isMockMode) {
      setSession(MOCK_SESSION)
      return { error: null }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? 'E-mail ou senha inválidos.' : null }
  }

  async function signOut() {
    if (isMockMode) {
      setSession(null)
      return
    }
    await supabase.auth.signOut()
  }

  return (
    <SessionContext.Provider value={{ session, loading, signIn, signOut }}>
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
