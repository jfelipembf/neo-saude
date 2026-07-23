// ─────────────────────────────────────────────────────────────────────────────
// Fonte única das query keys do TanStack Query. NUNCA monte key inline no
// useQuery — importe daqui. Garante que invalidações acertem o cache certo.
// Padrão: [entidade] para listas, [entidade, id] para detalhe.
// ─────────────────────────────────────────────────────────────────────────────

export const queryKeys = {
  patients: {
    all:    ['patients'] as const,
    detail: (id: string) => ['patients', id] as const,
  },
  anamnesis: {
    byPatient: (patientId: string) => ['anamnesis', patientId] as const,
  },
  whatsapp: {
    connection:    ['whatsapp', 'connection'] as const,
    automations: ['whatsapp', 'automations'] as const,
  },
  subscription: {
    plan:     ['subscription', 'plan'] as const,
    invoices: ['subscription', 'invoices'] as const,
  },
  appointments: {
    all:    ['appointments'] as const,
    byDay:  (isoDate: string) => ['appointments', 'day', isoDate] as const,
    detail: (id: string) => ['appointments', id] as const,
    // Prefixada por 'appointments' de propósito: invalidar a agenda (marcar
    // presença/falta) tem de refazer os cartões do topo junto, e o prefixo
    // garante isso sem uma segunda invalidação que alguém esqueceria.
    stats:  ['appointments', 'stats'] as const,
    series:  (period: string, isoMonth: string) => ['appointments', 'series', period, isoMonth] as const,
    history: (patientId: string) => ['appointments', 'history', patientId] as const,
    /** Consultas do intervalo visível da Agenda (semana da grade, janela da aba do profissional). */
    range:  (fromIso: string, toIso: string) => ['appointments', 'range', fromIso, toIso] as const,
  },
  professionals: {
    all:    ['professionals'] as const,
    detail: (id: string) => ['professionals', id] as const,
    /** Produção do profissional (aba Ganhos) — prefixada, cai junto na invalidação. */
    earnings: (id: string) => ['professionals', id, 'earnings'] as const,
  },
  user: {
    me: ['user', 'me'] as const,
  },
  finance: {
    // PREFIXO DE TODO O MÓDULO. Um movimento de dinheiro nunca mexe em uma
    // lista só: dar baixa num título altera o saldo do banco, o fluxo de caixa
    // projetado, o gráfico e o extrato do paciente. Invalidar peça por peça é
    // como as telas ficam desatualizadas até alguém apertar F5 — as mutations
    // do financeiro invalidam este prefixo inteiro.
    all: ['finance'] as const,
    series: (period: string, isoMonth: string) => ['finance', 'series', period, isoMonth] as const,
    // Parametrizada pelo horizonte: a projeção de 30, 60 e 90 dias é dado
    // diferente e não pode compartilhar cache. Continua sob o prefixo
    // ['finance'], então as mutations do módulo a invalidam junto com o resto.
    cashFlow: (days: number) => ['finance', 'cashFlow', days] as const,
    payables:    ['finance', 'payables'] as const,
    receivables: ['finance', 'receivables'] as const,
    banks:      ['finance', 'banks'] as const,
    acquirers: ['finance', 'acquirers'] as const,
    collections: ['finance', 'collections'] as const,
    // Prefixada por 'finance' de propósito: faturar um procedimento parado cria
    // um recebível, então quem invalida a lista de contas a receber (prefixo
    // ['finance']) já refaz o contador da aba "A faturar" junto.
    unbilled: ['finance', 'unbilled'] as const,
    // Extrato do paciente (aba Pagamentos do perfil). Sob 'finance' pelo mesmo
    // motivo: qualquer baixa no módulo tem de refletir aqui sem F5.
    byPatient: (patientId: string) => ['finance', 'receivables', 'patient', patientId] as const,
  },
  tasks: {
    all: ['tasks'] as const,
  },
  leads: {
    all: ['leads'] as const,
  },
  // 'payments' saiu daqui junto com o service: public.payment está CONGELADA
  // (zero linhas, nenhum escritor, sem GRANT de escrita) e o razão vigente é
  // receivable — que vive sob a key 'finance'.
  treatments: {
    // Prefixo: faturar um procedimento pela aba "A faturar" muda a situação
    // financeira da sessão no prontuário de um paciente que a tela do
    // Financeiro não sabe qual é.
    all: ['treatments'] as const,
    byPatient: (patientId: string) => ['treatments', 'patient', patientId] as const,
    /**
     * Prévia do reflexo financeiro do procedimento em edição. Os parâmetros
     * fazem parte da key porque a resposta MUDA com cada um deles: trocar o
     * valor ou marcar cortesia tem de refazer a pergunta, não servir a frase
     * anterior do cache — a frase é o que o dentista combina com o paciente.
     */
    billingPreview: (
      patientId: string,
      amount: number | undefined,
      performedOn: string,
      billing: { dueDate?: string; notBillableReason?: string; method?: string; acquirerId?: string; installments?: number },
    ) => [
      'treatments', 'billingPreview', patientId, amount ?? null, performedOn,
      billing.dueDate ?? null, billing.notBillableReason?.trim() || null,
      billing.method ?? null, billing.acquirerId ?? null, billing.installments ?? 1,
    ] as const,
  },
  roles: {
    all: ['roles'] as const,
  },
  staff: {
    all: ['staff'] as const,
  },
  quotes: {
    all: ['quotes'] as const,
    byPatient: (patientId: string) => ['quotes', 'patient', patientId] as const,
  },
  prescriptions: {
    all: ['prescriptions'] as const,
    byPatient: (patientId: string) => ['prescriptions', 'patient', patientId] as const,
  },
  commissions: {
    all: ['commissions'] as const,
  },
  insurances: {
    all: ['insurances'] as const,
  },
  documents: {
    all: ['documents'] as const,
    byPatient: (patientId: string) => ['documents', 'patient', patientId] as const,
  },
  rooms: {
    all: ['rooms'] as const,
  },
  clinic: {
    data:    ['clinic', 'data'] as const,
    manager: ['clinic', 'manager'] as const,
  },
  materials: {
    all: ['materials'] as const,
  },
  goals: {
    // Prefixo para invalidar TODOS os anos de uma vez (troca de clínica, logout).
    all: ['goals'] as const,
    // O ANO faz parte da key porque a matriz de 2026 e a de 2027 são conjuntos
    // de dados distintos: sem ele, trocar o seletor de ano serviria a matriz do
    // ano anterior do cache e o usuário editaria — e salvaria — o ano errado.
    byYear: (year: number) => ['goals', year] as const,
  },
}
