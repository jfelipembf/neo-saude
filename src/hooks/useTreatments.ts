import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { invalidateFinance } from '@/hooks/useFinance'
import {
  addTreatmentSession, addTreatment, listPatientTreatments, previewSessionBilling,
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
