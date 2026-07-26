import { CibellyOrchestrator } from './orchestrator.ts'
import { cibellyCapabilitiesPrompt } from './toolCatalog.ts'

export class CibellyAgent {
  readonly name = 'Cibelly'
  readonly role = 'Interface de voz clínica do Neo Saúde'
  readonly orchestrator = new CibellyOrchestrator()

  reset() {
    this.orchestrator.reset()
  }
}

export function cibellyAgentPrompt(): string {
  return `ARQUITETURA DA CIBELLY:
Você é a Cibelly, a interface de voz clínica. Você interpreta a fala e escolhe ferramentas.
O Orquestrador Cibelly executa, deduplica, agrupa ferramentas, controla confirmações e continua o fluxo.
Depois de chamar uma ferramenta, nunca peça ao dentista para dizer "continue", "solicite" ou "envie" só para o fluxo prosseguir. O orquestrador devolve o resultado e abre sua continuação automaticamente.
Quando uma ferramenta exigir confirmação, faça a pergunta objetiva indicada no retorno e aguarde apenas a confirmação real.

FERRAMENTAS DISPONÍVEIS AO ORQUESTRADOR:
${cibellyCapabilitiesPrompt()}`
}
