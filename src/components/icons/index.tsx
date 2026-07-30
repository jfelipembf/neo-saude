// ─────────────────────────────────────────────────────────────────────────────
// FONTE ÚNICA de ícones do app (stroke 2, herdam currentColor).
// O TAMANHO é definido pelo CSS de quem usa (ex.: `svg { width: 16px; }`) —
// nunca por estilo inline. Ícone novo? Adicione aqui, não no componente.
// ─────────────────────────────────────────────────────────────────────────────

// Logotipo NEO (fonte: src/assets/images/logo/logo.svg) — exceção de traço:
// é preenchido (fill), não stroke; a cor continua vindo de currentColor.
export const IconLogo = () => (
  <svg viewBox="0 0 379.4 98.5" fill="currentColor" role="img" aria-label="Neo Saúde">
    <path d="M103.81,76.42L35.5,5.04c-2.84-3.35-6.7-5.04-11.49-5.04h-10.8C4.56,0,0,4.37,0,12.63v85.87h22.35V22.22l68.31,71.1c2.65,3.44,6.51,5.18,11.49,5.18h10.8c8.64,0,13.2-4.42,13.2-12.78V0h-22.35v76.42h.01Z" />
    <polygon points="161.49 56.39 218.94 56.39 218.94 39.41 137.49 39.41 137.49 98.5 250.3 98.5 250.3 79.56 161.49 79.56 161.49 56.39" />
    <rect x="137.49" width="112.81" height="19.24" />
    <path d="M352.25,0h-64.5c-18.02,0-27.15,8.35-27.15,24.81v48.88c0,16.46,9.14,24.81,27.15,24.81h64.5c18.02,0,27.15-8.35,27.15-24.81V24.81c0-16.46-9.13-24.81-27.15-24.81ZM354.65,28.27v41.96c0,6.14-2.92,8.88-9.45,8.88h-50.4c-6.54,0-9.45-2.74-9.45-8.88V28.27c0-6.24,2.91-9.03,9.45-9.03h50.4c6.54,0,9.45,2.78,9.45,9.03Z" />
  </svg>
)

export const IconDashboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
)

export const IconSchedule = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

// "Hoje" — mesmo calendário do IconSchedule, com o check de "resolvido hoje".
export const IconToday = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 15.5l2.5 2.5L16 13" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconPatients = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

export const IconProfessionals = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
    <path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4" /><circle cx="20" cy="10" r="2" />
  </svg>
)

export const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)

export const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)

export const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

export const IconTheme = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

export const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

/** Estornar uma baixa (desfazer pagamento/recebimento confirmado). */
export const IconUndo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </svg>
)

export const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

/** Cancelar consulta (círculo cortado — "proibido"). */
export const IconBan = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="9" /><line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
  </svg>
)

export const IconChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

export const IconChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

export const IconChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

export const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

export const IconEmail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" />
  </svg>
)

export const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

export const IconAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

// Cadeado: usado onde a tela existe mas o cargo não pode ver o conteúdo —
// dizer "restrito" é diferente de mostrar uma lista vazia.
export const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

export const IconInfo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

export const IconDocument = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)

export const IconUpload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

export const IconPrint = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
)

export const IconMessage = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

export const IconEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
)

export const IconEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
)

export const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

export const IconCart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
)

export const IconTasks = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
)

export const IconSettings = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

export const IconTrendUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
)

export const IconTrendDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
  </svg>
)

export const IconFinance = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

export const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

export const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

export const IconAdmin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
)

export const IconRoom = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M3 21h18" /><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
    <path d="M14 12h.01" />
  </svg>
)

export const IconCashRegister = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" />
  </svg>
)

export const IconCamera = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

export const IconCopy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

