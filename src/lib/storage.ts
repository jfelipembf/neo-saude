import { supabase, isMockMode } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'

/** Bucket PÚBLICO das imagens da clínica (logo, avatar, fotos de material/sala). */
const BUCKET = 'clinic-assets'

/** Extensão do arquivo (jpg/png/webp…) — para o nome no Storage. */
function fileExtension(name: string): string {
  const ext = name.split('.').pop()
  return ext && ext.length <= 5 ? ext.toLowerCase() : 'img'
}

/**
 * Sobe uma imagem e devolve a URL PÚBLICA que persiste (Supabase Storage).
 *
 * - Modo mock (sem .env): cai no `createObjectURL` — preview só na sessão.
 * - Modo real: grava em `clinic-assets/{clinic_id}/{folder}/{uuid}.{ext}`
 *   (a policy exige que a 1ª pasta seja a clínica do usuário) e devolve a URL
 *   pública, que sobrevive a reload.
 *
 * @param folder subpasta por entidade — ex.: 'professionals', 'clinic', 'materials'.
 */
export async function uploadImage(file: File, folder: string): Promise<string> {
  if (isMockMode) return URL.createObjectURL(file)

  const clinicId = getCurrentClinicId()
  const path = `${clinicId}/${folder}/${crypto.randomUUID()}.${fileExtension(file.name)}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  })
  if (error) throw error

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
