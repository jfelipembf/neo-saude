export type CibellyToolDomain =
  | 'odontogram'
  | 'patients'
  | 'records'
  | 'schedule'
  | 'inventory'
  | 'communication'
  | 'documents'

export type ToolContinuationPolicy = 'always' | 'on_failure' | 'on_attention'
export type ToolConfirmationPolicy = 'none' | 'tool_managed'

export interface CibellyToolDefinition {
  domain: CibellyToolDomain
  purpose: string
  continuation: ToolContinuationPolicy
  confirmation: ToolConfirmationPolicy
}

export const CIBELLY_TOOL_CATALOG = {
  marcar_dente: {
    domain: 'odontogram',
    purpose: 'Registrar achados clínicos em um ou mais dentes.',
    continuation: 'on_attention',
    confirmation: 'none',
  },
  restaurar_dente: {
    domain: 'odontogram',
    purpose: 'Remover a ausência e devolver a presença visual do dente.',
    continuation: 'on_failure',
    confirmation: 'none',
  },
  apagar_marcacao: {
    domain: 'odontogram',
    purpose: 'Remover um achado específico ou limpar marcações.',
    continuation: 'on_failure',
    confirmation: 'none',
  },
  desfazer_ultima_marcacao: {
    domain: 'odontogram',
    purpose: 'Voltar o odontograma exatamente ao estado anterior.',
    continuation: 'on_failure',
    confirmation: 'none',
  },
  ler_odontograma: {
    domain: 'odontogram',
    purpose: 'Ler os achados atuais do odontograma.',
    continuation: 'always',
    confirmation: 'none',
  },
  consultar_pacientes: {
    domain: 'patients',
    purpose: 'Listar e localizar pacientes por nome, nome comum, código ou situação.',
    continuation: 'always',
    confirmation: 'none',
  },
  consultar_historico: {
    domain: 'records',
    purpose: 'Consultar histórico clínico, documentos e lembretes.',
    continuation: 'always',
    confirmation: 'none',
  },
  criar_lembrete: {
    domain: 'records',
    purpose: 'Criar um lembrete para o próximo atendimento.',
    continuation: 'always',
    confirmation: 'none',
  },
  concluir_lembrete: {
    domain: 'records',
    purpose: 'Marcar um lembrete clínico como resolvido.',
    continuation: 'always',
    confirmation: 'none',
  },
  consultar_agenda: {
    domain: 'schedule',
    purpose: 'Consultar consultas existentes e horários disponíveis.',
    continuation: 'always',
    confirmation: 'none',
  },
  agendar_consulta: {
    domain: 'schedule',
    purpose: 'Agendar uma consulta para o paciente em atendimento.',
    continuation: 'always',
    confirmation: 'tool_managed',
  },
  cancelar_consulta: {
    domain: 'schedule',
    purpose: 'Preparar e confirmar o cancelamento de uma consulta.',
    continuation: 'always',
    confirmation: 'tool_managed',
  },
  consultar_materiais: {
    domain: 'inventory',
    purpose: 'Consultar estoque, mínimos e fornecedores.',
    continuation: 'always',
    confirmation: 'none',
  },
  registrar_material_usado: {
    domain: 'inventory',
    purpose: 'Dar baixa nos materiais consumidos no atendimento.',
    continuation: 'always',
    confirmation: 'none',
  },
  solicitar_orcamento_fornecedor: {
    domain: 'inventory',
    purpose: 'Preparar e enviar orçamento agrupado aos fornecedores.',
    continuation: 'always',
    confirmation: 'tool_managed',
  },
  enviar_mensagem_paciente: {
    domain: 'communication',
    purpose: 'Preparar e enviar uma mensagem de WhatsApp ao paciente.',
    continuation: 'always',
    confirmation: 'tool_managed',
  },
  emitir_documento: {
    domain: 'documents',
    purpose: 'Emitir receita, atestado, declaração ou pedido de exame.',
    continuation: 'always',
    confirmation: 'none',
  },
} as const satisfies Record<string, CibellyToolDefinition>

export type CibellyToolName = keyof typeof CIBELLY_TOOL_CATALOG

const DOMAIN_LABELS: Record<CibellyToolDomain, string> = {
  odontogram: 'ODONTOGRAMA',
  patients: 'PACIENTES',
  records: 'PRONTUÁRIO',
  schedule: 'AGENDA',
  inventory: 'ESTOQUE E COMPRAS',
  communication: 'COMUNICAÇÃO',
  documents: 'DOCUMENTOS',
}

export function isCibellyToolName(name: string): name is CibellyToolName {
  return Object.hasOwn(CIBELLY_TOOL_CATALOG, name)
}

export function toolNeedsFollowUp(
  name: string,
  result: Record<string, unknown>,
): boolean {
  if (!isCibellyToolName(name)) return true
  const policy = CIBELLY_TOOL_CATALOG[name].continuation
  if (policy === 'always') return true
  if (result.ok !== true) return true
  if (policy === 'on_failure') return false
  return Array.isArray(result.recusados) && result.recusados.length > 0
}

export function cibellyCapabilitiesPrompt(): string {
  const groups = new Map<CibellyToolDomain, string[]>()
  for (const [name, definition] of Object.entries(CIBELLY_TOOL_CATALOG)) {
    const domain = definition.domain
    const items = groups.get(domain) ?? []
    const confirmation = definition.confirmation === 'tool_managed'
      ? ' A confirmação é controlada pelo retorno da ferramenta.'
      : ''
    items.push(`${name}: ${definition.purpose}${confirmation}`)
    groups.set(domain, items)
  }

  return [...groups.entries()]
    .map(([domain, items]) => `${DOMAIN_LABELS[domain]}:\n${items.map(item => `- ${item}`).join('\n')}`)
    .join('\n\n')
}
