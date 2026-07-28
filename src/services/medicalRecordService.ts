import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { isoToBrDate } from '@/utils/date'
import { resumoDoHtml } from '@/utils/htmlExcerpt'

/**
 * A EVOLUÇÃO LIVRE DA CONSULTA MÉDICA.
 *
 * Coluna própria (`appointment.medical_record`), separada do SOAP da
 * fisioterapia — ver o comentário da migration. Aqui só a leitura e a gravação;
 * a sanitização do HTML acontece no RichTextEditor, que é quem produz o texto.
 */

export async function getMedicalRecord(appointmentId: string): Promise<string> {
  const { data, error } = await supabase
    .from('appointment')
    .select('medical_record')
    .eq('clinic_id', getCurrentClinicId())
    .eq('id', appointmentId)
    .maybeSingle()
  if (error) throw error
  return (data?.medical_record as string | null) ?? ''
}

export async function saveMedicalRecord(appointmentId: string, html: string): Promise<void> {
  const { data, error } = await supabase
    .from('appointment')
    .update({ medical_record: html.trim() || null })
    .eq('id', appointmentId)
    .select('id')
  if (error) throw error
  // Zero linhas = a RLS recusou. Sem esta conferência a tela diria "salvo" e o
  // médico sairia achando que a evolução foi gravada — o mesmo bug silencioso
  // que já apareceu na exclusão de tratamento.
  if (!data?.length) throw new Error('Não foi possível gravar a evolução desta consulta.')
}

export interface ConsultaAnterior {
  id: string
  /** dd/mm/aaaa */
  data: string
  dataIso: string
  hora: string
  servico: string
  status: string
  /** Primeiras linhas da evolução, sem HTML. Vazio = consulta sem registro. */
  resumo: string
  /** A evolução inteira, em HTML. Quem exibir SANITIZA antes (DOMPurify) — é o
   *  mesmo contrato do RichTextEditor, que sanitiza ao gravar e ao ler. */
  evolucao: string
}

/**
 * O HISTÓRICO DA COLUNA ESQUERDA.
 *
 * Lê `appointment`, e NÃO `patient_clinical_summary`: aquela RPC monta o
 * histórico a partir de `treatment_session` — a tabela do odontograma. Numa
 * clínica de medicina ela está vazia por construção, e a timeline anunciava
 * "primeira consulta deste paciente" para quem já tinha vindo cinco vezes.
 *
 * Traz também a consulta SEM evolução escrita: o paciente esteve aqui, e o
 * médico precisa ver isso mesmo que ninguém tenha digitado nada.
 */
export async function listPatientConsultations(
  patientId: string,
  excetoAppointmentId?: string,
  limite = 10,
): Promise<ConsultaAnterior[]> {
  let consulta = supabase
    .from('appointment')
    .select('id, date, start_time, service, status, medical_record')
    .eq('clinic_id', getCurrentClinicId())
    .eq('patient_id', patientId)
    // Cancelada não é atendimento — não entra no histórico clínico.
    .neq('status', 'canceled')
    .order('date', { ascending: false })
    .order('start_time', { ascending: false })
    .limit(limite)

  if (excetoAppointmentId) consulta = consulta.neq('id', excetoAppointmentId)

  const { data, error } = await consulta
  if (error) throw error

  return (data ?? []).map(a => ({
    id: a.id as string,
    data: isoToBrDate(a.date as string) ?? '',
    dataIso: a.date as string,
    hora: String(a.start_time ?? '').slice(0, 5),
    servico: (a.service as string | null) ?? 'Consulta',
    status: a.status as string,
    resumo: resumoDoHtml(a.medical_record as string | null),
    evolucao: (a.medical_record as string | null) ?? '',
  }))
}
