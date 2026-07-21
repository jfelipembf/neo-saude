// ─────────────────────────────────────────────────────────────────────────────
// Fonte única das query keys do TanStack Query. NUNCA monte key inline no
// useQuery — importe daqui. Garante que invalidações acertem o cache certo.
// Padrão: [entidade] para listas, [entidade, id] para detalhe.
// ─────────────────────────────────────────────────────────────────────────────

export const queryKeys = {
  pacientes: {
    all:    ['pacientes'] as const,
    detail: (id: string) => ['pacientes', id] as const,
  },
  consultas: {
    all:    ['consultas'] as const,
    byDay:  (isoDate: string) => ['consultas', 'dia', isoDate] as const,
    detail: (id: string) => ['consultas', id] as const,
    serie:  (periodo: string, mesIso: string) => ['consultas', 'serie', periodo, mesIso] as const,
    historico: (pacienteId: string) => ['consultas', 'historico', pacienteId] as const,
  },
  profissionais: {
    all:    ['profissionais'] as const,
    detail: (id: string) => ['profissionais', id] as const,
  },
  usuario: {
    me: ['usuario', 'me'] as const,
  },
  financeiro: {
    serie: (periodo: string, mesIso: string) => ['financeiro', 'serie', periodo, mesIso] as const,
    caixa:       ['financeiro', 'caixa'] as const,
    caixaSessao: ['financeiro', 'caixa', 'sessao'] as const,
    fluxo:       ['financeiro', 'fluxo'] as const,
    pagar:       ['financeiro', 'pagar'] as const,
    receber:     ['financeiro', 'receber'] as const,
    bancos:      ['financeiro', 'bancos'] as const,
    adquirentes: ['financeiro', 'adquirentes'] as const,
  },
  tarefas: {
    all: ['tarefas'] as const,
  },
  lembretes: {
    all: ['lembretes'] as const,
  },
  leads: {
    all: ['leads'] as const,
  },
  pagamentos: {
    all: ['pagamentos'] as const,
    byPaciente: (pacienteId: string) => ['pagamentos', 'paciente', pacienteId] as const,
  },
  tratamentos: {
    byPaciente: (pacienteId: string) => ['tratamentos', 'paciente', pacienteId] as const,
  },
  cargos: {
    all: ['cargos'] as const,
  },
  orcamentos: {
    all: ['orcamentos'] as const,
    byPaciente: (pacienteId: string) => ['orcamentos', 'paciente', pacienteId] as const,
  },
  prescricoes: {
    all: ['prescricoes'] as const,
    byPaciente: (pacienteId: string) => ['prescricoes', 'paciente', pacienteId] as const,
  },
  comissoes: {
    all: ['comissoes'] as const,
  },
  convenios: {
    all: ['convenios'] as const,
  },
  grade: {
    all: ['grade'] as const,
  },
  documentos: {
    all: ['documentos'] as const,
    byPaciente: (pacienteId: string) => ['documentos', 'paciente', pacienteId] as const,
  },
  salas: {
    all: ['salas'] as const,
  },
  consultorio: {
    dados:       ['consultorio', 'dados'] as const,
    responsavel: ['consultorio', 'responsavel'] as const,
  },
  materiais: {
    all: ['materiais'] as const,
  },
}
