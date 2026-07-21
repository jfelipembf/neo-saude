# services/

Acesso a dados (Supabase) — 1 arquivo por entidade do domínio.

Regras:
- Página/componente NUNCA chama `supabase.from()` direto — sempre via service.
- Cada função retorna dados tipados (tipos de `@/types`) e lança erro em falha
  (o TanStack Query trata loading/error na ponta).
- Nomes: `pacientesService.ts`, `consultasService.ts`, `profissionaisService.ts`…

Exemplo de esqueleto:

```ts
import { supabase } from '@/lib/supabase'

export async function listPacientes() {
  const { data, error } = await supabase.from('pacientes').select('*').order('nome')
  if (error) throw error
  return data
}
```
