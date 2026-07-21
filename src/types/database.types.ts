// ─────────────────────────────────────────────────────────────────────────────
// Tipos do banco Supabase. Este arquivo é GERADO — não edite à mão.
// Regenerar após qualquer migration:
//   npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/types/database.types.ts
// Enquanto o schema não existe, o placeholder abaixo mantém o app compilando.
// ─────────────────────────────────────────────────────────────────────────────

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
