import { MOCK_TAREFAS } from '@/mocks/tarefas'
import type { PrioridadeTarefa, StatusTarefa, Tarefa } from '@/types/domain'

/** Dados do formulário de nova tarefa (o resto — id, status — nasce aqui). */
export interface NovaTarefa {
  titulo: string
  prioridade: PrioridadeTarefa
  prazo?: string   // dd/mm
}

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('tarefas')… mantendo a MESMA assinatura.
export async function listTarefas(): Promise<Tarefa[]> {
  return MOCK_TAREFAS
}

// Contador de id do mock — no Supabase o id virá do banco.
let proximoId = 100

/** Cria uma tarefa nova (entra como "a fazer"). */
export async function addTarefa(dados: NovaTarefa): Promise<void> {
  MOCK_TAREFAS.push({ id: `t${proximoId++}`, status: 'a_fazer', ...dados })
}

/** Move a tarefa de coluna/estado (mock: muta o array em memória). */
export async function setStatusTarefa(id: string, status: StatusTarefa): Promise<void> {
  const tarefa = MOCK_TAREFAS.find(t => t.id === id)
  if (tarefa) tarefa.status = status
}