export const IconFilter = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <line x1="21" y1="4" x2="14" y2="4" /><line x1="10" y1="4" x2="3" y2="4" />
    <line x1="21" y1="12" x2="12" y2="12" /><line x1="8" y1="12" x2="3" y2="12" />
    <line x1="21" y1="20" x2="16" y2="20" /><line x1="12" y1="20" x2="3" y2="20" />
    <circle cx="12" cy="4" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="14" cy="20" r="2" />
  </svg>
)

export const IconBold = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M6 4h8a4 4 0 0 1 0 8H6z" /><path d="M6 12h9a4 4 0 0 1 0 8H6z" />
  </svg>
)

export const IconItalic = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" />
  </svg>
)

export const IconUnderline = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M6 4v6a6 6 0 0 0 12 0V4" /><line x1="4" y1="20" x2="20" y2="20" />
  </svg>
)

export const IconEmoji = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" />
    <circle cx="8.5" cy="9.5" r="1" fill="currentColor" stroke="none" /><circle cx="15.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
  </svg>
)

export const IconMic = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
  </svg>
)

// "Aprimorar com IA" — sparkles, ícone padrão de ação assistida por IA.
// Exceção de traço (como IconLogo): preenchido (fill), não stroke — um
// sparkle contornado em 16px fica fraco/ambíguo (parece um "+").
export const IconSparkle = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
    <path d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    <path d="M16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
  </svg>
)

export const IconAlignLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" />
  </svg>
)

export const IconAlignCenter = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
  </svg>
)

export const IconAlignRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="9" y1="12" x2="21" y2="12" /><line x1="6" y1="18" x2="21" y2="18" />
  </svg>
)

export const IconImage = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
)

export const IconBolt = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

// Atalho do odontograma em tela cheia (Header, só clínicas de odontologia).
export const IconTooth = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinejoin="round"
      d="M12 3c-1.8 0-3 .8-4.2.8-1.6 0-2.8 1.3-2.8 3.2 0 2.1.7 4.6 1.2 6.9.5 2.2.9 4.6 1.6 6.3.4.9.9 1.5 1.6 1.5.9 0 1.1-1.1 1.3-2.3.2-1.1.4-2.4 1.3-2.4.9 0 1.1 1.3 1.3 2.4.2 1.2.4 2.3 1.3 2.3.7 0 1.2-.6 1.6-1.5.7-1.7 1.1-4.1 1.6-6.3.5-2.3 1.2-4.8 1.2-6.9 0-1.9-1.2-3.2-2.8-3.2-1.2 0-2.4-.8-4.2-.8Z"
    />
  </svg>
)

export const IconWhatsApp = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
)

// ── Sinais vitais ────────────────────────────────────────────────────────────
// Cinco ícones de traço, um por medida. Existem para o cartão de cada gráfico
// ser reconhecível de relance numa grade — o rótulo escrito continua ao lado,
// então nenhum deles carrega significado sozinho.

/** Pressão arterial — o traço do esfigmomanômetro sobre a onda de pulso. */
export const IconBloodPressure = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="13" r="7" /><path d="M12 9v4l2.5 2" /><path d="M9 3h6" />
  </svg>
)

export const IconHeart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1z" />
  </svg>
)

/** Frequência respiratória — a onda do fluxo de ar. */
export const IconLungs = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M12 3v9" />
    <path d="M12 12c0-2-1.5-3-3-3s-4 1.5-4 5v4a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3" />
    <path d="M12 12c0-2 1.5-3 3-3s4 1.5 4 5v4a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3" />
  </svg>
)

/** Saturação — a gota de sangue oxigenado. */
export const IconOxygen = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M12 2.7 6.9 8.3a7 7 0 1 0 10.2 0z" />
  </svg>
)

export const IconThermometer = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z" />
  </svg>
)

export const IconScale = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8.5 10a3.5 3.5 0 0 1 7 0" />
    <path d="M12 10 10.5 7" />
  </svg>
)

export const IconRuler = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="2" y="8" width="20" height="8" rx="2" />
    <path d="M6.5 8v3M10 8v4M13.5 8v3M17 8v4" />
  </svg>
)

