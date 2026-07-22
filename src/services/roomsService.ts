import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import type { Room } from '@/types/domain'

type RoomRow = { id: string; clinic_id: string; name: string; photo_url: string | null }

/** Dados do formulário de nova sala (id nasce no banco). */
export interface NewRoom {
  name: string
  photo?: string
}

export async function listRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from('room')
    .select('id, clinic_id, name, photo_url')
    .eq('clinic_id', getCurrentClinicId())
    .order('name')
  if (error) throw error
  return (data as RoomRow[]).map(r => ({
    id: r.id,
    clinicId: r.clinic_id,
    name: r.name,
    photo: r.photo_url ?? undefined,
  }))
}

export async function addRoom(payload: NewRoom): Promise<void> {
  const { error } = await supabase
    .from('room')
    .insert({ clinic_id: getCurrentClinicId(), name: payload.name, photo_url: payload.photo ?? null })
  if (error) throw error
}

export async function updateRoom(id: string, payload: NewRoom): Promise<void> {
  const { error } = await supabase
    .from('room')
    .update({ name: payload.name, photo_url: payload.photo ?? null })
    .eq('id', id)
  if (error) throw error
}
