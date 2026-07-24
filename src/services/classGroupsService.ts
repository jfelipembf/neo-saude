import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { isoToBrDate } from '@/utils/date'
import type { ClassGroup } from '@/types/domain'

const hhmm = (t: string) => t.slice(0, 5)

const COLUMNS = 'id, clinic_id, name, professional_id, room_id, weekday, start_time, duration_minutes, max_capacity, start_date, end_date'

type ClassGroupRow = {
  id: string
  clinic_id: string
  name: string
  professional_id: string | null
  room_id: string | null
  weekday: number
  start_time: string
  duration_minutes: number
  max_capacity: number
  start_date: string
  end_date: string | null
}

function toClassGroup(row: ClassGroupRow): ClassGroup {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    professionalId: row.professional_id ?? undefined,
    roomId: row.room_id ?? undefined,
    weekday: row.weekday,
    startTime: hhmm(row.start_time),
    durationMinutes: row.duration_minutes,
    maxCapacity: row.max_capacity,
    startDate: isoToBrDate(row.start_date) ?? row.start_date,
    endDate: isoToBrDate(row.end_date),
  }
}

/** Catálogo de turmas coletivas (Administrativo → Turmas). */
export async function listClassGroups(): Promise<ClassGroup[]> {
  const { data, error } = await supabase
    .from('class_group')
    .select(COLUMNS)
    .eq('clinic_id', getCurrentClinicId())
    .order('name')
  if (error) throw error
  return (data as ClassGroupRow[]).map(toClassGroup)
}

/** Campos do formulário da turma comuns a todos os dias — compartilhados
 *  quando várias sessões nascem juntas na Tab Turmas (ver addClassGroups). */
export interface ClassGroupFields {
  name: string
  professionalId?: string
  roomId?: string
  startTime: string
  durationMinutes: number
  maxCapacity: number
  startDateIso: string
  endDateIso?: string
}

/** Dados do formulário de UMA sessão já existente (id nasce no banco) — ao
 *  contrário da criação, editar troca só o dia DESTA sessão, nunca cria outra. */
export interface EditClassGroup extends ClassGroupFields {
  weekday: number
}

function toRow(payload: EditClassGroup) {
  return {
    name: payload.name,
    professional_id: payload.professionalId ?? null,
    room_id: payload.roomId ?? null,
    weekday: payload.weekday,
    start_time: payload.startTime,
    duration_minutes: payload.durationMinutes,
    max_capacity: payload.maxCapacity,
    start_date: payload.startDateIso,
    end_date: payload.endDateIso ?? null,
  }
}

/** Cria uma sessão (ClassGroup) por dia da semana selecionado — cada uma com
 *  sua própria capacidade/matrícula desde o nascimento (ver comentário do
 *  domain.ts ClassGroup). Retorna os ids criados, na ordem de `weekdays`. */
export async function addClassGroups(fields: ClassGroupFields, weekdays: number[]): Promise<string[]> {
  const clinicId = getCurrentClinicId()
  const rows = weekdays.map(weekday => ({ clinic_id: clinicId, ...toRow({ ...fields, weekday }) }))
  const { data, error } = await supabase.from('class_group').insert(rows).select('id')
  if (error) throw error
  return (data ?? []).map(row => row.id as string)
}

export async function updateClassGroup(id: string, payload: EditClassGroup): Promise<void> {
  const { error } = await supabase.from('class_group').update(toRow(payload)).eq('id', id)
  if (error) throw error
}

export async function deleteClassGroup(id: string): Promise<void> {
  const { error } = await supabase.from('class_group').delete().eq('id', id)
  if (error) throw error
}
