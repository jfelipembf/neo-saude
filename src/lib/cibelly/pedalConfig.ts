import type { CibellyListeningMode } from './sessionTypes'

/**
 * QUAL TECLA CADA BOTÃO DO PEDAL ENVIA.
 *
 * Um pedal Bluetooth se apresenta ao sistema como TECLADO — ele não tem
 * "protocolo de pedal". Cada modelo manda um código diferente: uns mandam
 * PageUp/PageDown, outros setas, outros Enter/Espaço, outros letras. Não há
 * como o app adivinhar, e chutar errado dá um pedal que simplesmente não
 * funciona sem dizer por quê.
 *
 * Por isso a configuração é APRENDIDA: o dentista pisa, o app grava o código.
 *
 * Fica no NAVEGADOR (localStorage) e não no banco: o pedal é do computador,
 * não da clínica. O mesmo dentista noutra máquina tem outro pedal — ou nenhum.
 */

export type PedalActivation = 'hold' | 'toggle'

export interface PedalConfig {
  /** `KeyboardEvent.code` do botão do PACIENTE. */
  patientCode: string
  /** `KeyboardEvent.code` do botão GERAL. */
  generalCode: string
  /**
   * Como o pedal se comporta.
   *
   *  · `hold`   — segura para falar, solta para enviar. É o natural, e o que o
   *    teclado faz.
   *  · `toggle` — pisa para começar, pisa de novo para encerrar. Necessário
   *    para os pedais que mandam um TOQUE (keydown e keyup juntos) mesmo com o
   *    pé no chão: neles o modo `hold` gravaria 30 ms de áudio e encerraria.
   */
  activation: PedalActivation
}

/** Teclado do computador — o padrão que sempre funcionou. */
export const PEDAL_PADRAO: PedalConfig = {
  patientCode: 'KeyJ',
  generalCode: 'KeyF',
  activation: 'hold',
}

const CHAVE = 'neosaude.pedal'

/**
 * Códigos que NÃO podem virar pedal.
 *
 * Sequestrar Tab, Escape ou Enter deixaria o app inoperante para o teclado — e
 * quem configurou o pedal errado não teria como voltar à tela de configuração
 * para corrigir.
 */
const PROIBIDOS = new Set(['Tab', 'Escape', 'Enter', 'NumpadEnter'])

export function pedalCodeProibido(code: string): boolean {
  return PROIBIDOS.has(code)
}

/** Lê a configuração salva; volta ao padrão diante de qualquer coisa estranha. */
export function carregarPedal(): PedalConfig {
  try {
    const cru = localStorage.getItem(CHAVE)
    if (!cru) return PEDAL_PADRAO
    return normalizarPedal(JSON.parse(cru))
  } catch {
    // localStorage bloqueado (aba anônima, política do navegador) não pode
    // derrubar a tela de atendimento — o teclado continua servindo.
    return PEDAL_PADRAO
  }
}

export function salvarPedal(config: PedalConfig): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(normalizarPedal(config)))
  } catch { /* sem persistência: vale só para esta sessão */ }
}

export function esquecerPedal(): void {
  try { localStorage.removeItem(CHAVE) } catch { /* idem */ }
}

/**
 * Garante uma configuração utilizável a partir de qualquer entrada.
 *
 * Os dois botões com o MESMO código é o erro que acontece na prática — o
 * dentista pisa o mesmo pedal duas vezes na captura. Aceitar isso daria um
 * botão que nunca dispara, e o motivo seria invisível.
 */
export function normalizarPedal(bruto: unknown): PedalConfig {
  const o = (bruto ?? {}) as Partial<PedalConfig>
  const patientCode = texto(o.patientCode) ?? PEDAL_PADRAO.patientCode
  let generalCode = texto(o.generalCode) ?? PEDAL_PADRAO.generalCode
  if (generalCode === patientCode) generalCode = PEDAL_PADRAO.generalCode
  if (generalCode === patientCode) generalCode = PEDAL_PADRAO.patientCode

  return {
    patientCode,
    generalCode,
    activation: o.activation === 'toggle' ? 'toggle' : 'hold',
  }
}

function texto(v: unknown): string | null {
  return typeof v === 'string' && v.trim() && !pedalCodeProibido(v) ? v : null
}

/**
 * Qual modo a tecla aciona — ou `null` quando não é do pedal.
 *
 * O teclado (J e F) continua valendo SEMPRE, mesmo com pedal configurado: é o
 * caminho de volta quando o pedal descarrega no meio do atendimento.
 */
export function listeningModeFromPedal(
  event: Pick<KeyboardEvent, 'code' | 'key'>,
  config: PedalConfig,
): CibellyListeningMode | null {
  if (event.code === config.patientCode) return 'patient'
  if (event.code === config.generalCode) return 'general'
  if (event.code === PEDAL_PADRAO.patientCode || event.key.toLowerCase() === 'j') return 'patient'
  if (event.code === PEDAL_PADRAO.generalCode || event.key.toLowerCase() === 'f') return 'general'
  return null
}

/**
 * O pedal manda TOQUE ou aguenta segurar?
 *
 * Medido na captura: o app pede para MANTER pisado, e se o keyup chega em
 * menos de 400 ms o pedal é do tipo que só pulsa. Nesse caso `hold` gravaria
 * um punhado de milissegundos de áudio, e o certo é `toggle`.
 */
export const LIMIAR_TOQUE_MS = 400

export function ativacaoSugerida(duracaoMs: number): PedalActivation {
  return duracaoMs < LIMIAR_TOQUE_MS ? 'toggle' : 'hold'
}

/** 'PageDown' → 'Page Down'; 'KeyJ' → 'J'. O que o dentista vê na tela. */
export function nomeDaTecla(code: string): string {
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`
  return code.replace(/([a-z])([A-Z])/g, '$1 $2')
}
