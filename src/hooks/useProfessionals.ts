import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  addProfessional,
  getCurrentProfessionalId,
  getProfessional,
  linkProfessionalToUser,
  listProfessionalEarnings,
  listProfessionalPhysioCommission,
  listProfessionalQuoteConversion,
  listProfessionals,
  updateProfessional,
} from '@/services/professionalsService'
import type { EditProfessional, NewProfessional } from '@/services/professionalsService'

export function useProfessionals() {
  return useQuery({ queryKey: queryKeys.professionals.all, queryFn: listProfessionals })
}

/** Id do professional ligado ao login atual, ou null se o usuário logado (ex.:
 *  recepção, dono sem cadastro clínico) não tiver vínculo algum — ver
 *  getCurrentProfessionalId. Quem consome decide o que fazer com null (a
 *  página "Hoje" simplesmente não mostra a lista pessoal de atendimentos). */
export function useCurrentProfessionalId() {
  return useQuery({ queryKey: queryKeys.professionals.current, queryFn: getCurrentProfessionalId })
}

export function useProfessional(id: string) {
  return useQuery({
    queryKey: queryKeys.professionals.detail(id),
    queryFn: () => getProfessional(id),
    enabled: Boolean(id),
  })
}

/** Produção do profissional, procedimento a procedimento (aba Ganhos). */
export function useProfessionalEarnings(professionalId: string) {
  return useQuery({
    queryKey: queryKeys.professionals.earnings(professionalId),
    queryFn: () => listProfessionalEarnings(professionalId),
    enabled: Boolean(professionalId),
  })
}

/** Orçado × convertido de todos os profissionais num mês (card Comissões do Dashboard). */
/** `enabled` existe porque o card "Comissões" do Dashboard só usa UM dos dois
 *  hooks por vez (por especialidade) — sem desligar o outro, ele chamaria a
 *  RPC errada de qualquer forma e o banco rejeitaria (parse_month_iso não
 *  aceita mês vazio), gerando erro toda hora sem necessidade. */
export function useProfessionalQuoteConversion(monthIso: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.professionals.quoteConversion(monthIso),
    queryFn: () => listProfessionalQuoteConversion(monthIso),
    enabled,
  })
}

/** Versão fisioterapia do mesmo card — ver ProfessionalPhysioCommission. */
export function useProfessionalPhysioCommission(monthIso: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.professionals.physioCommission(monthIso),
    queryFn: () => listProfessionalPhysioCommission(monthIso),
    enabled,
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
