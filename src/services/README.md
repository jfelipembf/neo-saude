# services/

Acesso a dados (Supabase) — 1 arquivo por entidade do domínio.

Regras:
- Página/componente NUNCA chama `supabase.from()` direto — sempre via service.
- Cada função retorna dados tipados (tipos de `@/types/domain`) e lança erro em
  falha (o TanStack Query trata loading/error na ponta).
- Toda consulta de dado da clínica filtra por `clinic_id`
  (`getCurrentClinicId()` de `@/lib/tenant`): a RLS é a parede, o filtro
  explícito é o cinto de segurança.
- A linha do banco vem em snake_case; a conversão para o tipo de domínio
  (camelCase) acontece AQUI, nunca na página.
- Nomes em inglês, no padrão `<entidade>Service.ts`: `patientsService.ts`,
  `appointmentsService.ts`, `financeService.ts`… As TABELAS do banco são no
  singular (`patient`, `appointment`, `room`).

Exemplo de esqueleto (é o `roomsService.ts` real, reduzido):

```ts
import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import type { Room } from '@/types/domain'

type RoomRow = { id: string; clinic_id: string; name: string; photo_url: string | null }

export async function listRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from('room')
    .select('id, clinic_id, name, photo_url')
    .eq('clinic_id', getCurrentClinicId())
    .order('name')
  if (error) throw error
  return (data as RoomRow[]).map(r => ({
    id: r.id,
    clinicId: r.clinic_id,
    name: r.name,
    photo: r.photo_url ?? undefined,
  }))
}
```

Para um service completo (mapeamento maior, insert e update), veja
`patientsService.ts`.
