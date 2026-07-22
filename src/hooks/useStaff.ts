import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  listCollaborators, setCollaboratorRole, setCollaboratorStatus,
  createCollaborator, resetCollaboratorPassword,
} from '@/services/staffService'
import type { NewCollaborator } from '@/services/staffService'
import type { MembershipStatus } from '@/types/domain'

export function useCollaborators() {
  return useQuery({ queryKey: queryKeys.staff.all, queryFn: listCollaborators })
}

/** Cria o login do colaborador (Edge Function) e recarrega a lista. */
export function useCreateCollaborator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NewCollaborator) => createCollaborator(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.staff.all }),
  })
}

/** Troca o cargo do colaborador e recarrega a lista. */
export function useSetCollaboratorRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ clinicUserId, roleId }: { clinicUserId: string; roleId: string }) =>
      setCollaboratorRole(clinicUserId, roleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.staff.all }),
  })
}

/** Suspende / reativa o colaborador. */
export function useSetCollaboratorStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ clinicUserId, status }: { clinicUserId: string; status: MembershipStatus }) =>
      setCollaboratorStatus(clinicUserId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.staff.all }),
  })
}

/** Redefine a senha do colaborador (Edge Function). */
export function useResetCollaboratorPassword() {
  return useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      resetCollaboratorPassword(userId, password),
  })
}
