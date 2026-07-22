import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  addProfessional,
  getProfessional,
  linkProfessionalToUser,
  listProfessionals,
  updateProfessional,
} from '@/services/professionalsService'
import type { EditProfessional, NewProfessional } from '@/services/professionalsService'

export function useProfessionals() {
  return useQuery({ queryKey: queryKeys.professionals.all, queryFn: listProfessionals })
}

export function useProfessional(id: string) {
  return useQuery({
    queryKey: queryKeys.professionals.detail(id),
    queryFn: () => getProfessional(id),
    enabled: Boolean(id),
  })
}

/** Cadastra um profissional. O `mutateAsync` devolve o id criado — use-o para
 *  navegar direto ao perfil recém-cadastrado. */
export function useCreateProfessional() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NewProfessional) => addProfessional(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.professionals.all }),
  })
}

export function useUpdateProfessional() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EditProfessional }) => updateProfessional(id, payload),
    // A key de detalhe é prefixada por ['professionals'] — uma invalidação cobre as duas.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.professionals.all }),
  })
}

/** Liga o profissional a um login da clínica (Administrativo → Profissionais). */
export function useLinkProfessionalToUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ professionalId, userId }: { professionalId: string; userId: string }) =>
      linkProfessionalToUser(professionalId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.professionals.all })
      // "Dados da conta" lê nome/código/especialidade/registro do professional
      // vinculado: sem isto o vínculo novo só apareceria depois do staleTime.
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me })
    },
  })
}
