import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  getOdontogramRevision, getPatientClinicalSummary, getPatientOdontogram, listOdontogramRevisions,
  recordExamSession, savePatientOdontogram,
  type ExamFinding,
} from '@/services/odontogramService'

/**
 * Ficha corrente do odontograma do paciente (ver odontogramService — é a ficha
 * ATUAL, não o snapshot imutável do procedimento).
 *
 * `staleTime: Infinity` de propósito: o motor do odontograma é global de
 * módulo e a fonte da verdade enquanto a tela está aberta é o que está
 * DESENHADO nele. Um refetch em background (foco da janela, reconexão) devolveria
 * o payload do servidor no meio do exame — e como a tela recarrega o motor a
 * partir desta query, marcação recém-feita e ainda não salva sumiria da tela.
 */
export function usePatientOdontogram(patientId: string | null) {
  return useQuery({
    queryKey: queryKeys.odontogram.byPatient(patientId ?? ''),
    queryFn: () => getPatientOdontogram(patientId ?? ''),
    enabled: Boolean(patientId),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

/**
 * A régua do histórico. Carregada junto com a ficha, assim que o paciente é
 * escolhido — é leve (sem payload) e precisa estar pronta antes de o dentista
 * procurar por ela.
 */
export function useOdontogramRevisions(patientId: string | null) {
  return useQuery({
    queryKey: queryKeys.odontogram.revisions(patientId ?? ''),
    queryFn: () => listOdontogramRevisions(patientId ?? ''),
    enabled: Boolean(patientId),
    staleTime: 60_000,
  })
}

/**
 * O snapshot de um dia. `staleTime: Infinity` não é otimização: a linha em
 * treatment_session_odontogram é IMUTÁVEL, então relê-la nunca traria nada
 * diferente.
 */
export function useOdontogramRevision(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.odontogram.revision(sessionId ?? ''),
    queryFn: () => getOdontogramRevision(sessionId ?? ''),
    enabled: Boolean(sessionId),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

export function useSavePatientOdontogram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ patientId, payload, expectedUpdatedAt }: {
      patientId: string
      payload: Record<string, unknown>
      expectedUpdatedAt?: string | null
    }) => savePatientOdontogram(patientId, payload, expectedUpdatedAt),

    // Escreve o resultado direto no cache em vez de invalidar: invalidar
    // dispararia um refetch que recarregaria o motor (ver o efeito de carga na
    // OdontogramFullscreenPage) e faria a boca "piscar" a cada salvamento.
    // Aqui já sabemos o payload salvo e o novo carimbo — não há o que reler.
    onSuccess: (updatedAt, { patientId, payload }) => {
      queryClient.setQueryData(queryKeys.odontogram.byPatient(patientId), { payload, updatedAt })
    },
  })
}

/**
 * Registra o atendimento no prontuário (aba Tratamento do perfil do paciente).
 * Roda ao encerrar o atendimento, junto com o salvamento da ficha corrente.
 */
export function useRecordExamSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      patientId: string
      findings: ExamFinding[]
      materials?: { nome: string; quantidade: string; materialId?: string }[]
      odontogram: Record<string, unknown>
      notes?: string
      clientToken: string
    }) => recordExamSession(params),
    // O prontuário do paciente acabou de ganhar uma linha — a aba Tratamento
    // precisa refazer a leitura. Prefixo 'treatments' cobre a key por paciente.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.treatments.all }),
  })
}

/**
 * Resumo clínico do paciente — carregado assim que o paciente é escolhido, e
 * não quando a Cibelly precisa. Escolher o paciente e iniciar o atendimento
 * são dois momentos separados por alguns segundos; é tempo de sobra para a
 * leitura terminar e o dado já estar quente quando ela for responder.
 *
 * `staleTime` curto (não infinito): o resumo é calculado na hora justamente
 * para não envelhecer, e durante o atendimento nascem procedimentos e
 * documentos que precisam aparecer nele.
 */
export function usePatientClinicalSummary(patientId: string | null) {
  return useQuery({
    queryKey: queryKeys.clinicalSummary.byPatient(patientId ?? ''),
    queryFn: () => getPatientClinicalSummary(patientId ?? ''),
    enabled: Boolean(patientId),
    staleTime: 60_000,
  })
}
