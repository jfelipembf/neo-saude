import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { isoToBrDate } from '@/utils/date'
import { emailToDb, phoneToDb } from '@/utils/text'
import type { WaitingListEntry, WaitingListStatus } from '@/types/domain'

/**
 * LISTA DE ESPERA da agenda.
 *
 * Quem quer ser atendido e não achou horário. É a fila que a recepção percorre
 * quando alguém desmarca — por isso a ordem é a de ENTRADA (`created_at`), e
 * não a alfabética: chegar antes é o único critério que a pessoa entende e não
 * discute.
 */

const ROW_COLUMNS = `
  id, clinic_id, patient_id, insurance_id, email, mobile_phone, home_phone,
  notes, status, appointment_id, resolved_at, created_at,
  patient:patient_id ( name ),
  insurance:insurance_id ( name )
`

type Row = {
  id: string
  clinic_id: string
  patient_id: string
  insurance_id: string | null
  email: string | null
  mobile_phone: string | null
  home_phone: string | null
  notes: string | null
  status: WaitingListStatus
  appointment_id: string | null
  resolved_at: string | null
  created_at: string
  patient: { name: string } | null
  insurance: { name: string } | null
}

function toEntry(r: Row): WaitingListEntry {
  return {
    id: r.id,
    clinicId: r.clinic_id,
    patientId: r.patient_id,
    // Nome vem do JOIN e não é gravado aqui: o paciente é o mesmo registro, e
    // congelar o nome faria a fila mostrar o nome de solteira depois do
    // casamento. Só o CONTATO é copiado (ver o comentário da migration).
    patientName: r.patient?.name ?? '—',
    insuranceId: r.insurance_id ?? undefined,
    insuranceName: r.insurance?.name,
    email: r.email ?? undefined,
    mobilePhone: r.mobile_phone ?? undefined,
    homePhone: r.home_phone ?? undefined,
    notes: r.notes ?? undefined,
    status: r.status,
    appointmentId: r.appointment_id ?? undefined,
    createdAt: isoToBrDate(r.created_at) ?? '',
  }
}

/** Quem ainda espera, na ordem em que entrou. */
export async function listWaitingList(): Promise<WaitingListEntry[]> {
  const { data, error } = await supabase
    .from('waiting_list')
    .select(ROW_COLUMNS)
    .eq('status', 'waiting')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as unknown as Row[]).map(toEntry)
}

export interface NewWaitingListEntry {
  patientId: string
  insuranceId?: string
  email?: string
  mobilePhone?: string
  homePhone?: string
  notes?: string
}

/**
 * Põe alguém na fila.
 *
 * O índice parcial `waiting_list_um_por_paciente_idx` recusa o mesmo paciente
 * duas vezes enquanto ele estiver esperando — a recepção trabalha com várias
 * abas abertas, e checar antes na tela só reduz a chance, não elimina.
 */
export async function addToWaitingList(payload: NewWaitingListEntry): Promise<void> {
  const { error } = await supabase.from('waiting_list').insert({
    clinic_id: getCurrentClinicId(),
    patient_id: payload.patientId,
    insurance_id: payload.insuranceId || null,
    // Os domínios `email_address` e `phone_digits` recusam lixo no banco —
    // normalizar aqui é o que impede "(79) 9" de virar erro de constraint na
    // cara do usuário em vez de simplesmente não ser gravado.
    email: emailToDb(payload.email),
    mobile_phone: phoneToDb(payload.mobilePhone),
    home_phone: phoneToDb(payload.homePhone),
    notes: payload.notes?.trim() || null,
  })
  if (error) {
    // 23505 = unique_violation. A mensagem do Postgres cita o nome do índice,
    // que não diz nada a quem está na recepção.
    if (error.code === '23505') throw new Error('Este paciente já está na lista de espera.')
    throw error
  }
}

export async function updateWaitingListEntry(
  id: string,
  payload: Omit<NewWaitingListEntry, 'patientId'>,
): Promise<void> {
  const { data, error } = await supabase
    .from('waiting_list')
    .update({
      insurance_id: payload.insuranceId || null,
      email: emailToDb(payload.email),
      mobile_phone: phoneToDb(payload.mobilePhone),
      home_phone: phoneToDb(payload.homePhone),
      notes: payload.notes?.trim() || null,
    })
    .eq('id', id)
    .select('id')
  if (error) throw error
  // PostgREST devolve sucesso com ZERO linhas quando a RLS não casa — sem esta
  // conferência a tela diria "salvo" sobre uma escrita que não aconteceu.
  if (!data?.length) throw new Error('Sem permissão para alterar esta entrada.')
}

/**
 * Tira da fila. `scheduled` quando virou consulta, `canceled` quando desistiu —
 * a linha NÃO é apagada: é ela que responde "quanto tempo o paciente esperou?"
 * e "quantos desistiram?", que é o que justifica abrir mais horário.
 */
export async function resolveWaitingListEntry(
  id: string,
  status: Exclude<WaitingListStatus, 'waiting'>,
  appointmentId?: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('waiting_list')
    .update({
      status,
      appointment_id: appointmentId ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Sem permissão para alterar esta entrada.')
}
