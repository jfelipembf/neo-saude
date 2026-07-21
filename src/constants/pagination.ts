// ─────────────────────────────────────────────────────────────────────────────
// Fonte única de paginação: toda tabela paginada usa estas opções no Select
// "N por página" (PaymentsTable, Pacientes…). Nova tabela? Importe daqui.
// ─────────────────────────────────────────────────────────────────────────────

export const OPCOES_POR_PAGINA = [
  { value: '5',  label: '5 por página' },
  { value: '10', label: '10 por página' },
  { value: '20', label: '20 por página' },
]
