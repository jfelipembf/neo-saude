// ─────────────────────────────────────────────────────────────────────────────
// Mapa status → cor/rótulo do Badge. Fonte única: ao criar um status novo no
// domínio (consulta, paciente, pagamento…), registre aqui — o Badge resolve
// sozinho a partir da string do banco.
// ─────────────────────────────────────────────────────────────────────────────

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'gray'

interface StatusEntry {
  variant: BadgeVariant
  label: string
}

export const STATUS_MAP: Record<string, StatusEntry> = {
  // ── Consultas / agenda ──
  agendada:    { variant: 'info',    label: 'Agendada' },
  confirmada:  { variant: 'accent',  label: 'Confirmada' },
  em_atendimento: { variant: 'warning', label: 'Em atendimento' },
  concluida:   { variant: 'success', label: 'Concluída' },
  cancelada:   { variant: 'danger',  label: 'Cancelada' },
  faltou:      { variant: 'gray',    label: 'Faltou' },

  // ── Pacientes ──
  ativo:       { variant: 'success', label: 'Ativo' },
  inativo:     { variant: 'gray',    label: 'Inativo' },

  // ── Financeiro ──
  pago:        { variant: 'success', label: 'Pago' },
  pendente:    { variant: 'warning', label: 'Pendente' },
  vencido:     { variant: 'danger',  label: 'Vencido' },
  cancelado:   { variant: 'gray',    label: 'Cancelado' },

  // ── Tarefas ──
  a_fazer:      { variant: 'info',    label: 'A fazer' },
  em_andamento: { variant: 'warning', label: 'Em andamento' },
  // 'concluida' já registrado em Consultas — vale para tarefas também.

  // ── Prioridade de tarefas ──
  alta:  { variant: 'danger',  label: 'Alta' },
  media: { variant: 'warning', label: 'Média' },
  baixa: { variant: 'gray',    label: 'Baixa' },

  // ── Lembretes (urgência pela data) ──
  hoje:     { variant: 'success', label: 'Hoje' },
  em_breve: { variant: 'info',    label: 'Em breve' },
  atrasado: { variant: 'danger',  label: 'Atrasado' },

  // ── Tratamentos / odontograma ──
  finalizado: { variant: 'success', label: 'Finalizado' },
  em_aberto:  { variant: 'warning', label: 'Em aberto' },
  extraido:   { variant: 'gray',    label: 'Extraído' },

  // ── Estoque (materiais) ──
  em_estoque:    { variant: 'success', label: 'Em estoque' },
  estoque_baixo: { variant: 'warning', label: 'Estoque baixo' },
  esgotado:      { variant: 'danger',  label: 'Esgotado' },
  // 'vencido' já registrado no Financeiro — vale para materiais também.
}
