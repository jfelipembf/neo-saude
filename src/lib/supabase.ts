import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * MODO MOCK: sem .env configurado o app roda inteiro com dados de demonstração
 * (sessão fake + services retornando mocks) — nada quebra sem Supabase.
 * Para ligar no backend real: criar .env (ver .env.example) e reiniciar o dev.
 */
export const isMockMode = !url || !anonKey

// Placeholders no modo mock: o cliente existe (nenhum import quebra), mas
// nenhuma chamada de rede é feita — services/contexts checam isMockMode antes.
export const supabase = createClient<Database>(
  url ?? 'https://mock.supabase.co',
  anonKey ?? 'mock-anon-key',
  {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  },
)
