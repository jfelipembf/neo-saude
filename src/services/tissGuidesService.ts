import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { isoToBrDate, toIsoDate } from '@/utils/date'
import type { ClientInsert, Insert } from '@/lib/db'
import type { TissGuide, TissGuideProcedure } from '@/types/domain'

/**
 * GUIAS TISS — camada 2.
 *
 * ⚠️ A guia é DOCUMENTO, não consulta. Enquanto é rascunho ela lê o cadastro ao
 * vivo (e por isso as pendências mudam quando alguém completa um campo); na
 * EMISSÃO os dados são copiados para as colunas `frozen_*` e param de mudar.
 *
 * Corrigir o CBO do profissional em março não pode reescrever a guia enviada em
 * janeiro: a operadora tem a versão dela, e divergir dela é glosa que ninguém
 * consegue explicar depois.
 */

const GUIDE_COLUMNS = 'id, clinic_id, code, kind, status, insurance_id, patient_id, professional_id, appointment_id, treatment_session_id, served_on, issued_on, consultation_type, accident_indication, notes, total, frozen_provider_code, frozen_cnes, frozen_insurance_ans, frozen_patient_name, frozen_patient_card, frozen_patient_cns, frozen_professional_name, frozen_council, frozen_council_number, frozen_council_state, frozen_cbo'

const PROCEDURE_COLUMNS =
  'id, clinic_id, guide_id, service_id, tuss_table, tuss_code, description, quantity, unit_price, amount, sort_order'

type GuideRow = Record<string, unknown>
type ProcedureRow = Record<string, unknown>

function toProcedure(row: ProcedureRow): TissGuideProcedure {
  return {
    id: row.id as string,
    guideId: row.guide_id as string,
    serviceId: (row.service_id as string | null) ?? undefined,
    tussTable: row.tuss_table as string,
    tussCode: row.tuss_code as string,
    description: row.description as string,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    amount: Number(row.amount),
  }
}

function toGuide(row: GuideRow, procedimentos: TissGuideProcedure[]): TissGuide {
  return {
    id: row.id as string,
    clinicId: row.clinic_id as string,
    code: row.code as string,
    kind: row.kind as TissGuide['kind'],
    status: row.status as TissGuide['status'],
    insuranceId: row.insurance_id as string,
    patientId: row.patient_id as string,
    professionalId: row.professional_id as string,
    appointmentId: (row.appointment_id as string | null) ?? undefined,
    treatmentSessionId: (row.treatment_session_id as string | null) ?? undefined,
    servedOn: isoToBrDate(row.served_on as string) ?? '',
    servedOnIso: row.served_on as string,
    issuedOn: isoToBrDate(row.issued_on as string | null),
    consultationType: (row.consultation_type as number | null) ?? undefined,
    accidentIndication: Number(row.accident_indication ?? 0),
    notes: (row.notes as string | null) ?? undefined,
    total: Number(row.total ?? 0),
    frozen: {
      providerCode: (row.frozen_provider_code as string | null) ?? undefined,
      cnes: (row.frozen_cnes as string | null) ?? undefined,
      insuranceAns: (row.frozen_insurance_ans as string | null) ?? undefined,
      patientName: (row.frozen_patient_name as string | null) ?? undefined,
      patientCard: (row.frozen_patient_card as string | null) ?? undefined,
      patientCns: (row.frozen_patient_cns as string | null) ?? undefined,
      professionalName: (row.frozen_professional_name as string | null) ?? undefined,
      council: (row.frozen_council as string | null) ?? undefined,
      councilNumber: (row.frozen_council_number as string | null) ?? undefined,
      councilState: (row.frozen_council_state as string | null) ?? undefined,
      cbo: (row.frozen_cbo as string | null) ?? undefined,
    },
    procedimentos,
  }
}

/** As guias da clínica, da mais recente para a mais antiga. */
export async function listTissGuides(): Promise<TissGuide[]> {
  const clinicId = getCurrentClinicId()
  const { data, error } = await supabase
    .from('tiss_guide')
    .select(GUIDE_COLUMNS)
    .eq('clinic_id', clinicId)
    .order('served_on', { ascending: false })
  if (error) throw error

  const guias = (data ?? []) as GuideRow[]
  if (guias.length === 0) return []

  const { data: procs, error: procError } = await supabase
    .from('tiss_guide_procedure')
    .select(PROCEDURE_COLUMNS)
    .eq('clinic_id', clinicId)
    .in('guide_id', guias.map(g => g.id as string))
    .order('sort_order')
  if (procError) throw procError

  const porGuia = new Map<string, TissGuideProcedure[]>()
  for (const p of (procs ?? []) as ProcedureRow[]) {
    const proc = toProcedure(p)
    porGuia.set(proc.guideId, [...(porGuia.get(proc.guideId) ?? []), proc])
  }

  return guias.map(g => toGuide(g, porGuia.get(g.id as string) ?? []))
}

