import { MOCK_GRADE_SESSOES } from '@/mocks/gradeSessoes'
import type { ScheduleSlot } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('grade_sessoes')… mantendo a MESMA assinatura.
export async function listGradeSessoes(): Promise<ScheduleSlot[]> {
  return MOCK_GRADE_SESSOES
}

/** Dados do modal de agendamento (criação e edição usam o mesmo shape). */
export type EditScheduleSlot = Omit<ScheduleSlot, 'id'>

let proximoId = 100

export async function addGradeSessao(dados: EditScheduleSlot): Promise<void> {
  MOCK_GRADE_SESSOES.push({ id: `g${proximoId++}`, ...dados })
}

export async function updateGradeSessao(id: string, dados: EditScheduleSlot): Promise<void> {
  const sessao = MOCK_GRADE_SESSOES.find(s => s.id === id)
  if (sessao) Object.assign(sessao, dados)
}