export const IconMuscle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M4 8c2-2 5-2.5 8-1.5 2.4.8 4 2.6 4.6 4.8.5 1.9.2 3.6-.9 5-1.4 1.8-3.8 2.4-6 1.5" />
    <path d="M9.6 17.8C7 18.6 4.6 17.4 4 15c-.4-1.7.2-3.3 1.6-4.2" />
  </svg>
)

export const IconDroplet = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M12 3.2 7.4 9.6a5.6 5.6 0 1 0 9.2 0z" />
  </svg>
)

export const IconMenu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
  </svg>
)

export const IconPill = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3.5" y="8" width="17" height="8" rx="4" transform="rotate(-35 12 12)" />
    <path d="M12 7.5 16.5 12" />
  </svg>
)

export const IconScissors = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="6" cy="18" r="2.5" />
    <path d="M8 7.5 20 18M8 16.5 20 6" />
  </svg>
)

export const IconFolder = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
)

/** Diagnóstico — o estetoscópio. */
export const IconStethoscope = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M5 3v6a4 4 0 0 0 8 0V3" />
    <path d="M13 12v2a5 5 0 0 0 10 0v-1.5" />
    <circle cx="20.5" cy="9.5" r="1.5" />
  </svg>
)

/** Histórico familiar — a árvore genealógica: dois ramos convergindo em um. */
export const IconFamilyTree = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="6" cy="5" r="2.5" /><circle cx="18" cy="5" r="2.5" /><circle cx="12" cy="19" r="2.5" />
    <path d="M6 7.5V12h12V7.5M12 12v4.5" />
  </svg>
)

/** Início — a casinha do botão central da navegação inferior (PWA mobile). */
export const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 9.5V19a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5" />
  </svg>
)

// ─────────────────────────────────────────────────────────────────────────────
// GRADE DO INÍCIO (PWA mobile) + SideNav do atendimento de fisioterapia — os 12
// ícones abaixo são do conjunto Solar (480 Design, licença CC BY 4.0, via
// api.iconify.design/solar). Duotone: duas camadas com fill="currentColor", a
// de trás em opacity mais baixa — dá o efeito de duas cores sem precisar de uma
// segunda cor de verdade, então herdam var(--primary-fg) etc. como qualquer
// outro ícone daqui. Substituem as imagens PNG que estavam em
// assets/images/icon (ver sideNavItems.tsx) — aquelas eram 3D/raster, fixas em
// um tom só, e não se adaptavam ao tema escuro.
// ─────────────────────────────────────────────────────────────────────────────

/** Sinais vitais — coração com a linha de pulso (Solar Duotone). */
export const IconVitalSigns = () => (
  <svg viewBox="0 0 24 24">
    <path fill="currentColor" d="M2 9.26c0 3.748 4.02 7.711 6.962 10.11C10.294 20.458 10.96 21 12 21s1.706-.543 3.038-1.63C17.981 16.972 22 13.009 22 9.26C22 3.35 16.5.663 12 5.5C7.5.663 2 3.349 2 9.26" opacity=".5"/>
    <path fill="currentColor" d="M10.093 10.747q.133-.191.23-.325c.056.097.119.21.194.348l1.71 3.109c.166.302.33.598.493.813c.175.23.482.546.975.555s.813-.294.996-.518c.172-.208.345-.498.523-.794l.055-.092c.221-.368.36-.598.483-.764c.113-.154.179-.204.228-.231s.125-.058.315-.077c.206-.02.474-.02.904-.02H18a.75.75 0 0 0 0-1.5h-.834c-.387 0-.73 0-1.016.027a2.2 2.2 0 0 0-.91.264a2.2 2.2 0 0 0-.694.644c-.171.232-.347.525-.546.857l-.048.08c-.087.144-.159.264-.224.368l-.21-.377l-1.709-3.108c-.154-.28-.307-.56-.463-.764c-.17-.224-.462-.52-.93-.545c-.467-.025-.789.237-.982.442c-.177.186-.36.448-.543.71l-.31.442c-.227.324-.37.526-.493.672a.8.8 0 0 1-.223.203c-.046.024-.118.05-.293.066c-.19.018-.438.018-.834.018H6a.75.75 0 0 0 0 1.5h.768c.357 0 .674 0 .94-.024c.29-.026.571-.085.85-.23c.28-.145.489-.343.676-.564c.173-.205.354-.464.559-.757z"/>
  </svg>
)

