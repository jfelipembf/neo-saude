# hooks/

Hooks reutilizáveis entre páginas — em geral wrappers de `useQuery`/`useMutation`
sobre os services, usando as keys de `@/lib/queryKeys`.

Regras:
- TUDO fica centralizado aqui — inclusive o hook que hoje só uma página usa
  (mesma decisão de `components/`: nada de hook na pasta da página).
- Nomes em inglês: `usePatients.ts`, `useAppointments.ts`, `useSchedule.ts`…

Exemplo de esqueleto:

```ts
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listPatients } from '@/services/patientsService'

export function usePatients() {
  return useQuery({ queryKey: queryKeys.patients.all, queryFn: listPatients })
}
```
