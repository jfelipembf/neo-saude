import {
  CibellyOrchestrator,
  toolResultNeedsConfirmation,
} from './orchestrator.ts'
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

interface ConfirmedExecution {
  expiresAt: number
  promise: Promise<Record<string, unknown>>
}

const CONFIRMED_EXECUTION_TTL_MS = 30_000

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, stableValue(child)]),
  )
}

function confirmedExecutionKey(
  name: CibellyToolName,
  args: Record<string, unknown>,
): string {
  return `${name}:${JSON.stringify(stableValue(args))}`
}

export class CibellyAgent {
  readonly name = 'Cibelly'
  readonly role = 'Interface de voz clínica do Neo Saúde'
  readonly orchestrator = new CibellyOrchestrator()
  private confirmedExecutions = new Map<string, ConfirmedExecution>()

  reset() {
    this.orchestrator.reset()
    this.confirmedExecutions.clear()
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

    const execute = async () => {
      const result = await executors[agent.domain]({
        agent,
        name,
        definition,
        args,
      })
      this.orchestrator.observeToolResult(name, args, result)
      return result
    }

    if (definition.confirmation !== 'tool_managed' || args.confirmado !== true) {
      return execute()
    }

    const now = Date.now()
    for (const [key, execution] of this.confirmedExecutions) {
      if (execution.expiresAt < now) this.confirmedExecutions.delete(key)
    }

    const key = confirmedExecutionKey(name, args)
    const existing = this.confirmedExecutions.get(key)
    if (existing) return existing.promise

    const promise = execute()
    this.confirmedExecutions.set(key, {
      expiresAt: now + CONFIRMED_EXECUTION_TTL_MS,
      promise,
    })

    void promise.then(
      result => {
        if (toolResultNeedsConfirmation(result)) {
          this.confirmedExecutions.delete(key)
        }
      },
      () => {
        this.confirmedExecutions.delete(key)
      },
    )
    return promise
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

IDENTIDADES — NÃO MISTURE:
- Quem fala com você e responde às suas perguntas é o DENTISTA, nunca o paciente.
- Somente o nome do dentista pode ser usado como vocativo ao pedir confirmação.
- O nome do paciente identifica o prontuário aberto. Não o use para chamar o dentista.
- Em estoque, fornecedores e orçamento, o paciente não participa. Pergunte apenas "posso enviar?", sem nome de paciente.
- Se o nome do dentista não estiver disponível, não use nenhum nome como vocativo.

SUBAGENTES E FERRAMENTAS DISPONÍVEIS:
${specialistAgentsPrompt()}`
}