/** Prontuários — prancheta com linhas de texto (Solar Duotone). */
export const IconClinicalRecord = () => (
  <svg viewBox="0 0 24 24">
    <path fill="currentColor" d="M21 15.998v-6c0-2.828 0-4.242-.879-5.121C19.353 4.109 18.175 4.012 16 4H8c-2.175.012-3.353.109-4.121.877C3 5.756 3 7.17 3 9.998v6c0 2.829 0 4.243.879 5.122c.878.878 2.293.878 5.121.878h6c2.828 0 4.243 0 5.121-.878c.879-.88.879-2.293.879-5.122" opacity=".5"/>
    <path fill="currentColor" d="M8 3.5A1.5 1.5 0 0 1 9.5 2h5A1.5 1.5 0 0 1 16 3.5v1A1.5 1.5 0 0 1 14.5 6h-5A1.5 1.5 0 0 1 8 4.5z"/>
    <path fill="currentColor" fillRule="evenodd" d="M6.25 14.5a.75.75 0 0 1 .75-.75h8a.75.75 0 0 1 0 1.5H7a.75.75 0 0 1-.75-.75m0 3.5a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5H7a.75.75 0 0 1-.75-.75" clipRule="evenodd"/>
  </svg>
)

/** Testes — lista de resultados marcados (Solar Duotone). */
export const IconChecklist = () => (
  <svg viewBox="0 0 24 24">
    <path fill="currentColor" fillRule="evenodd" d="M8.048 2.488a.75.75 0 0 1-.036 1.06l-4.286 4a.75.75 0 0 1-1.095-.076l-1.214-1.5a.75.75 0 0 1 1.166-.944l.708.875l3.697-3.451a.75.75 0 0 1 1.06.036M11.25 5a.75.75 0 0 1 .75-.75h10a.75.75 0 0 1 0 1.5H12a.75.75 0 0 1-.75-.75M8.048 16.488a.75.75 0 0 1-.036 1.06l-4.286 4a.75.75 0 0 1-1.095-.076l-1.214-1.5a.75.75 0 1 1 1.166-.944l.708.875l3.697-3.451a.75.75 0 0 1 1.06.036M11.25 19a.75.75 0 0 1 .75-.75h10a.75.75 0 0 1 0 1.5H12a.75.75 0 0 1-.75-.75" clipRule="evenodd"/>
    <path fill="currentColor" d="M8.048 9.488a.75.75 0 0 1-.036 1.06l-4.286 4a.75.75 0 0 1-1.095-.076l-1.214-1.5a.75.75 0 1 1 1.166-.944l.708.875l3.697-3.451a.75.75 0 0 1 1.06.036M11.25 12a.75.75 0 0 1 .75-.75h10a.75.75 0 0 1 0 1.5H12a.75.75 0 0 1-.75-.75" opacity=".5"/>
  </svg>
)

