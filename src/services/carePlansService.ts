import { signAssetUrls } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import { isoToBrDate } from '@/utils/date'

/**
 * PLANO DE TRATAMENTO (fisioterapia).
 *
 * O plano NÃO duplica o prontuário: diagnóstico, achados, anamnese, testes,
 * peso e altura continuam presos ao paciente. O que ele guarda de próprio são
 * os dois RETRATOS — como começou e como terminou —, congelados no servidor.
 *
 * Congelar em vez de calcular: se a comparação saísse dos registros vivos,
 * editar um teste antigo reescreveria a alta retroativamente. Alta é documento.
 */

export interface SnapshotMedidas { peso?: number; altura?: number; imc?: number }

export interface SnapshotVitais {
  em?: string
  sistolica?: number; diastolica?: number
  fc?: number; fr?: number; spo2?: number; temperatura?: number
}

export interface SnapshotTeste {
  testeId: string
  teste: string
  em?: string
  score?: number
  nivel?: string
}

export interface CarePlanSnapshot {
  em?: string
  medidas: SnapshotMedidas
  vitais?: SnapshotVitais
  testes: SnapshotTeste[]
}

export interface CarePlan {
  id: string
  /** Como a equipe chama o caso. Ausente nos planos anteriores ao campo. */
  titulo?: string
  foto?: string
  inicioIso: string
  inicio: string
  fimIso?: string
  fim?: string
  sessoesPrevistas?: number
  /** Consultas do plano com status `completed` — contagem, não contador. */
  sessoesRealizadas: number
  sessoesAgendadas: number
  /** `undefined` quando não há previsão fechada. Nunca negativo. */
  sessoesRestantes?: number
  status: 'active' | 'finished' | 'canceled'
  /**
   * Etapa da abertura guiada: 0 diagnóstico · 1 anamnese · 2 testes · 3 pronta.
   * Persistida no plano — recarregar a página não reinicia a abertura.
   */
  etapaAbertura: number
  profissional?: string
  /** Texto livre da ÚLTIMA etapa do roteiro de abertura (ver TreatmentWizard) —
   *  contraparte de `altaObservacao`, que é da alta. */
  observacaoAbertura?: string
  altaObservacao?: string
  diagnosticos: string[]
  baseline?: CarePlanSnapshot
  discharge?: CarePlanSnapshot
  /** De quem é o tratamento. Só vem na listagem da CLÍNICA — na do paciente
   *  seria repetir em todo cartão o nome que já está no topo da tela. */
  pacienteId?: string
  paciente?: string
}

type RawSnapshot = {
  em?: string
  medidas?: { peso?: number | string; altura?: number | string; imc?: number | string }
  sinais_vitais?: {
    em?: string
    sistolica?: number; diastolica?: number
    fc?: number; fr?: number; spo2?: number; temperatura?: number | string
  } | null
  testes?: { teste_id: string; teste: string; em?: string; score?: number | string; nivel?: string }[]
} | null

type Raw = {
  id: string
  title: string | null
  photo_url: string | null
  started_on: string
  finished_on: string | null
  planned_sessions: number | null
  setup_step: number
  done_sessions: number
  scheduled_sessions: number
  remaining_sessions: number | null
  status: string
  professional: string | null
  opening_notes: string | null
  discharge_notes: string | null
  diagnoses: string[]
  baseline: RawSnapshot
  discharge: RawSnapshot
  patient_id?: string
  patient_name?: string | null
}

const n = (v: number | string | null | undefined): number | undefined =>
  v == null ? undefined : Number(v)

function toSnapshot(r: RawSnapshot): CarePlanSnapshot | undefined {
  if (!r) return undefined
  return {
    em: r.em,
    medidas: {
      peso: n(r.medidas?.peso),
      altura: n(r.medidas?.altura),
      imc: n(r.medidas?.imc),
    },
    vitais: r.sinais_vitais
      ? { ...r.sinais_vitais, temperatura: n(r.sinais_vitais.temperatura) }
      : undefined,
    testes: (r.testes ?? []).map(t => ({
      testeId: t.teste_id,
      teste: t.teste,
      em: t.em,
      score: n(t.score),
      nivel: t.nivel,
    })),
  }
}

