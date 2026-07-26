import { communicationAgent } from './communicationAgent.ts'
import { documentsAgent } from './documentsAgent.ts'
import { inventoryAgent } from './inventoryAgent.ts'
import { odontogramAgent } from './odontogramAgent.ts'
import { recordsAgent } from './recordsAgent.ts'
import { scheduleAgent } from './scheduleAgent.ts'
import {
  specialistAgentPrompt,
  type CibellySpecialistAgent,
} from './specialistAgent.ts'
import {
  CIBELLY_TOOL_CATALOG,
  isCibellyToolName,
  type CibellyToolDomain,
} from '../toolCatalog.ts'

export const CIBELLY_SPECIALIST_AGENTS = Object.freeze([
  odontogramAgent,
  recordsAgent,
  scheduleAgent,
  inventoryAgent,
  communicationAgent,
  documentsAgent,
] as const)

const agentsByDomain = new Map<CibellyToolDomain, CibellySpecialistAgent>(
  CIBELLY_SPECIALIST_AGENTS.map(agent => [agent.domain, agent]),
)

function assertSpecialistCoverage() {
  const catalogDomains = new Set(
    Object.values(CIBELLY_TOOL_CATALOG).map(tool => tool.domain),
  )
  const duplicatedDomains = CIBELLY_SPECIALIST_AGENTS
    .filter((agent, index, agents) =>
      agents.findIndex(candidate => candidate.domain === agent.domain) !== index)
    .map(agent => agent.domain)
  const missingDomains = [...catalogDomains]
    .filter(domain => !agentsByDomain.has(domain))

  if (duplicatedDomains.length || missingDomains.length) {
    throw new Error(JSON.stringify({
      error: 'Cobertura dos agentes especialistas está inválida.',
      duplicatedDomains,
      missingDomains,
    }))
  }
}

assertSpecialistCoverage()

export function getSpecialistAgentByTool(
  toolName: string,
): CibellySpecialistAgent | null {
  if (!isCibellyToolName(toolName)) return null
  return agentsByDomain.get(CIBELLY_TOOL_CATALOG[toolName].domain) ?? null
}

export function specialistAgentsPrompt(): string {
  return CIBELLY_SPECIALIST_AGENTS.map(specialistAgentPrompt).join('\n\n')
}

export type { CibellySpecialistAgent } from './specialistAgent.ts'
