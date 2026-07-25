// ─────────────────────────────────────────────────────────────────────────────
// Fonte única de rotas do Neo Saúde. NUNCA use string literal de path em
// <Route>/<Link>/navigate() — importe daqui. Renomear uma rota = mudar 1 linha.
// ─────────────────────────────────────────────────────────────────────────────

/** Rotas públicas de autenticação (fora do AppLayout). */
export const AUTH_ROUTES = {
  LOGIN:           '/login',
  FORGOT_PASSWORD: '/recuperar-senha',
} as const

/** Rotas autenticadas (dentro do AppLayout, atrás do AuthGuard). */
export const APP_ROUTES = {
  DASHBOARD:            '/',
  TODAY:                '/hoje',
  SCHEDULE:             '/agenda',
  PATIENTS:             '/pacientes',
  PATIENT_PROFILE:      '/pacientes/:id',
  // Perfil do lead (mesmo visual do paciente, sem abas + "Converter em paciente").
  LEAD_PROFILE:         '/leads/:id',
  PROFESSIONALS:        '/profissionais',
  PROFESSIONAL_PROFILE: '/profissionais/:id',
  FINANCE:              '/financeiro',
  // Página única com abas: Dados do consultório · Salas · Materiais.
  ADMIN:                '/administrativo',
  SETTINGS:             '/configuracoes',
} as const

/** Rotas de sistema (erro, acesso negado…). */
export const SYSTEM_ROUTES = {
  NOT_FOUND:    '*',
  UNAUTHORIZED: '/sem-acesso',
} as const

/** Páginas do app para o controle de acesso por cargo (aba Cargos). */
export const APP_PAGES: { value: import('@/types/domain').AppPage; label: string }[] = [
  { value: 'dashboard',     label: 'Dashboard' },
  { value: 'today',         label: 'Hoje' },
  { value: 'schedule',      label: 'Agenda' },
  { value: 'patients',      label: 'Pacientes' },
  { value: 'professionals', label: 'Profissionais' },
  { value: 'finance',       label: 'Financeiro' },
  { value: 'admin',         label: 'Administrativo' },
  { value: 'settings',      label: 'Configurações' },
]

/** Troca o ':id' do path pelo valor real — mantém os segmentos só em APP_ROUTES. */
const withId = (path: string, id: string) => path.replace(':id', id)

/** Helpers para rotas com parâmetro — evita template string espalhada no app. */
export const buildRoute = {
  patientProfile: (id: string) => withId(APP_ROUTES.PATIENT_PROFILE, id),
  leadProfile: (id: string) => withId(APP_ROUTES.LEAD_PROFILE, id),
  professionalProfile: (id: string) => withId(APP_ROUTES.PROFESSIONAL_PROFILE, id),
}

// Prioridade de "primeira página que o cargo consegue ver" — usada nos 3
// lugares que hoje mandavam todo mundo direto pro Dashboard na marra
// (LoginPage nas duas pontas, link de volta do UnauthorizedPage). Sem isto,
// um cargo sem acesso ao Dashboard (ex.: só "Hoje") cai num loop de redirect
// pra /sem-acesso — o link "voltar" também aponta pro Dashboard.
const LANDING_ROUTE_BY_PAGE: Record<import('@/types/domain').AppPage, string> = {
  dashboard: APP_ROUTES.DASHBOARD,
  today: APP_ROUTES.TODAY,
  schedule: APP_ROUTES.SCHEDULE,
  patients: APP_ROUTES.PATIENTS,
  professionals: APP_ROUTES.PROFESSIONALS,
  finance: APP_ROUTES.FINANCE,
  admin: APP_ROUTES.ADMIN,
  settings: APP_ROUTES.SETTINGS,
}
const LANDING_PRIORITY = Object.keys(LANDING_ROUTE_BY_PAGE) as import('@/types/domain').AppPage[]

/** Primeira rota que o cargo logado consegue abrir, nessa ordem de prioridade. */
export function resolveLandingRoute(canView: (page: import('@/types/domain').AppPage) => boolean): string {
  const first = LANDING_PRIORITY.find(canView)
  return first ? LANDING_ROUTE_BY_PAGE[first] : SYSTEM_ROUTES.UNAUTHORIZED
}
