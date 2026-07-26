import { supabase } from '@/lib/supabase'
import { getCurrentProfessionalId } from '@/services/professionalsService'
import type { Json } from '@/types/database.types'

/**
 * FICHA CORRENTE do odontograma — o estado ATUAL da boca de um paciente
 * (tabela patient_odontogram, 1–1 com o paciente, sobrescrevível).
 *
 * NÃO confundir com o odontograma do PROCEDIMENTO: aquele mora em
 * treatment_session_odontogram, é imutável, 1–1 com a sessão, e só nasce pela
 * RPC record_treatment_session (ver treatmentsService.addTreatmentSession) —
 * que, no mesmo commit, cria um nó na timeline do prontuário e chama
 * emit_session_billing. Salvar um exame por aquele caminho fabricaria
 * procedimento-fantasma e mexeria no Financeiro; exame não é ato faturável.
 *
 * O `payload` é o snapshot cru do motor ({version, globals, teeth}), no mesmo
 * formato das duas tabelas de propósito: o front carrega qualquer um dos dois
 * com loadOdontogramState sem tradução.
 */

/** Snapshot do motor + o carimbo de versão usado para detectar escrita concorrente. */
export interface PatientOdontogram {
  payload: Record<string, unknown>
  /** `updated_at` da linha lida — devolver isso no save é o que evita lost update. */
  updatedAt: string
}

export async function getPatientOdontogram(patientId: string): Promise<PatientOdontogram | null> {
  const { data, error } = await supabase
    .from('patient_odontogram')
    .select('payload, updated_at')
    .eq('patient_id', patientId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    payload: (data.payload ?? {}) as Record<string, unknown>,
    updatedAt: data.updated_at,
  }
}

/**
 * HISTÓRICO da ficha — os snapshots imutáveis, um por procedimento gravado.
 *
 * Lista LEVE de propósito: só id, data e descrição, sem o `payload`. A lista
 * inteira é carregada assim que o paciente é escolhido, e o payload de um dia
 * só é lido quando o dentista clica naquele dia. Trazer os payloads junto seria
 * baixar a boca inteira de todas as consultas para mostrar uma régua de datas.
 *
 * Ordenado por `created_at` porque é coluna DESTA tabela: o PostgREST não
 * ordena o nível de cima por coluna de tabela embutida. A ordem que vale para a
 * tela é a de `performed_on`, refeita em marcosPorDia().
 */
export interface OdontogramRevision {
  sessionId: string
  /** 'aaaa-mm-dd' — quando o procedimento foi feito. */
  date: string
  /** ISO completo — quando o snapshot foi gravado. */
  createdAt: string
  description?: string
}

/** Teto de leitura. Uma ficha com mais de 500 procedimentos gravados é caso de
 *  paginar a régua, não de baixar tudo calado — por isso o corte é explícito. */
const MAX_REVISOES = 500

