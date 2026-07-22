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
    series:  (period: string, isoMonth: string) => ['appointments', 'series', period, isoMonth] as const,
    history: (patientId: string) => ['appointments', 'history', patientId] as const,
  },
  professionals: {
    all:    ['professionals'] as const,
    detail: (id: string) => ['professionals', id] as const,
  },
  user: {
    me: ['user', 'me'] as const,
  },
  finance: {
    series: (period: string, isoMonth: string) => ['finance', 'series', period, isoMonth] as const,
    cash:       ['finance', 'cash'] as const,
    cashSession: ['finance', 'cash', 'session'] as const,
    cashFlow:       ['finance', 'cashFlow'] as const,
    payables:    ['finance', 'payables'] as const,
    receivables: ['finance', 'receivables'] as const,
    banks:      ['finance', 'banks'] as const,
    acquirers: ['finance', 'acquirers'] as const,
    collections: ['finance', 'collections'] as const,
  },
  tasks: {
    all: ['tasks'] as const,
  },
  leads: {
    all: ['leads'] as const,
  },
  payments: {
    all: ['payments'] as const,
    byPatient: (patientId: string) => ['payments', 'patient', patientId] as const,
  },
  treatments: {
    byPatient: (patientId: string) => ['treatments', 'patient', patientId] as const,
  },
  roles: {
    all: ['roles'] as const,
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
  schedule: {
    all: ['schedule'] as const,
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
}
