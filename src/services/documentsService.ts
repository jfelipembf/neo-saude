import { MOCK_DOCUMENTS } from '@/mocks/documents'
import type { PatientDocument } from '@/types/domain'
import { CURRENT_CLINIC } from '@/lib/tenant'

/** Dados do formulário de upload (id e data de envio nascem aqui). */
export interface NewDocument {
  patientId: string
  name: string
  description?: string
  fileName: string
  type: string
  size: string
  url?: string
}

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.storage + tabela 'documentos', mesma assinatura.
export async function listPatientDocuments(patientId: string): Promise<PatientDocument[]> {
  return MOCK_DOCUMENTS.filter(d => d.patientId === patientId)
}

// Contador de id do mock — no Supabase o id virá do banco.
let nextId = 100

/** Registra um documento enviado (mock: em memória; arquivo vive como object URL). */
export async function addDocument(payload: NewDocument): Promise<void> {
  const today = new Date()
  const uploadedAt = today.toLocaleDateString('pt-BR')
  MOCK_DOCUMENTS.unshift({ id: `d${nextId++}`, clinicId: CURRENT_CLINIC, uploadedAt, ...payload })
}

/** Atualiza nome/descrição de um documento. */
export async function updateDocument(id: string, payload: { name: string; description?: string }): Promise<void> {
  const doc = MOCK_DOCUMENTS.find(d => d.id === id)
  if (doc) Object.assign(doc, payload)
}

/** Exclui um documento (mock: remove do array em memória). */
export async function removeDocument(id: string): Promise<void> {
  const index = MOCK_DOCUMENTS.findIndex(d => d.id === id)
  if (index >= 0) MOCK_DOCUMENTS.splice(index, 1)
}
