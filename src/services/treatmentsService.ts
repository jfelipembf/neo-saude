import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { getCurrentProfessionalId } from '@/services/professionalsService'
import { brToIsoDate, isoToBrDate } from '@/utils/date'
import type { Json } from '@/types/database.types'
import type {
  UsedMaterial, ToothStatus, Treatment, TreatmentSession,
  SessionBillingChoice, SessionBillingPreview, SessionBillingStatus,
} from '@/types/domain'

/** Formato cru devolvido por preview_session_billing (jsonb, snake_case). */
type PreviewJson = {
  status: SessionBillingStatus
  quote_id: string | null
  quote_code: string | null
  pending_quote_code: string | null
  due_date: string | null
  installments: {
    installment_number: number; installment_count: number; due_date: string
    gross_amount: number; fee: number; net_amount: number
  }[]
}

/**
 * O tratamento nasce VAZIO (sem odontograma) e recebe PROCEDIMENTOS (sessões)
 * ao longo dos dias — cada procedimento traz descrição, data, o que foi
 * sinalizado no odontograma e os dentes envolvidos.
 */
export interface NewTreatment {
  patientId: string
  procedure: string   // descrição do tratamento
  date: string           // dd/mm/aaaa (início)
}

/** Dados de UM procedimento registrado pelo editor com odontograma. */
export interface NewTreatmentSession {
  description?: string     // nome do procedimento
  /** Quem executou. A tela ainda não tem seletor: quando vem vazio, resolve-se
   *  pelo profissional do usuário logado (ver addTreatmentSession). */
  professionalId?: string
  date: string           // dd/mm/aaaa
  actions: string[]
  teeth?: string[]      // dentes sinalizados (mesclados no tratamento)
  materials?: UsedMaterial[]
  notes?: string
  amount?: number
  odontogram?: Record<string, unknown>
  statusAfter: ToothStatus
  /**
   * O reflexo FINANCEIRO do procedimento, decidido no mesmo diálogo em que se
   * confirma o salvamento. Vazio = caminho padrão (um clique): o banco decide
   * pela escada — coberto por contrato aprovado, convênio ou título novo
   * vencendo no dia do procedimento.
   */
  billing?: SessionBillingChoice
  /**
   * Chave de IDEMPOTÊNCIA da tentativa de salvar. Nasce quando o editor abre e
   * não muda entre retentativas do MESMO procedimento.
   *
   * Existe porque o caso que dobra cobrança não é corrida de banco, é rede: o
   * commit acontece, a resposta se perde, o usuário clica em Salvar de novo — e
   * sem token nascia um segundo procedimento com um segundo título. Com token,
   * a segunda chamada devolve o procedimento da primeira e nada é cobrado duas
   * vezes.
   */
  clientToken?: string
}

// Formato devolvido pela RPC patient_treatments (snake_case).
type SessionJson = {
  id: string
  description: string | null
  performed_on: string
  professional_id: string | null
  amount: number | null
  notes: string | null
  teeth: string[]
  actions: string[]
  materials: { material_id: string | null; name: string; quantity: string }[]
  odontogram: Record<string, unknown> | null
}
type TreatmentJson = {
  id: string
  clinic_id: string
  patient_id: string
  procedure: string
  status: ToothStatus
  started_at: string
  completed_at: string | null
  notes: string | null
  teeth: string[]
  sessions: SessionJson[]
}

function toSession(s: SessionJson): TreatmentSession {
  return {
    id: s.id,
    description: s.description ?? undefined,
    date: isoToBrDate(s.performed_on) ?? '',
    professionalId: s.professional_id ?? undefined,
    teeth: s.teeth ?? [],
    actions: s.actions ?? [],
    materials: (s.materials ?? []).map(m => ({ name: m.name, quantity: m.quantity })),
    notes: s.notes ?? undefined,
    amount: s.amount != null ? Number(s.amount) : undefined,
    odontogram: s.odontogram ?? undefined,
  }
}

function toTreatment(t: TreatmentJson): Treatment {
  return {
    id: t.id,
    clinicId: t.clinic_id,
    patientId: t.patient_id,
    tooth: t.teeth?.length ? t.teeth.join(', ') : undefined,
    procedure: t.procedure,
    status: t.status,
    startedAt: isoToBrDate(t.started_at) ?? '',
    completedAt: isoToBrDate(t.completed_at),
    notes: t.notes ?? undefined,
    sessions: (t.sessions ?? []).map(toSession),
  }
}

export async function listPatientTreatments(patientId: string): Promise<Treatment[]> {
  const { data, error } = await supabase.rpc('patient_treatments', { p_patient: patientId })
  if (error) throw error
  return ((data ?? []) as unknown as TreatmentJson[]).map(toTreatment)
}

/** Cria o tratamento (guarda-chuva) vazio — os procedimentos vêm depois. */
export async function addTreatment(payload: NewTreatment): Promise<void> {
  const { error } = await supabase.from('treatment').insert({
    clinic_id: getCurrentClinicId(),
    patient_id: payload.patientId,
    procedure: payload.procedure,
    status: 'open',
    started_at: brToIsoDate(payload.date) ?? undefined,
  })
  if (error) throw error
}

