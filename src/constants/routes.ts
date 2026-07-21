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
  AGENDA:          '/agenda',
  PACIENTES:       '/pacientes',
  PACIENTE_PERFIL: '/pacientes/:id',
  PROFISSIONAIS:   '/profissionais',
  PROFISSIONAL_PERFIL: '/profissionais/:id',
  FINANCEIRO:      '/financeiro',
  // Página única com abas: Dados do consultório · Salas · Materiais.
  ADMINISTRATIVO:  '/administrativo',
  CONFIGURACOES:   '/configuracoes',
} as const

/** Rotas de sistema (erro, acesso negado…). */
export const SYSTEM_ROUTES = {
  NOT_FOUND:    '*',
  UNAUTHORIZED: '/sem-acesso',
} as const

/** Páginas do app para o controle de acesso por cargo (aba Cargos). */
export const PAGINAS_APP: { value: import('@/types/domain').AppPage; label: string }[] = [
  { value: 'dashboard',      label: 'Dashboard' },
  { value: 'agenda',         label: 'Agenda' },
  { value: 'pacientes',      label: 'Pacientes' },
  { value: 'profissionais',  label: 'Profissionais' },
  { value: 'financeiro',     label: 'Financeiro' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'configuracoes',  label: 'Configurações' },
]

/** Helpers para rotas com parâmetro — evita template string espalhada no app. */
export const buildRoute = {
  pacientePerfil: (id: string) => `/pacientes/${id}`,
  profissionalPerfil: (id: string) => `/profissionais/${id}`,
}