/** Avaliações — régua diagonal de medição (Solar Duotone). */
export const IconRulerDuotone = () => (
  <svg viewBox="0 0 24 24">
    <path fill="currentColor" d="M2 15.616c0 .847.682 1.529 2.045 2.892l1.447 1.447C6.855 21.318 7.537 22 8.384 22s1.53-.682 2.893-2.045l8.678-8.678C21.318 9.913 22 9.23 22 8.384s-.682-1.529-2.045-2.892l-1.447-1.447C17.145 2.682 16.463 2 15.616 2c-.754 0-1.376.54-2.464 1.618l-1.05 1.048l-1.072 1.073l-1.05 1.048L8.91 7.86L7.86 8.909L6.788 9.98L5.74 11.03l-1.073 1.073l-1.048 1.049C2.539 14.24 2 14.862 2 15.616" opacity=".5"/>
    <path fill="currentColor" d="M13.238 3.691a1 1 0 0 0-.086-.073l-1.049 1.048q.033.045.074.086l1.414 1.414a.75.75 0 0 0 1.06-1.06zm-2.122 2.122a1 1 0 0 0-.086-.074L9.982 6.787q.033.045.074.086l2.121 2.122a.75.75 0 0 0 1.06-1.061zM8.995 7.934a1 1 0 0 0-.086-.074L7.86 8.908q.033.046.074.087l1.415 1.414a.75.75 0 1 0 1.06-1.06zm-2.121 2.121a1 1 0 0 0-.086-.074L5.739 11.03q.033.045.074.086l2.121 2.121a.75.75 0 1 0 1.061-1.06zm-2.122 2.122a1 1 0 0 0-.086-.075l-1.048 1.05q.033.045.074.085l1.414 1.414a.75.75 0 1 0 1.06-1.06z"/>
  </svg>
)

/** Anamnese — pessoa em entrevista (Solar Duotone). */
export const IconInterview = () => (
  <svg viewBox="0 0 24 24">
    <path fill="currentColor" d="M18.357 1.364a.75.75 0 0 1 1.029-.257L19 1.75l.386-.643h.001l.002.002l.003.002l.01.006a2 2 0 0 1 .114.076q.107.074.277.212c.222.185.512.462.802.838c.582.758 1.155 1.914 1.155 3.507s-.573 2.75-1.155 3.507c-.29.376-.58.653-.802.838a4 4 0 0 1-.378.28l-.013.008l-.01.006l-.003.002l-.002.001s-.001.001-.387-.642l.386.643a.75.75 0 0 1-.776-1.283l.005-.004l.04-.027q.061-.042.177-.136c.153-.128.363-.326.573-.6c.418-.542.845-1.386.845-2.593s-.427-2.05-.844-2.593a3.8 3.8 0 0 0-.574-.6a3 3 0 0 0-.217-.163l-.005-.003a.75.75 0 0 1-.253-1.027M10 9.75a4 4 0 1 0 0-8a4 4 0 0 0 0 8"/>
    <path fill="currentColor" d="M17.386 3.107a.75.75 0 0 0-1.03.257l.25 1.024l.007.005l.063.049c.06.05.144.129.23.24a1.7 1.7 0 0 1 .344 1.068a1.7 1.7 0 0 1-.344 1.068a1.5 1.5 0 0 1-.293.29l-.008.004a.75.75 0 0 0 .78 1.281L17 7.75l.386.643h.001l.002-.001l.003-.002l.007-.005l.02-.012a2 2 0 0 0 .217-.162c.129-.107.294-.265.459-.479a3.2 3.2 0 0 0 .655-1.982a3.2 3.2 0 0 0-.655-1.982a3 3 0 0 0-.622-.604l-.054-.037l-.02-.012l-.007-.004l-.003-.002l-.002-.001s-.001-.001-.387.642z"/>
    <path fill="currentColor" d="M2 17.25c0 2.485 0 4.5 8 4.5s8-2.015 8-4.5s-3.582-4.5-8-4.5s-8 2.015-8 4.5" opacity=".5"/>
  </svg>
)

