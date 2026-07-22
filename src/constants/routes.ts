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
  DASHBOARD:       '/',
  SCHEDULE:          '/agenda',
  PATIENTS:       '/pacientes',
  PATIENT_PROFILE: '/pacientes/:id',
  PROFESSIONALS:   '/profissionais',
  PROFESSIONAL_PROFILE: '/profissionais/:id',
  FINANCE:      '/financeiro',
  // Página única com abas: Dados do consultório · Salas · Materiais.
  ADMIN:  '/administrativo',
  SETTINGS:   '/configuracoes',
} as const

/** Rotas de sistema (erro, acesso negado…). */
export const SYSTEM_ROUTES = {
  NOT_FOUND:    '*',
  UNAUTHORIZED: '/sem-acesso',
} as const

/** Páginas do app para o controle de acesso por cargo (aba Cargos). */
export const APP_PAGES: { value: import('@/types/domain').AppPage; label: string }[] = [
  { value: 'dashboard',      label: 'Dashboard' },
  { value: 'schedule',         label: 'Agenda' },
  { value: 'patients',      label: 'Pacientes' },
  { value: 'professionals',  label: 'Profissionais' },
  { value: 'finance',     label: 'Financeiro' },
  { value: 'admin', label: 'Administrativo' },
  { value: 'settings',  label: 'Configurações' },
]

/** Helpers para rotas com parâmetro — evita template string espalhada no app. */
export const buildRoute = {
  patientProfile: (id: string) => `/pacientes/${id}`,
  professionalProfile: (id: string) => `/profissionais/${id}`,
}
