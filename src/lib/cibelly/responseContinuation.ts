export interface RealtimeContinuationState {
  responseActive: boolean
  responseRequested: boolean
  toolsInFlight: number
  followUpRequested: boolean
}

/** A Realtime aceita uma única resposta por vez e só depois de todas as
 * ferramentas do turno devolverem seus resultados. */
export function canCreateFollowUp(state: RealtimeContinuationState): boolean {
  return state.followUpRequested
    && !state.responseActive
    && !state.responseRequested
    && state.toolsInFlight === 0
}

/** O indicador permanece ocupado também no intervalo entre a ferramenta e a
 * resposta seguinte; esse era o momento em que a tela parecia ter parado. */
export function isRealtimeBusy(state: RealtimeContinuationState): boolean {
  return state.responseActive
    || state.responseRequested
    || state.toolsInFlight > 0
    || state.followUpRequested
}

export function isActiveResponseConflict(message: string): boolean {
  return /active response in progress/i.test(message)
}