/** Diagnóstico — estetoscópio (Solar Duotone). */
export const IconDiagnosis = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="19" cy="16" r="3" fill="currentColor"/>
    <path fill="currentColor" d="M12 1.25a.75.75 0 0 1 .75.75v.251a3.75 3.75 0 0 1 3.7 3.418c.014.166.014.354.014.629V7.52A7.464 7.464 0 0 1 9 14.985a7.75 7.75 0 0 1-7.75-7.75v-.937c0-.275 0-.463.015-.628A3.75 3.75 0 0 1 4.67 2.265a7 7 0 0 1 .58-.015V2a.75.75 0 1 1 1.5 0v2a.75.75 0 0 1-1.5 0v-.25c-.263 0-.366.001-.448.009a2.25 2.25 0 0 0-2.043 2.043c-.008.09-.009.206-.009.535v.898A6.25 6.25 0 0 0 9 13.485a5.964 5.964 0 0 0 5.964-5.964V6.337c0-.329 0-.445-.008-.535a2.25 2.25 0 0 0-2.206-2.05V4a.75.75 0 0 1-1.5 0V2a.75.75 0 0 1 .75-.75"/>
    <path fill="currentColor" d="M8.25 14.95V17A5.75 5.75 0 0 0 14 22.75h.882a4.87 4.87 0 0 0 4.23-2.458c.247-.432.37-.896.43-1.34a3 3 0 0 1-1.5-.108a2.1 2.1 0 0 1-.232.705a3.37 3.37 0 0 1-2.928 1.701H14A4.25 4.25 0 0 1 9.75 17v-2.052a7.5 7.5 0 0 1-1.5.002" opacity=".5"/>
  </svg>
)

/** Histórico familiar — grupo de pessoas (Solar Duotone). */
export const IconFamilyGroup = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="15" cy="6" r="3" fill="currentColor" opacity=".4"/>
    <ellipse cx="16" cy="17" fill="currentColor" opacity=".4" rx="5" ry="3"/>
    <circle cx="9.001" cy="6" r="4" fill="currentColor"/>
    <ellipse cx="9.001" cy="17.001" fill="currentColor" rx="7" ry="4"/>
  </svg>
)

/** Risco — triângulo de alerta (Solar Duotone). */
export const IconRisk = () => (
  <svg viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 3c-2.31 0-3.77 2.587-6.688 7.762l-.364.644c-2.425 4.3-3.638 6.45-2.542 8.022S6.214 21 11.636 21h.728c5.422 0 8.134 0 9.23-1.572s-.117-3.722-2.542-8.022l-.364-.645C15.77 5.587 14.311 3 12 3" opacity=".5"/>
    <path fill="currentColor" d="M12 7.25a.75.75 0 0 1 .75.75v5a.75.75 0 0 1-1.5 0V8a.75.75 0 0 1 .75-.75M12 17a1 1 0 1 0 0-2a1 1 0 0 0 0 2"/>
  </svg>
)

/** Medicações — pote de comprimidos (Solar Duotone). */
export const IconMedicationJar = () => (
  <svg viewBox="0 0 24 24">
    <path fill="currentColor" d="M6 3.5c0-.466 0-.699.076-.883a1 1 0 0 1 .541-.54C6.801 2 7.034 2 7.5 2h9c.466 0 .699 0 .883.076a1 1 0 0 1 .54.541c.077.184.077.417.077.883s0 .699-.076.883a1 1 0 0 1-.541.54C17.199 5 16.966 5 16.5 5h-9c-.466 0-.699 0-.883-.076a1 1 0 0 1-.54-.541C6 4.199 6 3.966 6 3.5m-2 7.423v6.629a4 4 0 0 0 .025.448h15.951q.024-.217.024-.435v-6.657q0-.464-.105-.908H4.108Q4 10.451 4 10.922" opacity=".5"/>
    <path fill="currentColor" d="M5.501 7.799L9.001 5h6.017l1.142.891l2.357 1.908A4 4 0 0 1 19.896 10H4.108a4 4 0 0 1 1.393-2.201M4.025 18a4 4 0 0 0 .902 2.113c.366.438.549.658.75.842a4 4 0 0 0 2.153 1.008C8.1 22 8.386 22 8.957 22h6.685a4 4 0 0 0 3.088-1.457l.358-.435A4 4 0 0 0 19.977 18z"/>
    <path fill="currentColor" fillRule="evenodd" d="M12 11.25a.75.75 0 0 1 .75.75v1.25H14a.75.75 0 0 1 0 1.5h-1.25V16a.75.75 0 0 1-1.5 0v-1.25H10a.75.75 0 0 1 0-1.5h1.25V12a.75.75 0 0 1 .75-.75" clipRule="evenodd"/>
  </svg>
)

