import { supabase } from '@/lib/supabase'
import { getCurrentClinicId } from '@/lib/tenant'
import { isoToBrDate } from '@/utils/date'
import type { PatientDocument } from '@/types/domain'

// Anexos do paciente: o ARQUIVO vive no Storage (bucket privado) e os METADADOS
// na tabela patient_document. Caminho: {clinic_id}/{patient_id}/{uuid}-{arquivo}
// — o 1º segmento (clínica) é o que a policy de storage.objects confere.
const BUCKET = 'patient-documents'
const SIGNED_URL_TTL = 60 * 60 // 1h

/** 1234567 → "1,2 MB" (mesma regra do componente de upload). */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
}

/** 'exames-jun.pdf' → 'PDF'. */
function fileExtension(fileName: string): string {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'ARQ'
}

/** Dados do formulário de upload — o arquivo em si vai junto (bytes + tipo + tamanho). */
export interface NewDocument {
  patientId: string
  name: string
  description?: string
  file: File
}

type DocumentRow = {
  id: string
  clinic_id: string
  patient_id: string
  name: string
  description: string | null
  file_name: string
  mime_type: string | null
  size_bytes: number | null
  storage_path: string
  created_at: string
}

export async function listPatientDocuments(patientId: string): Promise<PatientDocument[]> {
  const { data, error } = await supabase
    .from('patient_document')
    .select('id, clinic_id, patient_id, name, description, file_name, mime_type, size_bytes, storage_path, created_at')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  const rows = data as DocumentRow[]
  if (rows.length === 0) return []

  // URLs assinadas (bucket privado) — uma chamada em lote, ordem preservada.
  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(rows.map(r => r.storage_path), SIGNED_URL_TTL)

  return rows.map((r, i) => ({
    id: r.id,
    clinicId: r.clinic_id,
    patientId: r.patient_id,
    name: r.name,
    description: r.description ?? undefined,
    fileName: r.file_name,
    type: fileExtension(r.file_name),
    size: r.size_bytes != null ? formatSize(Number(r.size_bytes)) : '—',
    uploadedAt: isoToBrDate(r.created_at) ?? '',
    url: signed?.[i]?.signedUrl ?? undefined,
  }))
}

/** Envia o arquivo ao Storage e registra os metadados. */
export async function addDocument(payload: NewDocument): Promise<void> {
  const clinicId = getCurrentClinicId()
  const path = `${clinicId}/${payload.patientId}/${crypto.randomUUID()}-${payload.file.name}`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, payload.file)
  if (uploadError) throw uploadError

  const { error } = await supabase.from('patient_document').insert({
    clinic_id: clinicId,
    patient_id: payload.patientId,
    name: payload.name,
    description: payload.description ?? null,
    file_name: payload.file.name,
    mime_type: payload.file.type || null,
    size_bytes: payload.file.size,
    storage_path: path,
  })
  // Falhou o metadado? não deixa o objeto órfão no Storage.
  if (error) {
    await supabase.storage.from(BUCKET).remove([path])
    throw error
  }
}

/** Atualiza nome/descrição de um documento (o arquivo não muda). */
export async function updateDocument(id: string, payload: { name: string; description?: string }): Promise<void> {
  const { error } = await supabase
    .from('patient_document')
    .update({ name: payload.name, description: payload.description ?? null })
    .eq('id', id)
  if (error) throw error
}

/** Exclui o documento: remove o objeto do Storage e depois o registro. */
export async function removeDocument(id: string): Promise<void> {
  const { data, error } = await supabase.from('patient_document').select('storage_path').eq('id', id).single()
  if (error) throw error
  await supabase.storage.from(BUCKET).remove([data.storage_path])
  const { error: delError } = await supabase.from('patient_document').delete().eq('id', id)
  if (delError) throw delError
}