/**
 * Adiciona um procedimento ao tratamento via RPC transacional
 * `record_treatment_session` (grava sessão + dentes + etapas + materiais +
 * odontograma e atualiza o status do tratamento, tudo numa transação).
 *
 * AUTORIA: a RPC sempre aceitou `p_professional` e o service nunca o enviava —
 * TODA sessão nascia sem profissional, o que apaga produção e comissão. Como o
 * editor de procedimento (TreatmentsPanel) ainda não tem seletor de
 * profissional, a autoria é resolvida pelo USUÁRIO LOGADO: se o login estiver
 * vinculado a um profissional, é ele quem assina. Recepção lançando pelo
 * paciente continua gravando sem profissional (null) — melhor um campo vazio do
 * que atribuir o procedimento a quem não o fez. Um seletor explícito resolve o
 * caso da recepção e é a próxima fatia.
 */
export async function addTreatmentSession(
  treatmentId: string, session: NewTreatmentSession,
): Promise<SessionBillingStatus | null> {
  const performedOn = brToIsoDate(session.date)
  if (!performedOn) throw new Error('Data do procedimento inválida.')
  const professionalId = session.professionalId ?? (await getCurrentProfessionalId()) ?? undefined
  const billing = session.billing ?? {}
  const { data, error } = await supabase.rpc('record_treatment_session', {
    p_treatment: treatmentId,
    p_performed_on: performedOn,
    p_status_after: session.statusAfter,
    p_description: session.description ?? undefined,
    p_professional: professionalId,
    p_amount: session.amount ?? undefined,
    p_notes: session.notes ?? undefined,
    p_teeth: session.teeth ?? [],
    p_actions: session.actions,
    p_materials: (session.materials ?? []).map(m => ({ material_id: null, name: m.name, quantity: m.quantity })) as unknown as Json,
    p_odontogram: (session.odontogram ?? undefined) as unknown as Json | undefined,
    // O DINHEIRO, no mesmo commit. Tudo opcional: omitido, o banco usa o padrão
    // (vencimento = data do procedimento) e decide pela escada.
    p_due_date: brToIsoDate(billing.dueDate) ?? undefined,
    p_not_billable_reason: billing.notBillableReason?.trim() || undefined,
    p_method: billing.method,
    p_acquirer: billing.acquirerId,
    p_installments: billing.installments ?? 1,
    // IDEMPOTÊNCIA: retentativa com o mesmo token devolve o procedimento já
    // gravado em vez de criar outro — e outra cobrança.
    p_client_token: session.clientToken,
  })
  if (error) throw error

  // O QUE ACONTECEU com o dinheiro, lido do banco — não a prévia repetida como
  // se fosse fato. A prévia é uma pergunta sobre o instante em que o diálogo
  // abriu: entre ela e o clique em Salvar a recepção pode ter aprovado um
  // orçamento (a sessão nasce 'covered' e NENHUMA cobrança é criada) ou dado
  // baixa na última parcela dele (a sessão nasce 'billed' e a cobrança EXISTE).
  // Anunciar a prévia como desfecho é a mesma classe de mentira do antigo toast
  // "contrato gerado!". A leitura extra é barata e é a única fonte da verdade.
  const sessionId = data as unknown as string | null
  if (!sessionId) return null
  const { data: row } = await supabase
    .from('treatment_session').select('billing_status').eq('id', sessionId).maybeSingle()
  // Falha na leitura não desfaz o salvamento (a transação já fechou): devolve
  // null e quem chama usa o texto neutro, em vez de inventar um desfecho.
  return (row?.billing_status as SessionBillingStatus | undefined) ?? null
}

/**
 * O que vai acontecer com o dinheiro se este procedimento for salvo agora.
 *
 * Vem do banco, e não de uma cópia da regra em TypeScript, por uma razão de
 * PERMISSÃO: a policy de `receivable` exige a feature 'finance' e quem salva
 * procedimento é o dentista, que normalmente só tem 'patients'. No navegador
 * dele a pergunta "existe contrato aprovado com saldo em aberto?" voltaria
 * sempre vazia — e a tela prometeria cobrança onde o banco vai abater do
 * contrato, ou o contrário. Uma frase errada aqui é combinada com o paciente
 * na boca do dentista.
 */
export async function previewSessionBilling(
  patientId: string,
  amount: number | undefined,
  performedOn: string,          // dd/mm/aaaa
  billing: SessionBillingChoice = {},
): Promise<SessionBillingPreview> {
  const { data, error } = await supabase.rpc('preview_session_billing', {
    p_patient: patientId,
    p_amount: amount,
    p_performed_on: brToIsoDate(performedOn) ?? undefined,
    p_due_date: brToIsoDate(billing.dueDate) ?? undefined,
    p_not_billable_reason: billing.notBillableReason?.trim() || undefined,
    p_method: billing.method,
    p_acquirer: billing.acquirerId,
    p_installments: billing.installments ?? 1,
  })
  if (error) throw error
  const raw = data as unknown as PreviewJson
  return {
    status: raw.status,
    quoteId: raw.quote_id ?? undefined,
    quoteCode: raw.quote_code ?? undefined,
    pendingQuoteCode: raw.pending_quote_code ?? undefined,
    dueDate: isoToBrDate(raw.due_date),
    installments: (raw.installments ?? []).map(i => ({
      number: i.installment_number,
      count: i.installment_count,
      dueDate: isoToBrDate(i.due_date) ?? '',
      grossAmount: Number(i.gross_amount),
      fee: Number(i.fee),
      netAmount: Number(i.net_amount),
    })),
  }
}