/** Antecedentes cirúrgicos — tesoura cruzada (Solar Duotone). */
export const IconSurgery = () => (
  <svg viewBox="0 0 24 24">
    <path fill="currentColor" d="M6.654 1.633a.75.75 0 1 0-1.308.735L15.704 20.79a3.75 3.75 0 1 0-.136-3.303z" opacity=".5"/>
    <path fill="currentColor" d="M17.346 1.633a.75.75 0 0 1 1.308.735L8.296 20.79a3.75 3.75 0 1 1 .136-3.303z"/>
  </svg>
)

/** Documentos — pasta de arquivos (Solar Duotone). */
export const IconDocumentsFolder = () => (
  <svg viewBox="0 0 24 24">
    <path fill="currentColor" d="M22 14v-2.202c0-2.632 0-3.949-.77-4.804a3 3 0 0 0-.224-.225C20.151 6 18.834 6 16.202 6h-.374c-1.153 0-1.73 0-2.268-.153a4 4 0 0 1-.848-.352C12.224 5.224 11.816 4.815 11 4l-.55-.55c-.274-.274-.41-.41-.554-.53a4 4 0 0 0-2.18-.903C7.53 2 7.336 2 6.95 2c-.883 0-1.324 0-1.692.07A4 4 0 0 0 2.07 5.257C2 5.626 2 6.068 2 6.95V14c0 3.771 0 5.657 1.172 6.828S6.229 22 10 22h4c3.771 0 5.657 0 6.828-1.172S22 17.771 22 14" opacity=".5"/>
    <path fill="currentColor" d="M12.25 10a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5h-5a.75.75 0 0 1-.75-.75"/>
  </svg>
)

/** Meus tratamentos — relógio de histórico (Solar Duotone). */
export const IconTreatmentHistory = () => (
  <svg viewBox="0 0 24 24">
    <path fill="currentColor" fillRule="evenodd" d="M5.079 5.069c3.795-3.79 9.965-3.75 13.783.069c3.82 3.82 3.86 9.993.064 13.788s-9.968 3.756-13.788-.064a9.81 9.81 0 0 1-2.798-8.28a.75.75 0 1 1 1.487.203a8.31 8.31 0 0 0 2.371 7.017c3.245 3.244 8.468 3.263 11.668.064c3.199-3.2 3.18-8.423-.064-11.668c-3.243-3.242-8.463-3.263-11.663-.068l.748.003a.75.75 0 1 1-.007 1.5l-2.546-.012a.75.75 0 0 1-.746-.747L3.575 4.33a.75.75 0 1 1 1.5-.008z" clipRule="evenodd"/>
    <path fill="currentColor" d="M12 7.25a.75.75 0 0 1 .75.75v3.69l2.28 2.28a.75.75 0 1 1-1.06 1.06l-2.427-2.426a1 1 0 0 1-.293-.708V8a.75.75 0 0 1 .75-.75" opacity=".5"/>
  </svg>
)

// Celular deitando — o aviso de "vire o aparelho" do odontograma em retrato.
// O retângulo é o aparelho em pé e a seta curva indica o giro; o segundo
// retângulo, esmaecido, é onde ele chega.
export const IconRotateDevice = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
       strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="2" width="10" height="16" rx="2" />
    <path d="M8 5.5h0" />
    <path d="M16 10a6 6 0 0 1 5 5.9" opacity="0.55" />
    <path d="M18.5 12.5 21 16l3-2.2" opacity="0.55" transform="translate(-3 0)" />
  </svg>
)
