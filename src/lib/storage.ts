import { supabase, isMockMode } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'

/** Bucket PRIVADO das imagens da clínica (logo, avatar, fotos de material/sala).
 *  É privado por isolamento de tenant: a policy de leitura só libera os arquivos
 *  da própria clínica, então a URL é ASSINADA (não pública). */
const BUCKET = 'clinic-assets'

/** Validade da URL assinada. 1h como os documentos do paciente — o React Query
 *  refaz a query (e re-assina) muito antes disso na navegação normal. */
const SIGNED_URL_TTL = 60 * 60

/** Extensão do arquivo (jpg/png/webp…) — para o nome no Storage. */
function fileExtension(name: string): string {
  const ext = name.split('.').pop()
  return ext && ext.length <= 5 ? ext.toLowerCase() : 'img'
}

/**
 * Sobe uma imagem e devolve o PATH persistido no Storage (não a URL).
 *
 * - Modo mock (sem .env): cai no `createObjectURL` — preview só na sessão. Como
 *   o valor guardado é uma URL blob:, `signAssetUrl` a devolve intacta.
 * - Modo real: grava em `clinic-assets/{clinic_id}/{folder}/{uuid}.{ext}` (a
 *   policy exige que a 1ª pasta seja a clínica do usuário) e devolve o PATH;
 *   a leitura assina esse path na hora de exibir.
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

  return path
}

/**
 * Assina UM path do bucket para exibição (`<img src>`). Passa direto valores que
 * já são URL (mock blob:, http externo, data URI) e vazios — só um path relativo
 * do Storage é assinado. Falha de assinatura vira undefined (imagem some, não
 * quebra a tela).
 */
export async function signAssetUrl(pathOrUrl: string | null | undefined): Promise<string | undefined> {
  if (!pathOrUrl) return undefined
  if (/^(https?:|blob:|data:)/.test(pathOrUrl)) return pathOrUrl
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(pathOrUrl, SIGNED_URL_TTL)
  return data?.signedUrl ?? undefined
}

/**
 * Assina VÁRIOS paths de uma vez (listas). Devolve um mapa path→URL assinada;
 * valores que já são URL passam direto. Uma chamada de rede para o lote, como
 * faz o extrato de documentos do paciente.
 */
export async function signAssetUrls(paths: (string | null | undefined)[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  for (const p of paths) {
    if (p && /^(https?:|blob:|data:)/.test(p)) map.set(p, p)
  }
  const toSign = [...new Set(paths.filter((p): p is string =>
    typeof p === 'string' && p !== '' && !/^(https?:|blob:|data:)/.test(p)))]
  if (toSign.length === 0) return map
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(toSign, SIGNED_URL_TTL)
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) map.set(row.path, row.signedUrl)
  }
  return map
}
