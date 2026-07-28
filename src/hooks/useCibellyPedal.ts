import { useEffect, useRef } from 'react'
import { isEditableTarget } from '@/lib/cibelly/pedal'
import { PEDAL_PADRAO, listeningModeFromPedal } from '@/lib/cibelly/pedalConfig'
import type { PedalConfig } from '@/lib/cibelly/pedalConfig'
import type { CibellyListeningMode } from '@/lib/cibelly/sessionTypes'

/**
 * Janela em que um segundo pisão é ignorado, no modo alternado.
 *
 * Maior que o repique de contato de um pedal (dezenas de ms) e menor que o
 * menor intervalo humano entre duas pisadas de propósito.
 */
export const TOGGLE_DEBOUNCE_MS = 250

/**
 * Abaixo disto, o "soltar" não foi soltar — foi um PULSO do pedal.
 *
 * Ninguém consegue segurar e soltar de propósito em menos de 150 ms, e ainda
 * que conseguisse, o áudio desse intervalo não contém uma frase. Então quando
 * o keyup chega tão rápido, encerrar a escuta é sempre a leitura errada: o
 * hardware é que não sustenta a tecla.
 *
 * A escuta LATCHA — fica aberta até o próximo pisão. É o modo alternado
 * acontecendo sozinho, sem depender de o dentista ter configurado nada.
 */
export const PULSO_MS = 150

/**
 * O código veio de um PEDAL aprendido, e não do teclado?
 *
 * J e F sempre valem (é o caminho de volta quando a bateria acaba), mas eles
 * são TECLAS: seguram de verdade. Só o código aprendido ganha o tratamento de
 * pulso.
 */
function ehCodigoDePedal(code: string, config: PedalConfig): boolean {
  if (code === PEDAL_PADRAO.patientCode || code === PEDAL_PADRAO.generalCode) return false
  return code === config.patientCode || code === config.generalCode
}

interface CibellyPedalOptions {
  enabled: boolean
  patientAvailable: boolean
  startListening: (mode: CibellyListeningMode) => boolean
  stopListening: () => void
  /**
   * Qual tecla cada botão do pedal envia, e se ele sustenta a tecla.
   *
   * Omitido = teclado (J e F), que é o que sempre funcionou e continua
   * valendo mesmo com pedal configurado.
   */
  config?: PedalConfig
}

export function useCibellyPedal({
  enabled,
  patientAvailable,
  startListening,
  stopListening,
  config = PEDAL_PADRAO,
}: CibellyPedalOptions): void {
  const activeModeRef = useRef<CibellyListeningMode | null>(null)
  /**
   * Quando o último pisão foi processado, no modo alternado.
   *
   * Pedal que PULSA costuma mandar mais de um evento por pisada — repique do
   * contato, ou o firmware emitindo press e release como dois pulsos. Sem esta
   * trava, o segundo evento chega milissegundos depois do primeiro e desliga
   * o que o primeiro acabou de ligar: o dentista pisa e nada acontece.
   */
  // `-Infinity` e não 0: `performance.now()` também começa perto de zero, e um
  // pisão nos primeiros 250 ms depois de a página carregar era engolido pelo
  // próprio debounce. Achado por teste.
  const ultimoToggleRef = useRef(-Infinity)
  /** Quando a escuta atual começou — para reconhecer o pulso no keyup. */
  const inicioRef = useRef(0)
  /** A escuta foi LATCHADA por pulso: o próximo pisão é que encerra. */
  const latchadoRef = useRef(false)
  /**
   * A escuta atual veio do PEDAL (código aprendido) ou do teclado?
   *
   * Só o pedal ganha o latch automático. O teclado sustenta a tecla de
   * verdade — um toque rápido em J tem de encerrar no soltar, como sempre
   * encerrou, senão o comportamento muda embaixo de quem nunca usou pedal.
   */
  const doPedalRef = useRef(false)

  useEffect(() => {
    function release() {
      if (!activeModeRef.current) return
      activeModeRef.current = null
      latchadoRef.current = false
      stopListening()
    }

    function onKeyDown(event: KeyboardEvent) {
      const mode = listeningModeFromPedal(event, config)
      if (!mode || isEditableTarget(event.target)) return

      /**
       * `preventDefault` ANTES de checar se a sessão está pronta.
       *
       * Estava depois, e por isso pisar o pedal com a Cibelly desconectada
       * ROLAVA A PÁGINA: o código aprendido costuma ser PageDown ou seta, e
       * sem prevenir o navegador faz o que a tecla faz. A tecla é nossa a
       * partir do momento em que é reconhecida como pedal — mesmo quando não
       * há o que acionar.
       */
      event.preventDefault()
      if (!enabled || (mode === 'patient' && !patientAvailable)) return
      if (event.repeat) return

      // ALTERNAR: pisar de novo encerra. É o modo dos pedais que só pulsam —
      // neles o keyup chega junto com o keydown, e "segurar para falar"
      // gravaria alguns milissegundos.
      if (config.activation === 'toggle') {
        // 250 ms é maior que qualquer repique de contato e menor que o menor
        // intervalo humano entre duas pisadas propositais.
        const agora = performance.now()
        if (agora - ultimoToggleRef.current < TOGGLE_DEBOUNCE_MS) return
        ultimoToggleRef.current = agora

        if (activeModeRef.current === mode) { release(); return }
        // Pisar o OUTRO botão com um já ativo troca de modo em vez de ignorar:
        // o dentista mudou de assunto, não errou o pé.
        if (activeModeRef.current) release()
        if (startListening(mode)) activeModeRef.current = mode
        return
      }

      // MODO SEGURAR. Já escutando? Se foi latchado por pulso, este pisão é o
      // que encerra — senão o dentista não teria como parar.
      if (activeModeRef.current) {
        if (latchadoRef.current && activeModeRef.current === mode
            && performance.now() - ultimoToggleRef.current > TOGGLE_DEBOUNCE_MS) {
          ultimoToggleRef.current = performance.now()
          release()
        }
        return
      }
      inicioRef.current = performance.now()
      ultimoToggleRef.current = inicioRef.current
      doPedalRef.current = ehCodigoDePedal(event.code, config)
      if (startListening(mode)) activeModeRef.current = mode
    }

    function onKeyUp(event: KeyboardEvent) {
      const mode = listeningModeFromPedal(event, config)
      if (!mode || isEditableTarget(event.target)) return
      event.preventDefault()
      // No modo alternado o soltar não encerra nada — quem encerra é o próximo
      // pisão.
      if (config.activation === 'toggle') return
      if (activeModeRef.current !== mode) return

      /**
       * PULSO: o pedal não sustenta a tecla.
       *
       * Encerrar aqui gravaria alguns milissegundos e o dentista veria a
       * escuta morrer sozinha — foi exatamente o que aconteceu no consultório.
       * Em vez disso a escuta fica aberta até o próximo pisão, que é o
       * comportamento que o hardware permite.
       */
      if (doPedalRef.current && performance.now() - inicioRef.current < PULSO_MS) {
        latchadoRef.current = true
        return
      }
      release()
    }

    function onVisibilityChange() {
      if (document.hidden) release()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', release)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      release()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', release)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [
    enabled,
    patientAvailable,
    startListening,
    stopListening,
    config,
  ])
}