export async function listOdontogramRevisions(patientId: string): Promise<OdontogramRevision[]> {
  const { data, error } = await supabase
    .from('treatment_session_odontogram')
    .select('session_id, created_at, treatment_session!inner(performed_on, description, treatment!inner(patient_id))')
    .eq('treatment_session.treatment.patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(MAX_REVISOES)
  if (error) throw error

  return (data ?? []).map(r => {
    const sessao = r.treatment_session as unknown as { performed_on: string; description: string | null }
    return {
      sessionId: r.session_id,
      date: sessao?.performed_on ?? '',
      createdAt: r.created_at,
      description: sessao?.description ?? undefined,
    }
  })
}

/** O snapshot de um dia, lido sob demanda. Mesmo formato da ficha corrente, então
 *  a tela carrega os dois com loadOdontogramState sem tradução nenhuma. */
export async function getOdontogramRevision(sessionId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from('treatment_session_odontogram')
    .select('payload')
    .eq('session_id', sessionId)
    .maybeSingle()
  if (error) throw error
  return (data?.payload ?? null) as Record<string, unknown> | null
}

/**
 * Grava a ficha corrente. `expectedUpdatedAt` é o carimbo que veio do
 * getPatientOdontogram: se a linha tiver mudado desde então (outra aba, outro
 * profissional), a RPC recusa e este erro sobe — em vez de apagar em silêncio o
 * trabalho de quem salvou primeiro. Ficha nova (paciente sem odontograma ainda)
 * vai sem carimbo.
 *
 * Devolve o novo `updated_at`, para quem chama seguir salvando na sequência sem
 * precisar reler.
 */
export async function savePatientOdontogram(
  patientId: string,
  payload: Record<string, unknown>,
  expectedUpdatedAt?: string | null,
): Promise<string> {
  const { data, error } = await supabase.rpc('save_patient_odontogram', {
    p_patient: patientId,
    p_payload: payload as unknown as Json,
    p_expected_updated_at: expectedUpdatedAt ?? undefined,
  })
  if (error) throw error
  return data as unknown as string
}

/** Uma linha da coluna de Anotações — o achado do dente, já em pt-BR pelo motor. */
export interface ExamFinding {
  tooth: number
  clinical: string
  note: string
}

/**
 * Registra o atendimento no PRONTUÁRIO do paciente (aba Tratamento do perfil).
 *
 * Complementa `savePatientOdontogram`, não substitui: aquele guarda "como a
 * boca está hoje" (uma linha por paciente, sobrescrita); este guarda "como
 * ficou no dia 26" — imutável, auditado (tr_audit cobre treatment e
 * treatment_session) e visível na linha do tempo. Só o segundo responde à
 * pergunta que um conselho faz: "o que foi constatado no dia X?".
 *
 * NÃO gera cobrança: a RPC omite o valor, e com valor nulo a sessão nasce
 * `unbilled`, sem recebível, fora de "A faturar" e fora de Ganhos — garantia do
 * banco, verificada em SQL, não disciplina do front. NUNCA acrescente valor aqui.
 *
 * A sessão nasce num tratamento "Atendimento do dia — dd/mm/aaaa"; depois o
 * dentista reatribui ao tratamento de verdade pelo perfil (moveTreatmentSession),
 * e o guarda-chuva vazio se desfaz sozinho.
 */
export async function recordExamSession(params: {
  patientId: string
  findings: ExamFinding[]
  /** Consumo do atendimento — gravá-lo é o que dispara a baixa de estoque. */
  materials?: { nome: string; quantidade: string; materialId?: string }[]
  odontogram: Record<string, unknown>
  notes?: string
  /** Mesmo token entre retentativas: a RPC é idempotente por ele e não duplica o procedimento. */
  clientToken: string
}): Promise<string> {
  const { patientId, findings, materials, odontogram, notes, clientToken } = params

  const { data, error } = await supabase.rpc('record_exam_session', {
    p_patient: patientId,
    p_description: 'Exame clínico',
    // Autoria pelo login, como addTreatmentSession já faz: se o usuário estiver
    // vinculado a um profissional, é ele quem assina.
    p_professional: (await getCurrentProfessionalId()) ?? undefined,
    p_actions: findings.map(f =>
      `Dente ${f.tooth}: ${f.clinical}${f.note ? ` · ${f.note}` : ''}`.trim(),
    ),
    p_teeth: findings.map(f => String(f.tooth)),
    // A trigger tr_material_stock lê `quantity` (texto) e dá baixa em
    // material.in_stock — por isso o material_id importa: sem ele o consumo
    // fica registrado mas o estoque não mexe.
    p_materials: (materials ?? []).map(m => ({
      material_id: m.materialId ?? null, name: m.nome, quantity: m.quantidade,
    })) as unknown as Json,
    p_odontogram: odontogram as unknown as Json,
    p_notes: notes?.trim() || undefined,
    p_client_token: clientToken,
  })
  if (error) throw error
  return data as unknown as string
}

/** Reatribui um procedimento a outro tratamento do MESMO paciente. */
export async function moveTreatmentSession(sessionId: string, treatmentId: string): Promise<void> {
  const { error } = await supabase.rpc('move_treatment_session', {
    p_session: sessionId,
    p_treatment: treatmentId,
  })
  if (error) throw error
}

/** Resumo clínico enxuto — o que a Cibelly fala quando perguntam do histórico. */
export interface ClinicalSummary {
  paciente: { nome: string; nomeComum?: string; codigo: string; ultimaVisita?: string }
  ultimosAtendimentos: {
    data: string
    descricao?: string
    tratamento?: string
    dentes: string[]
    achados: string[]
    materiais: string[]
  }[]
  documentos: { data: string; tipo: string; titulo: string; numero: string }[]
}

/**
 * Resumo clínico do paciente, calculado na hora.
 *
 * NÃO é campo salvo de propósito: resumo clínico denormalizado envelhece, e a
 * primeira escrita que esquecesse de atualizá-lo faria a assistente afirmar com
 * segurança algo que deixou de ser verdade.
 *
 * Também não usa `patient_treatments`: aquela traz o prontuário inteiro com o
 * snapshot do odontograma de cada sessão (~31 KB por sessão) e a transcrição do
 * ditado, que inclui fala do paciente. Medido no banco: 351 bytes aqui contra
 * 35.657 lá, para o mesmo paciente.
 */
export async function getPatientClinicalSummary(
  patientId: string, limite = 5,
): Promise<ClinicalSummary> {
  const { data, error } = await supabase.rpc('patient_clinical_summary', {
    p_patient: patientId,
    p_limit: limite,
  })
  if (error) throw error
  return data as unknown as ClinicalSummary
}

/** Um atendimento, no mesmo formato de ClinicalSummary.ultimosAtendimentos. */
export type HistoryEntry = ClinicalSummary['ultimosAtendimentos'][number]

/**
 * Busca DIRECIONADA no histórico, por data e/ou dente — o complemento de
 * getPatientClinicalSummary.
 *
 * Aquela função só devolve os 5 atendimentos mais recentes: ótima para "o que
 * fizemos ultimamente?", cega para "o que foi feito no dente 26 em março?" se
 * o paciente teve 5 atendimentos depois daquele. Esta busca no histórico
 * INTEIRO por um filtro, sem depender de estar entre os mais recentes.
 *
 * Pelo menos um filtro é obrigatório: sem `date` nem `tooth` a busca degenera
 * na mesma pergunta de getPatientClinicalSummary, só que mais lenta (sem o
 * cache de staleTime:60s que aquela tem).
 */
export async function searchPatientHistory(
  patientId: string,
  filtro: { date?: string; tooth?: number },
): Promise<HistoryEntry[]> {
  if (!filtro.date && filtro.tooth == null) {
    throw new Error('searchPatientHistory precisa de ao menos um filtro (data ou dente).')
  }
  const { data, error } = await supabase.rpc('patient_clinical_summary_search', {
    p_patient: patientId,
    p_date: filtro.date ?? undefined,
    p_tooth: filtro.tooth ?? undefined,
  })
  if (error) throw error
  return (data ?? []) as unknown as HistoryEntry[]
}
