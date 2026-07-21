# hooks/

Hooks reutilizáveis entre páginas — em geral wrappers de `useQuery`/`useMutation`
sobre os services, usando as keys de `@/lib/queryKeys`.

Regras:
- Hook usado por UMA página só? Fica na pasta da página, não aqui.
- Nomes: `usePacientes.ts`, `useConsultasDoDia.ts`…

Exemplo de esqueleto:

```ts
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { listPacientes } from '@/services/pacientesService'

export function usePacientes() {
  return useQuery({ queryKey: queryKeys.pacientes.all, queryFn: listPacientes })
}
```
