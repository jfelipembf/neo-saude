// ─────────────────────────────────────────────────────────────────────────────
// Mapa status → cor/rótulo do Badge. Fonte única: ao criar um status novo no
// domínio (consulta, paciente, pagamento…), registre aqui — o Badge resolve
// sozinho a partir da string do banco. Chave em inglês (o VALOR armazenado),
// rótulo em português (o que o usuário vê).
// ─────────────────────────────────────────────────────────────────────────────

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'gray'

interface StatusEntry {
  variant: BadgeVariant
  label: string
}

export const STATUS_MAP: Record<string, StatusEntry> = {
  // ── Consultas / agenda ──
  scheduled:  { variant: 'info',    label: 'Agendada' },
  confirmed:  { variant: 'accent',  label: 'Confirmada' },
  in_service: { variant: 'warning', label: 'Em atendimento' },
  completed:  { variant: 'success', label: 'Concluída' },
  canceled:   { variant: 'danger',  label: 'Cancelada' },
  no_show:    { variant: 'gray',    label: 'Faltou' },

  // ── Pacientes / cadastros ──
  active:   { variant: 'success', label: 'Ativo' },
  inactive: { variant: 'gray',    label: 'Inativo' },

  // ── Colaboradores (Administrativo) ──
  suspended: { variant: 'danger', label: 'Suspenso' },
  invited:   { variant: 'warning', label: 'Convidado' },

  // ── Assinatura do SaaS (Configurações) ──
  past_due: { variant: 'danger', label: 'Inadimplente' },

  // ── Conexão do WhatsApp (Configurações) ──
  connected:    { variant: 'success', label: 'Conectado' },
  disconnected: { variant: 'gray',    label: 'Desconectado' },
  connecting:   { variant: 'warning', label: 'Conectando...' },

  // ── Financeiro ──
  paid:    { variant: 'success', label: 'Pago' },
  pending: { variant: 'warning', label: 'Pendente' },
  overdue: { variant: 'danger',  label: 'Vencido' },

  // ── Orçamentos ──
  // 'pending' já registrado no Financeiro — rótulo "Pendente" serve aos dois.
  approved: { variant: 'success', label: 'Aprovado' },

  // ── Prescrições e documentos do paciente ──
  prescription:    { variant: 'info',    label: 'Receituário' },
  clinical_record: { variant: 'accent',  label: 'Prontuário' },
  certificate:     { variant: 'success', label: 'Atestado' },
  document:        { variant: 'gray',    label: 'Documento' },

  // ── Tarefas ──
  todo:        { variant: 'info',    label: 'A fazer' },
  in_progress: { variant: 'warning', label: 'Em andamento' },
  done:        { variant: 'success', label: 'Concluída' },

  // ── Prioridade de tarefas ──
  high:   { variant: 'danger',  label: 'Alta' },
  medium: { variant: 'warning', label: 'Média' },
  low:    { variant: 'gray',    label: 'Baixa' },

  // ── Tratamentos / odontograma ──
  finished:  { variant: 'success', label: 'Finalizado' },
  open:      { variant: 'warning', label: 'Em aberto' },
  extracted: { variant: 'gray',    label: 'Extraído' },

  // ── Estoque (materiais) ──
  in_stock:     { variant: 'success', label: 'Em estoque' },
  low_stock:    { variant: 'warning', label: 'Estoque baixo' },
  out_of_stock: { variant: 'danger',  label: 'Esgotado' },
  expired:      { variant: 'danger',  label: 'Vencido' },
}