export interface NovaGuia {
  insuranceId: string
  patientId: string
  professionalId: string
  /** aaaa-mm-dd */
  servedOnIso?: string
  appointmentId?: string
  consultationType?: number
  procedimentos: {
    serviceId?: string
    tussTable: string
    tussCode: string
    description: string
    quantity: number
    unitPrice: number
  }[]
}

/** Cria a guia como RASCUNHO — nada é congelado ainda. */
export async function addTissGuide(nova: NovaGuia): Promise<string> {
  const clinicId = getCurrentClinicId()
  const total = nova.procedimentos.reduce((s, p) => s + p.unitPrice * p.quantity, 0)

  // `code` sai do trigger tr_code (GUI-000001), por isso ClientInsert o omite —
  // mandar do navegador seria deixar o cliente escolher a numeração da guia.
  const row: ClientInsert<'tiss_guide'> = {
    clinic_id: clinicId,
    insurance_id: nova.insuranceId,
    patient_id: nova.patientId,
    professional_id: nova.professionalId,
    appointment_id: nova.appointmentId ?? null,
    served_on: nova.servedOnIso ?? toIsoDate(new Date()),
    consultation_type: nova.consultationType ?? null,
    total,
  }
  const { data, error } = await supabase
    .from('tiss_guide')
    .insert(row as Insert<'tiss_guide'>)
    .select('id')
    .single()
  if (error) throw error
  const guideId = (data as { id: string }).id

  if (nova.procedimentos.length) {
    const { error: procError } = await supabase.from('tiss_guide_procedure').insert(
      nova.procedimentos.map((p, i) => ({
        clinic_id: clinicId,
        guide_id: guideId,
        service_id: p.serviceId ?? null,
        tuss_table: p.tussTable,
        tuss_code: p.tussCode,
        description: p.description,
        quantity: p.quantity,
        unit_price: p.unitPrice,
        amount: p.unitPrice * p.quantity,
        sort_order: i,
      })),
    )
    if (procError) throw procError
  }

  return guideId
}

/** O que é copiado para a guia no momento da emissão. */
export interface DadosCongelados {
  providerCode?: string
  cnes?: string
  insuranceAns?: string
  patientName: string
  patientCard: string
  patientCns?: string
  professionalName: string
  council?: string
  councilNumber?: string
  councilState?: string
  cbo?: string
}

/**
 * EMITE a guia: carimba a data e CONGELA o cadastro dentro dela.
 *
 * O congelamento não é cache — é o ponto em que a guia deixa de ser uma visão do
 * cadastro e passa a ser o documento que a operadora recebeu. O CHECK
 * `tiss_guide_issued_shape_ck` recusa emissão sem os dados copiados, então não
 * existe guia emitida que volte a depender do cadastro.
 */
export async function issueTissGuide(id: string, dados: DadosCongelados): Promise<void> {
  const { error } = await supabase
    .from('tiss_guide')
    .update({
      status: 'issued',
      issued_on: toIsoDate(new Date()),
      frozen_provider_code: dados.providerCode ?? null,
      frozen_cnes: dados.cnes ?? null,
      frozen_insurance_ans: dados.insuranceAns ?? null,
      frozen_patient_name: dados.patientName,
      frozen_patient_card: dados.patientCard,
      frozen_patient_cns: dados.patientCns ?? null,
      frozen_professional_name: dados.professionalName,
      frozen_council: dados.council ?? null,
      frozen_council_number: dados.councilNumber ?? null,
      frozen_council_state: dados.councilState ?? null,
      frozen_cbo: dados.cbo ?? null,
    })
    .eq('id', id)
  if (error) throw error
}

/** Guia emitida se CANCELA, não some: o rastro do que foi enviado à operadora é
 *  o que sustenta uma contestação de glosa. Rascunho pode ser apagado. */
export async function cancelTissGuide(id: string): Promise<void> {
  const { error } = await supabase.from('tiss_guide').update({ status: 'canceled' }).eq('id', id)
  if (error) throw error
}

export async function deleteTissGuideDraft(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('tiss_guide')
    .delete()
    .eq('id', id)
    .eq('status', 'draft')
    .select('id')
  if (error) throw error
  // Zero linhas = a política recusou (guia já emitida). Ver deleteTreatment:
  // PostgREST devolve sucesso com zero linhas, e sem conferir a tela anunciaria
  // uma exclusão que não aconteceu.
  if (!data?.length) throw new Error('Só rascunho pode ser apagado. Guia emitida se cancela.')
}
