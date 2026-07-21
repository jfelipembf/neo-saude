import { MOCK_CONSULTAS } from '@/mocks/consultas'
import { MOCK_HISTORICO_CONSULTAS } from '@/mocks/historicoConsultas'
import { gerarSerieConsultas } from '@/mocks/serieConsultas'
import type { Consulta, ConsultaHistorico, DashboardStats, PeriodoGrafico, PontoSerie, StatusConsulta } from '@/types/domain'

// MODO MOCK: retorna dados de demonstração. Quando o schema Supabase existir,
// trocar o corpo por supabase.from('consultas')… mantendo a MESMA assinatura.
export async function listConsultasDoDia(): Promise<Consulta[]> {
  return MOCK_CONSULTAS
}

/** Marca presença/falta do paciente (mock: muta o array em memória). */
export async function setStatusConsulta(id: string, status: StatusConsulta): Promise<void> {
  const consulta = MOCK_CONSULTAS.find(c => c.id === id)
  if (consulta) consulta.status = status
}

/**
 * Série do gráfico de consultas por período (semana → dias, mês → semanas,
 * ano → meses), relativa ao mês de referência ('aaaa-mm').
 */
export async function getSerieConsultas(periodo: PeriodoGrafico, mesIso: string): Promise<PontoSerie[]> {
  return gerarSerieConsultas(periodo, mesIso)
}

/** Histórico de consultas do paciente (timeline do perfil), da mais recente à mais antiga. */
export async function listHistoricoDoPaciente(pacienteId: string): Promise<ConsultaHistorico[]> {
  return MOCK_HISTORICO_CONSULTAS.filter(c => c.pacienteId === pacienteId)
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const ativas = MOCK_CONSULTAS.filter(c => c.status !== 'cancelada')
  return {
    consultasHoje: ativas.length,
    pacientesAtivos: 132,
    confirmacoesPendentes: MOCK_CONSULTAS.filter(c => c.status === 'agendada').length,
    receitaMes: 'R$ 24.380',
  }
}
