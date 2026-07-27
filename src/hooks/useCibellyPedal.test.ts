import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useCibellyPedal } from './useCibellyPedal'

function key(type: 'keydown' | 'keyup', code: 'KeyJ' | 'KeyF') {
  window.dispatchEvent(new KeyboardEvent(type, {
    code,
    key: code === 'KeyJ' ? 'j' : 'f',
    bubbles: true,
  }))
}

describe('useCibellyPedal', () => {
  it('escuta apenas entre keydown e keyup', () => {
    const startListening = vi.fn(() => true)
    const stopListening = vi.fn()
    renderHook(() => useCibellyPedal({
      enabled: true,
      patientAvailable: true,
      startListening,
      stopListening,
    }))

    act(() => key('keydown', 'KeyJ'))
    expect(startListening).toHaveBeenCalledWith('patient')
    expect(stopListening).not.toHaveBeenCalled()

    act(() => key('keyup', 'KeyJ'))
    expect(stopListening).toHaveBeenCalledTimes(1)
  })

  it('ignora J sem paciente e mantém F disponível', () => {
    const startListening = vi.fn(() => true)
    const stopListening = vi.fn()
    renderHook(() => useCibellyPedal({
      enabled: true,
      patientAvailable: false,
      startListening,
      stopListening,
    }))

    act(() => key('keydown', 'KeyJ'))
    act(() => key('keyup', 'KeyJ'))
    expect(startListening).not.toHaveBeenCalled()

    act(() => key('keydown', 'KeyF'))
    expect(startListening).toHaveBeenCalledWith('general')
    act(() => key('keyup', 'KeyF'))
    expect(stopListening).toHaveBeenCalledTimes(1)
  })
})
