import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { isoToBrDate, toIsoDate } from '@/utils/date'
import { posologiaPorExtenso } from '@/utils/prescriptionDosage'

/**
 * A MEDICAÇÃO DO PACIENTE, com histórico.
 *
 * Suspender, trocar e alterar dose são EVENTOS: cada um fecha o período de uma
 * linha e, quando é o caso, abre outra ligada por `replacedBy`. Nada é
 * sobrescrito — a medicação anterior é o que explica a reação adversa de três
 * meses atrás.
 */

export type MedicationEndReason = 'suspended' | 'dose_changed' | 'replaced'

/** Unidades usadas em prescrição ambulatorial — mg primeiro, que é o caso. */
export const DOSE_UNITS = ['mg', 'g', 'mcg', 'mL', 'UI', 'gotas', 'comprimido(s)']

export interface PatientMedication {
  id: string
  name: string
  /** Posologia por extenso. Nas linhas novas é derivada dos campos abaixo; nas
   *  antigas é o texto livre original. */
  dosage?: string
  doseAmount?: number
  doseUnit?: string
  timesPerDay?: number
  durationDays?: number
  /** Uso contínuo (crônico) × tratamento com prazo. Não confundir com
   *  `endedOn`, que diz se ainda está em uso. */
  continuous: boolean
  /** dd/mm/aaaa */
  startedOn: string
  /** dd/mm/aaaa — ausente = EM USO. */
  endedOn?: string
  endReason?: string
  replacedBy?: string
  professionalId?: string
}

const COLUMNS =
  'id, name, dosage, dose_amount, dose_unit, times_per_day, duration_days, continuous, started_on, ended_on, end_reason, replaced_by, professional_id'

function toMedication(r: Record<string, unknown>): PatientMedication {
  return {
    id: r.id as string,
    name: r.name as string,
    dosage: (r.dosage as string | null) ?? undefined,
    doseAmount: r.dose_amount != null ? Number(r.dose_amount) : undefined,
    doseUnit: (r.dose_unit as string | null) ?? undefined,
    timesPerDay: r.times_per_day != null ? Number(r.times_per_day) : undefined,
    durationDays: r.duration_days != null ? Number(r.duration_days) : undefined,
    continuous: Boolean(r.continuous),
    startedOn: isoToBrDate(r.started_on as string) ?? '',
    endedOn: isoToBrDate(r.ended_on as string | null),
    endReason: (r.end_reason as string | null) ?? undefined,
    replacedBy: (r.replaced_by as string | null) ?? undefined,
    professionalId: (r.professional_id as string | null) ?? undefined,
  }
}

/** Tudo: em uso e encerradas, mais recentes primeiro. Quem quer só as ativas
 *  filtra por `endedOn` ausente — uma busca só evita duas idas ao banco. */
export async function listPatientMedications(patientId: string): Promise<PatientMedication[]> {
  const { data, error } = await supabase
    .from('patient_medication')
    .select(COLUMNS)
    .eq('clinic_id', getCurrentClinicId())
    .eq('patient_id', patientId)
    .order('started_on', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toMedication)
}

export interface NewMedication {
  patientId: string
  appointmentId?: string
  name: string
  doseAmount?: number
  doseUnit?: string
  timesPerDay?: number
  durationDays?: number
  continuous?: boolean
  professionalId?: string
}

export async function addMedication(nova: NewMedication): Promise<string> {
  const { data, error } = await supabase
    .from('patient_medication')
    .insert({
      clinic_id: getCurrentClinicId(),
      patient_id: nova.patientId,
      appointment_id: nova.appointmentId ?? null,
      name: nova.name.trim(),
      // A frase é DERIVADA aqui, uma vez: assim a leitura (tela, receita,
      // impressão) não precisa remontar a posologia em cada lugar — e não há
      // como duas telas escreverem a mesma dose de jeitos diferentes.
      dosage: posologiaPorExtenso({
        dose: nova.doseAmount != null ? `${nova.doseAmount}${nova.doseUnit ?? ''}` : undefined,
        vezesAoDia: nova.timesPerDay,
        dias: nova.durationDays,
        // O selo "contínuo" na lista já diz isso — ver semSufixoContinuo.
        semSufixoContinuo: nova.continuous,
      }) || null,
      dose_amount: nova.doseAmount ?? null,
      dose_unit: nova.doseUnit ?? null,
      times_per_day: nova.timesPerDay ?? null,
      duration_days: nova.durationDays ?? null,
      continuous: nova.continuous ?? false,
      professional_id: nova.professionalId ?? null,
    })
    .select('id')
    .single()
  if (error) throw error
  return (data as { id: string }).id
}

/**
 * SUSPENDE: fecha o período, sem substituta.
 *
 * `ended_on` recebe HOJE e não a data da consulta: suspensão vale do momento em
 * que foi decidida, e antedatar suspensão é reescrever quando o paciente parou
 * de tomar.
 */
export async function suspendMedication(id: string, motivo?: string): Promise<void> {
  const { data, error } = await supabase
    .from('patient_medication')
    .update({
      ended_on: toIsoDate(new Date()),
      end_reason: motivo?.trim() || 'suspended',
    })
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Não foi possível suspender esta medicação.')
}

/**
 * TROCA ou ALTERA DOSE: encerra a atual e abre a nova, ligadas.
 *
 * As duas ações são a mesma operação com nome diferente — mudar a dose é abrir
 * um período novo, não editar o antigo. Manter a linha original intacta é o que
 * permite responder "ele tomava 50mg até quando?".
 */
export async function replaceMedication(params: {
  atualId: string
  patientId: string
  appointmentId?: string
  name: string
  doseAmount?: number
  doseUnit?: string
  timesPerDay?: number
  durationDays?: number
  continuous?: boolean
  professionalId?: string
  motivo: Extract<MedicationEndReason, 'dose_changed' | 'replaced'>
}): Promise<void> {
  const novaId = await addMedication({
    patientId: params.patientId,
    appointmentId: params.appointmentId,
    name: params.name,
    doseAmount: params.doseAmount,
    doseUnit: params.doseUnit,
    timesPerDay: params.timesPerDay,
    durationDays: params.durationDays,
    continuous: params.continuous,
    professionalId: params.professionalId,
  })

  const { data, error } = await supabase
    .from('patient_medication')
    .update({
      ended_on: toIsoDate(new Date()),
      end_reason: params.motivo,
      replaced_by: novaId,
    })
    .eq('id', params.atualId)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Não foi possível encerrar a medicação anterior.')
}

export async function removeMedication(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('patient_medication')
    .delete()
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Não foi possível excluir este registro.')
}
