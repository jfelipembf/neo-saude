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

/** Helpers para rotas com parâmetro — evita template string espalhada no app. */
export const buildRoute = {
  pacientePerfil: (id: string) => `/pacientes/${id}`,
}
