import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// O .env é OBRIGATÓRIO: sem ele o app não sobe. Falhar aqui, no import, dá um
// erro claro na hora — o fallback antigo (cliente apontando pra um host falso)
// só adiava a quebra pra primeira query, com mensagem de rede sem sentido.
if (!url || !anonKey) {
  throw new Error(
    'Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env (ver .env.example).',
  )
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
