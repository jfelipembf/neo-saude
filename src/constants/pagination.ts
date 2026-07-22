// ─────────────────────────────────────────────────────────────────────────────
// Fonte única de paginação: toda tabela paginada usa estas opções no
// PerPageSelect ("Exibir N p/ página"). Nova tabela? Use o PerPageSelect.
// Só o número no rótulo — o texto ao redor vem do próprio PerPageSelect.
// ─────────────────────────────────────────────────────────────────────────────

export const PER_PAGE_OPTIONS = [
  { value: '5',  label: '5' },
  { value: '10', label: '10' },
  { value: '20', label: '20' },
  { value: '50', label: '50' },
]
