import { MOCK_TRATAMENTOS } from '@/mocks/tratamentos'
import type { UsedMaterial, ToothStatus, Treatment } from '@/types/domain'

/**
 * O tratamento nasce VAZIO (sem odontograma) e recebe PROCEDIMENTOS (sessões)
 * ao longo dos dias — cada procedimento traz descrição, data, o que foi
 * sinalizado no odontograma e os dentes envolvidos.
 */
export interface NewTreatment {
  pacienteId: string
  procedimento: string   // descrição do tratamento
  data: string           // dd/mm/aaaa (início)
}

/** Dados de UM procedimento registrado pelo editor com odontograma. */
export interface NewTreatmentSession {
  descricao?: string     // nome do procedimento
  data: string           // dd/mm/aaaa
  acoes: string[]
  dentes?: string[]      // dentes sinalizados (mesclados no tratamento)
  materiais?: UsedMaterial[]
  observacao?: string
  /** Valor cobrado pelo procedimento. */
  valor?: number
  /** Snapshot do odontograma (payload do motor) — reabre a ficha marcada. */
  odontograma?: Record<string, unknown>
  /** Situação do tratamento APÓS este procedimento. */
  statusApos: ToothStatus
}

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// viram as tabelas `tratamentos` 1—N `tratamento_sessoes` (mesmas assinaturas).
export async function listTratamentosDoPaciente(pacienteId: string): Promise<Treatment[]> {
  return MOCK_TRATAMENTOS.filter(t => t.pacienteId === pacienteId)
}

// Contadores de id do mock — no Supabase os ids virão do banco.
let proximoId = 100
let proximaSessaoId = 100

/** Cria o tratamento (guarda-chuva) vazio — os procedimentos vêm depois. */
export async function addTratamento(dados: NewTreatment): Promise<void> {
  MOCK_TRATAMENTOS.unshift({
    id: `t${proximoId++}`,
    pacienteId: dados.pacienteId,
    procedimento: dados.procedimento,
    status: 'em_aberto',
    iniciadoEm: dados.data,
    sessoes: [],
  })
}

/** Adiciona um procedimento ao tratamento (dias diferentes, mesmo tratamento). */
export async function addSessaoTratamento(tratamentoId: string, sessao: NewTreatmentSession): Promise<void> {
  const tratamento = MOCK_TRATAMENTOS.find(t => t.id === tratamentoId)
  if (!tratamento) return

  const { statusApos, ...dadosSessao } = sessao
  tratamento.sessoes.push({ id: `s${proximaSessaoId++}`, ...dadosSessao })
  tratamento.status = statusApos
  tratamento.concluidoEm = statusApos !== 'em_aberto' ? sessao.data : undefined

  // Mescla os dentes trabalhados neste procedimento aos do tratamento.
  if (sessao.dentes?.length) {
    const atuais = tratamento.dente ? tratamento.dente.split(', ') : []
    tratamento.dente = [...new Set([...atuais, ...sessao.dentes])].join(', ')
  }
}
