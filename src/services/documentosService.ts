import { MOCK_DOCUMENTOS } from '@/mocks/documentos'
import type { PatientDocument } from '@/types/domain'

/** Dados do formulário de upload (id e data de envio nascem aqui). */
export interface NewDocument {
  pacienteId: string
  nome: string
  descricao?: string
  arquivo: string
  tipo: string
  tamanho: string
  url?: string
}

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.storage + tabela 'documentos', mesma assinatura.
export async function listDocumentosDoPaciente(pacienteId: string): Promise<PatientDocument[]> {
  return MOCK_DOCUMENTOS.filter(d => d.pacienteId === pacienteId)
}

// Contador de id do mock — no Supabase o id virá do banco.
let proximoId = 100

/** Registra um documento enviado (mock: em memória; arquivo vive como object URL). */
export async function addDocumento(dados: NewDocument): Promise<void> {
  const hoje = new Date()
  const enviadoEm = hoje.toLocaleDateString('pt-BR')
  MOCK_DOCUMENTOS.unshift({ id: `d${proximoId++}`, enviadoEm, ...dados })
}

/** Atualiza nome/descrição de um documento. */
export async function updateDocumento(id: string, dados: { nome: string; descricao?: string }): Promise<void> {
  const documento = MOCK_DOCUMENTOS.find(d => d.id === id)
  if (documento) Object.assign(documento, dados)
}

/** Exclui um documento (mock: remove do array em memória). */
export async function removeDocumento(id: string): Promise<void> {
  const indice = MOCK_DOCUMENTOS.findIndex(d => d.id === id)
  if (indice >= 0) MOCK_DOCUMENTOS.splice(indice, 1)
}
