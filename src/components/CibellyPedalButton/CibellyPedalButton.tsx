import { useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { IconMic } from '@/components/icons'
import { Spinner } from '@/components/Spinner/Spinner'
import type { CibellyListeningMode } from '@/lib/cibelly/sessionTypes'
import styles from './CibellyPedalButton.module.scss'

interface CibellyPedalButtonProps {
  mode: CibellyListeningMode
  /** Sessão pronta para capturar áudio — normalmente `cibelly.status === 'listening'`. */
  enabled: boolean
  /** Este é o modo sendo capturado agora (o dedo está segurando o botão). */
  active: boolean
  /** A Cibelly está processando o que acabou de ouvir — não adianta segurar de novo ainda. */
  processing: boolean
  onStart: (mode: CibellyListeningMode) => boolean
  onStop: () => void
  label: string
  disabledReason?: string
}

/**
 * BOTÃO NA TELA PARA O PEDAL FÍSICO QUE AINDA NÃO CHEGOU.
 *
 * Mesma semântica do pedal de teclado (ver useCibellyPedal.ts): segura para
 * falar, solta para a Cibelly processar. Pointer Events cobrem mouse, caneta
 * e dedo com o mesmo par de handlers — sem ramos separados de touch/mouse —,
 * e `setPointerCapture` mantém os eventos chegando neste botão mesmo se o
 * dedo escorregar para fora dele enquanto está pressionado.
 */
export function CibellyPedalButton({
  mode,
  enabled,
  active,
  processing,
  onStart,
  onStop,
  label,
  disabledReason,
}: CibellyPedalButtonProps) {
  const pressedRef = useRef(false)

  // Rede de segurança: se o dedo sai da tela trocando de app/aba, o
  // `pointerup` correspondente nunca chega — sem isto o microfone ficaria
  // capturando até o próximo toque no botão.
  useEffect(() => {
    function liberar() {
      if (!pressedRef.current) return
      pressedRef.current = false
      onStop()
    }
    function aoTrocarVisibilidade() {
      if (document.hidden) liberar()
    }
    window.addEventListener('blur', liberar)
    document.addEventListener('visibilitychange', aoTrocarVisibilidade)
    return () => {
      liberar()
      window.removeEventListener('blur', liberar)
      document.removeEventListener('visibilitychange', aoTrocarVisibilidade)
    }
  }, [onStop])

  function aoPressionar(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!enabled || pressedRef.current) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    if (onStart(mode)) pressedRef.current = true
  }

  function aoSoltar(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!pressedRef.current) return
    event.preventDefault()
    pressedRef.current = false
    onStop()
  }

  return (
    <button
      type="button"
      className={`${styles.botao} ${active ? styles.botaoAtivo : ''}`}
      disabled={!enabled}
      title={enabled ? label : disabledReason}
      aria-label={label}
      aria-pressed={active}
      onPointerDown={aoPressionar}
      onPointerUp={aoSoltar}
      onPointerCancel={aoSoltar}
      onContextMenu={event => event.preventDefault()}
    >
      {processing ? <Spinner size="sm" /> : <IconMic />}
    </button>
  )
}
