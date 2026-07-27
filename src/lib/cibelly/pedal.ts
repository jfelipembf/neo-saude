import type { CibellyListeningMode } from './sessionTypes'
import type { CibellyToolDomain } from './toolCatalog'

export const PATIENT_PEDAL_CODE = 'KeyJ'
export const GENERAL_PEDAL_CODE = 'KeyF'

export function listeningModeFromKey(
  event: Pick<KeyboardEvent, 'code' | 'key'>,
): CibellyListeningMode | null {
  if (event.code === PATIENT_PEDAL_CODE || event.key.toLowerCase() === 'j') {
    return 'patient'
  }
  if (event.code === GENERAL_PEDAL_CODE || event.key.toLowerCase() === 'f') {
    return 'general'
  }
  return null
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable
    || target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement
}

export function pedalTurnInstruction(
  mode: CibellyListeningMode,
): string {
  if (mode === 'patient') {
    return '[CONTROLE DO PEDAL: PACIENTE ATUAL] O áudio a seguir trata somente do paciente que está em atendimento. Não atenda estoque, fornecedores, administração, outro paciente nem assunto geral neste turno. Se a fala pedir algo fora desse escopo, diga apenas: "Use o pedal F para essa demanda."'
  }

  return '[CONTROLE DO PEDAL: MODO GERAL] O áudio a seguir é uma demanda geral ou sobre outra pessoa. Não presuma que o dentista está falando do paciente aberto. Quando a ação depender de um paciente, use somente o nome ou código dito neste áudio; se faltar identificação, pergunte objetivamente.'
}

export function pedalScopeError(
  mode: CibellyListeningMode | null,
  domain: CibellyToolDomain | undefined,
  _toolName: string,
  args: Record<string, unknown>,
): string | null {
  if (mode !== 'patient') return null
  const namesAnotherPatient = typeof args.paciente === 'string'
    && args.paciente.trim().length > 0
  if (domain !== 'inventory'
      && domain !== 'patients'
      && !namesAnotherPatient) return null

  return 'O pedal J atende somente o paciente atual. Use o pedal F para demandas gerais, fornecedores ou outro paciente.'
}
