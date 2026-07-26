import { CibellyOrchestrator } from './orchestrator.ts'
import {
  specialistAgentsPrompt,
  type CibellySpecialistAgent,
} from './agents/index.ts'
import {
  isCibellyToolName,
  type CibellyToolDefinition,
  type CibellyToolDomain,
  type CibellyToolName,
} from './toolCatalog.ts'

export interface DelegatedToolCall {
  agent: CibellySpecialistAgent
  name: CibellyToolName
  definition: CibellyToolDefinition
  args: Record<string, unknown>
}

export type SpecialistToolExecutor = (
  call: DelegatedToolCall,
) => Promise<Record<string, unknown>>

export type CibellySpecialistExecutors = Record<
  CibellyToolDomain,
  SpecialistToolExecutor
>

export class CibellyAgent {
  readonly name = 'Cibelly'
  readonly role = 'Interface de voz clínica do Neo Saúde'
  readonly orchestrator = new CibellyOrchestrator()

  reset() {
    this.orchestrator.reset()
  }

  async executeTool(
    name: string,
    args: Record<string, unknown>,
    executors: CibellySpecialistExecutors,
  ): Promise<Record<string, unknown>> {
    const agent = this.orchestrator.getAgentForTool(name)
    const definition = this.orchestrator.getTool(name)
    if (!agent || !definition || !isCibellyToolName(name)) {
      return { ok: false, erro: `Ferramenta desconhecida: ${name}` }
    }

    return executors[agent.domain]({
      agent,
      name,
      definition,
      args,
    })
  }
}

export function cibellyAgentPrompt(): string {
  return `ARQUITETURA DA CIBELLY:
Você é a Cibelly, a interface de voz clínica. Você interpreta a fala e escolhe ferramentas.
O Orquestrador Cibelly escolhe o subagente responsável, executa, deduplica, agrupa ferramentas, controla confirmações e continua o fluxo.
Os subagentes não falam diretamente com o dentista. Eles devolvem resultados para você sintetizar em uma resposta curta.
Um pedido composto pode passar por mais de um subagente no mesmo turno. Não peça ao dentista para fazer a transferência entre agentes.
Depois de chamar uma ferramenta, nunca peça ao dentista para dizer "continue", "solicite" ou "envie" só para o fluxo prosseguir. O orquestrador devolve o resultado e abre sua continuação automaticamente.
Quando uma ferramenta exigir confirmação, faça a pergunta objetiva indicada no retorno e aguarde apenas a confirmação real.

SUBAGENTES E FERRAMENTAS DISPONÍVEIS:
${specialistAgentsPrompt()}`
}
