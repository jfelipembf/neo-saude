import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { invalidateFinance } from '@/hooks/useFinance'
import {
  addTreatmentSession, addTreatment, countTreatmentReceivables, deleteTreatment,
  listPatientTreatments, previewSessionBilling,
} from '@/services/treatmentsService'
import type { NewTreatmentSession, NewTreatment } from '@/services/treatmentsService'
import type { SessionBillingChoice } from '@/types/domain'

export function usePatientTreatments(patientId: string) {
  return useQuery({
    queryKey: queryKeys.treatments.byPatient(patientId),
    queryFn: () => listPatientTreatments(patientId),
    enabled: Boolean(patientId),
  })
}

/** Cria um tratamento novo (com a 1ª sessão) e atualiza o histórico. */
export function useCreateTreatment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NewTreatment) => addTreatment(payload),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.treatments.byPatient(variables.patientId) }),
  })
}

/**
 * Adiciona uma sessão a um tratamento em aberto e atualiza o histórico.
 *
 * INVALIDAÇÃO: salvar um procedimento com valor CRIA UM RECEBÍVEL na mesma
 * transação. Invalidar só o histórico do paciente — como era antes — deixava a
 * recepção olhando uma lista de Contas a Receber sem a cobrança que acabou de
 * nascer, e o dashboard com o faturamento de antes. O prefixo do financeiro
 * inteiro entra porque o título novo aparece em pelo menos quatro telas
 * (recebíveis, fluxo de caixa, extrato do paciente e "A faturar").
 */
export function useAddTreatmentSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ treatmentId, slot: session }: { treatmentId: string; patientId: string; slot: NewTreatmentSession }) =>
      addTreatmentSession(treatmentId, session),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.treatments.byPatient(variables.patientId) })
      invalidateFinance(queryClient)
    },
  })
}

/**
 * Apaga o tratamento inteiro, com os procedimentos dele.
 *
 * Invalida o FINANCEIRO junto, e não só o histórico: um tratamento pode ter
 * sessão sem cobrança que ainda assim aparece em "A faturar". Deixar só o
 * histórico atualizado repetiria o bug que useAddTreatmentSession já
 * documenta — a recepção olhando uma lista que não existe mais.
 */
export function useDeleteTreatment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ treatmentId }: { treatmentId: string; patientId: string }) =>
      deleteTreatment(treatmentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.treatments.byPatient(variables.patientId) })
      invalidateFinance(queryClient)
    },
  })
}

/** Cobranças já emitidas a partir deste tratamento — 0 libera a exclusão. */
export function useTreatmentReceivableCount(treatmentId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.treatments.all, 'receivables', treatmentId ?? ''] as const,
    queryFn: () => countTreatmentReceivables(treatmentId ?? ''),
    enabled: Boolean(treatmentId),
    // Pergunta sobre o AGORA: a cobrança pode ter nascido noutra aba enquanto
    // o diálogo estava aberto.
    staleTime: 0,
  })
}

/**
 * O que vai acontecer com o dinheiro se o procedimento for salvo agora.
 *
 * É `useQuery` e não uma chamada solta porque a frase muda com o valor, a data
 * e a forma escolhida — e o diálogo pode ser aberto e fechado várias vezes
 * antes de o dentista decidir. `enabled` guarda o caso do editor recém-aberto,
 * quando ainda não há paciente resolvido.
 */
export function useSessionBillingPreview(
  patientId: string,
  amount: number | undefined,
  performedOn: string,
  billing: SessionBillingChoice,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.treatments.billingPreview(patientId, amount, performedOn, billing),
    queryFn: () => previewSessionBilling(patientId, amount, performedOn, billing),
    enabled: enabled && Boolean(patientId),
    // A prévia é uma pergunta sobre o AGORA (o contrato pode ter sido aprovado
    // em outra aba há dez segundos). Sem isto, o cache serviria a resposta de
    // uma abertura anterior do diálogo.
    staleTime: 0,
  })
}
