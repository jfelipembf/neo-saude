import {
  CIBELLY_TOOL_CATALOG, isCibellyToolName, toolNeedsFollowUp,
  type CibellyToolDefinition,
} from './toolCatalog.ts'

export interface OrchestratorToolCall {
  call_id: string
  name: string
  arguments: string
}

export interface OrchestratorSnapshot {
  responseActive: boolean
  responseRequested: boolean
  toolsInFlight: number
  followUpRequested: boolean
  followUpAttempts: number
  phase: 'idle' | 'responding' | 'executing_tools' | 'waiting_follow_up'
  busy: boolean
}

export type FollowUpClaim = 'claimed' | 'blocked' | 'exhausted'

export function isActiveResponseConflict(message: string): boolean {
  return /active response in progress/i.test(message)
}

/**
 * Núcleo determinístico da Cibelly.
 *
 * O modelo escolhe ferramentas; o orquestrador decide o que pode executar,
 * deduplica eventos, espera o lote inteiro e libera no máximo uma continuação.
 */
export class CibellyOrchestrator {
  private responseActive = false
  private responseRequested = false
  private toolsInFlight = 0
  private followUpRequested = false
  private followUpAttempts = 0
  private processedCallIds = new Set<string>()
  private readonly maxFollowUpAttempts: number

  constructor(maxFollowUpAttempts = 3) {
    this.maxFollowUpAttempts = maxFollowUpAttempts
  }

  get tools(): Readonly<Record<string, CibellyToolDefinition>> {
    return CIBELLY_TOOL_CATALOG
  }

  getTool(name: string): CibellyToolDefinition | null {
    return isCibellyToolName(name) ? CIBELLY_TOOL_CATALOG[name] : null
  }

  get snapshot(): OrchestratorSnapshot {
    const phase = this.toolsInFlight > 0
      ? 'executing_tools'
      : this.responseActive
        ? 'responding'
        : this.followUpRequested || this.responseRequested
          ? 'waiting_follow_up'
          : 'idle'
    return {
      responseActive: this.responseActive,
      responseRequested: this.responseRequested,
      toolsInFlight: this.toolsInFlight,
      followUpRequested: this.followUpRequested,
      followUpAttempts: this.followUpAttempts,
      phase,
      busy: phase !== 'idle',
    }
  }

  reset() {
    this.responseActive = false
    this.responseRequested = false
    this.toolsInFlight = 0
    this.followUpRequested = false
    this.followUpAttempts = 0
    this.processedCallIds.clear()
  }

  responseStarted() {
    this.responseActive = true
    this.responseRequested = false
    this.followUpRequested = false
    this.followUpAttempts = 0
  }

  responseFinished() {
    this.responseActive = false
    this.responseRequested = false
  }

  responseFailed(activeResponseConflict: boolean) {
    this.responseActive = activeResponseConflict
    this.responseRequested = false
  }

  requestFollowUp() {
    if (!this.followUpRequested && !this.responseRequested) {
      this.followUpAttempts = 0
    }
    this.followUpRequested = true
  }

  /** Reserva atomicamente a próxima resposta. Chamadas concorrentes recebem
   * `blocked` depois que a primeira reserva `responseRequested`. */
  claimFollowUp(): FollowUpClaim {
    if (!this.followUpRequested) return 'blocked'
    if (this.followUpAttempts >= this.maxFollowUpAttempts) return 'exhausted'
    if (this.responseActive
        || this.responseRequested
        || this.toolsInFlight > 0) return 'blocked'
    this.responseRequested = true
    this.followUpAttempts += 1
    return 'claimed'
  }

  abandonFollowUp() {
    this.responseRequested = false
    this.followUpRequested = false
    this.followUpAttempts = 0
  }

  claimToolCalls<T extends OrchestratorToolCall>(calls: T[]): T[] {
    const accepted = calls.filter(call => {
      if (this.processedCallIds.has(call.call_id)) return false
      this.processedCallIds.add(call.call_id)
      return true
    })
    this.toolsInFlight += accepted.length
    return accepted
  }

  finishTool(
    name: string,
    result: Record<string, unknown>,
    managesFollowUp = true,
  ) {
    this.toolsInFlight = Math.max(0, this.toolsInFlight - 1)
    if (managesFollowUp && toolNeedsFollowUp(name, result)) {
      this.followUpRequested = true
    }
  }
}
