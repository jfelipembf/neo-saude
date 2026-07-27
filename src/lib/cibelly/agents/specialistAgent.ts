import {
  CIBELLY_TOOL_CATALOG,
  type CibellyToolDomain,
  type CibellyToolName,
} from '../toolCatalog.ts'

export interface CibellySpecialistAgent {
  id: `${CibellyToolDomain}_agent`
  name: string
  domain: CibellyToolDomain
  responsibility: string
  operatingRules: readonly string[]
  tools: readonly CibellyToolName[]
}

interface SpecialistAgentInput {
  name: string
  domain: CibellyToolDomain
  responsibility: string
  operatingRules: readonly string[]
}

export function defineSpecialistAgent(
  input: SpecialistAgentInput,
): CibellySpecialistAgent {
  const tools = (Object.keys(CIBELLY_TOOL_CATALOG) as CibellyToolName[])
    .filter(name => CIBELLY_TOOL_CATALOG[name].domain === input.domain)

  if (tools.length === 0) {
    throw new Error(`O agente ${input.name} não possui ferramentas.`)
  }

  return Object.freeze({
    id: `${input.domain}_agent`,
    ...input,
    operatingRules: Object.freeze([...input.operatingRules]),
    tools: Object.freeze(tools),
  })
}

export function specialistAgentPrompt(agent: CibellySpecialistAgent): string {
  const tools = agent.tools.map(name => {
    const definition = CIBELLY_TOOL_CATALOG[name]
    const confirmation = definition.confirmation === 'tool_managed'
      ? ' A confirmação é controlada pelo retorno da ferramenta.'
      : ''
    return `- ${name}: ${definition.purpose}${confirmation}`
  }).join('\n')

  const rules = agent.operatingRules.map(rule => `- ${rule}`).join('\n')
  return `${agent.name} (${agent.id})
Responsabilidade: ${agent.responsibility}
Ferramentas:
${tools}
Regras:
${rules}`
}
