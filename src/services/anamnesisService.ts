import { MOCK_ANAMNESIS } from '@/mocks/anamnesis'
import type { Anamnesis } from '@/types/domain'
import { CURRENT_CLINIC, type ClientPayload } from '@/lib/tenant'

// TODO(neoSaúde) — BLOQUEADO por incompatibilidade de modelo (segue em MOCK):
// O domínio `Anamnesis` é um objeto PLANO de campos fixos (medications, allergy,
// bloodPressure, …), mas o banco modela a anamnese como QUESTIONÁRIO DINÂMICO
// (anamnesis_template → section → question → answer) e as RPCs trabalham por
// CÓDIGO de pergunta: `save_anamnesis(p_patient, p_answers jsonb {codigo: valor})`
// e `patient_anamnesis(p_patient)` (devolve template + record + archived_count).
// Ligar isto exige um DE-PARA campo-plano ↔ código-de-pergunta (ou migrar o
// front para o shape dinâmico) — decisão de produto. Até lá, mock.
// Cópias ({ ...mock }) para o cache do TanStack Query não apontar para o objeto
// mutável (senão salvar não re-renderiza quem assina a query).

/** Ficha do paciente — `null` quando ele ainda não respondeu. */
export async function getPatientAnamnesis(patientId: string): Promise<Anamnesis | null> {
  const record = MOCK_ANAMNESIS.find(a => a.patientId === patientId)
  return record ? { ...record } : null
}

/** Campos editáveis: tudo menos a chave e a data (que é carimbada ao salvar). */
export type EditAnamnesis = Omit<ClientPayload<Anamnesis>, 'patientId' | 'updatedAt'>

/** Cria ou substitui a ficha do paciente, carimbando a data de atualização. */
export async function saveAnamnesis(patientId: string, payload: EditAnamnesis): Promise<void> {
  const today = new Date().toLocaleDateString('pt-BR')
  const index = MOCK_ANAMNESIS.findIndex(a => a.patientId === patientId)
  const record: Anamnesis = { clinicId: CURRENT_CLINIC, patientId, updatedAt: today, ...payload }
  if (index >= 0) MOCK_ANAMNESIS[index] = record
  else MOCK_ANAMNESIS.push(record)
}
