import { supabase } from '@/lib/supabase'

// Prontuário por SESSÃO (aba "Prontuários" do perfil, fisioterapia) — lê o
// que já mora em appointment.clinical_note_html (ver AppointmentModal, que é
// quem escreve). Este service só monta a visão do calendário: quais dias têm
// nota e o conteúdo do dia selecionado.

/** Dias (aaaa-mm-dd) com prontuário não-vazio — alimenta o `markedDates` do Calendar. */
export async function listNoteDates(patientId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('appointment')
    .select('date')
    .eq('patient_id', patientId)
    .not('clinical_note_html', 'is', null)
  if (error) throw error
  return Array.from(new Set((data ?? []).map(row => row.date as string)))
}

export interface DailyClinicalNote {
  appointmentId: string
  date: string
  startTime: string
  activity: string
  html: string
}

/** Prontuário(s) do dia selecionado no calendário. */
export async function getNotesByDate(patientId: string, dateIso: string): Promise<DailyClinicalNote[]> {
  const { data, error } = await supabase
    .from('appointment')
    .select('id, date, start_time, service, clinical_note_html')
    .eq('patient_id', patientId)
    .eq('date', dateIso)
    .not('clinical_note_html', 'is', null)
    .order('start_time')
  if (error) throw error
  return (data ?? []).map(row => ({
    appointmentId: row.id as string,
    date: row.date as string,
    startTime: (row.start_time as string).slice(0, 5),
    activity: row.service as string,
    html: row.clinical_note_html as string,
  }))
}
