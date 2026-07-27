import { useEffect, useRef } from 'react'
import {
  isEditableTarget,
  listeningModeFromKey,
} from '@/lib/cibelly/pedal'
import type { CibellyListeningMode } from '@/lib/cibelly/sessionTypes'

interface CibellyPedalOptions {
  enabled: boolean
  patientAvailable: boolean
  startListening: (mode: CibellyListeningMode) => boolean
  stopListening: () => void
}

export function useCibellyPedal({
  enabled,
  patientAvailable,
  startListening,
  stopListening,
}: CibellyPedalOptions): void {
  const activeModeRef = useRef<CibellyListeningMode | null>(null)

  useEffect(() => {
    function release() {
      if (!activeModeRef.current) return
      activeModeRef.current = null
      stopListening()
    }

    function onKeyDown(event: KeyboardEvent) {
      const mode = listeningModeFromKey(event)
      if (!mode || isEditableTarget(event.target)) return
      if (!enabled || (mode === 'patient' && !patientAvailable)) return

      event.preventDefault()
      if (event.repeat || activeModeRef.current) return
      if (startListening(mode)) activeModeRef.current = mode
    }

    function onKeyUp(event: KeyboardEvent) {
      const mode = listeningModeFromKey(event)
      if (!mode || activeModeRef.current !== mode) return
      event.preventDefault()
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
  ])
}