function toPlan(r: Raw): CarePlan {
  return {
    id: r.id,
    titulo: r.title ?? undefined,
    foto: r.photo_url ?? undefined,
    inicioIso: r.started_on,
    inicio: isoToBrDate(r.started_on) ?? '—',
    fimIso: r.finished_on ?? undefined,
    fim: isoToBrDate(r.finished_on),
    sessoesPrevistas: r.planned_sessions ?? undefined,
    sessoesRealizadas: Number(r.done_sessions ?? 0),
    sessoesAgendadas: Number(r.scheduled_sessions ?? 0),
    sessoesRestantes: r.remaining_sessions ?? undefined,
    status: r.status as CarePlan['status'],
    etapaAbertura: Number(r.setup_step ?? 3),
    profissional: r.professional ?? undefined,
    observacaoAbertura: r.opening_notes ?? undefined,
    altaObservacao: r.discharge_notes ?? undefined,
    diagnosticos: r.diagnoses ?? [],
    baseline: toSnapshot(r.baseline),
    discharge: toSnapshot(r.discharge),
    pacienteId: r.patient_id,
    paciente: r.patient_name ?? undefined,
  }
}

export async function listCarePlans(patientId: string): Promise<CarePlan[]> {
  const { data, error } = await supabase.rpc('patient_care_plans', { p_patient: patientId })
  if (error) throw error

  // A foto do plano é um PATH do bucket privado; sem assinar, o `<img>` do
  // cartão nasce quebrado.
  const planos = (data as unknown as Raw[]).map(toPlan)
  const assinadas = await signAssetUrls(planos.map(p => p.foto))
  for (const p of planos) p.foto = p.foto ? assinadas.get(p.foto) : undefined
  return planos
}

export interface NovoCarePlan {
  patientId: string
  titulo?: string
  /** ISO (aaaa-mm-dd). Padrão: hoje. */
  inicioIso?: string
  sessoesPrevistas?: number
  professionalId?: string | null
  fotoUrl?: string | null
}

/** Cria e congela o retrato inicial. A clínica sai do PACIENTE, no servidor. */
export async function createCarePlan(p: NovoCarePlan): Promise<string> {
  const { data, error } = await supabase.rpc('create_care_plan', {
    p_patient: p.patientId,
    p_title: p.titulo?.trim() || undefined,
    // `undefined` e não `null`: omitir a chave deixa o DEFAULT do SQL valer
    // (current_date no início). Mandar null sobrescreveria o default com nulo.
    p_started_on: p.inicioIso ?? undefined,
    p_planned_sessions: p.sessoesPrevistas ?? undefined,
    p_professional: p.professionalId ?? undefined,
    p_photo_url: p.fotoUrl ?? undefined,
  })
  if (error) throw new Error(error.message)
  return data as unknown as string
}

/** Dá alta e congela o retrato final. */
export async function finishCarePlan(planId: string, observacao?: string): Promise<void> {
  const { error } = await supabase.rpc('finish_care_plan', {
    p_plan: planId,
    p_notes: observacao?.trim() || undefined,
    p_finished_on: undefined,
  })
  if (error) throw new Error(error.message)
}

/** Troca a foto do tratamento. `photo_url` já está no GRANT de update. */
export async function setCarePlanPhoto(planId: string, url: string | null): Promise<void> {
  const { data, error } = await supabase
    .from('care_plan')
    .update({ photo_url: url })
    .eq('id', planId)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Sem permissão para alterar a foto do tratamento.')
}

/** Grava as observações da abertura — última etapa do TreatmentWizard.
 *  `opening_notes` já está no GRANT de update. */
export async function setCarePlanOpeningNotes(planId: string, texto: string | null): Promise<void> {
  const { data, error } = await supabase
    .from('care_plan')
    .update({ opening_notes: texto })
    .eq('id', planId)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Sem permissão para alterar as observações do tratamento.')
}

/** Liga uma consulta ao plano — é daqui que sai "sessões realizadas". */
export async function linkAppointmentToPlan(appointmentId: string, planId: string | null): Promise<void> {
  const { data, error } = await supabase
    .from('appointment')
    .update({ care_plan_id: planId })
    .eq('id', appointmentId)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Sem permissão para vincular esta consulta ao tratamento.')
}
