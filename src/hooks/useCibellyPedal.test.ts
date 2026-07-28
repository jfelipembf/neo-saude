import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TOGGLE_DEBOUNCE_MS, useCibellyPedal } from './useCibellyPedal'

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

/**
 * PEDAL QUE PULSA — o caso do pedal Bluetooth real deste consultório.
 *
 * Ele não sustenta a tecla: manda keydown e keyup no mesmo instante, mesmo com
 * o pé no chão. Em "segurar para falar" isso gravaria alguns milissegundos de
 * áudio; o modo alternado existe para ele.
 */
describe('modo alternado (pedal que pulsa)', () => {
  const toggle = { patientCode: 'PageDown', generalCode: 'PageUp', activation: 'toggle' as const }

  function pulso(code: string) {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }))
    window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }))
  }

  it('um pisão liga e continua ligado depois do keyup', () => {
    const start = vi.fn(() => true)
    const stop = vi.fn()
    renderHook(() => useCibellyPedal({
      enabled: true, patientAvailable: true,
      startListening: start, stopListening: stop, config: toggle,
    }))

    act(() => pulso('PageDown'))
    expect(start).toHaveBeenCalledWith('patient')
    // O soltar NÃO encerra: quem encerra é o próximo pisão.
    expect(stop).not.toHaveBeenCalled()
  })

  // A trava que mais importa: pedal com repique manda dois eventos por pisada,
  // e sem ela o segundo desliga o que o primeiro ligou — o dentista pisa e
  // nada acontece.
  it('repique de contato não desliga o que acabou de ligar', () => {
    const start = vi.fn(() => true)
    const stop = vi.fn()
    renderHook(() => useCibellyPedal({
      enabled: true, patientAvailable: true,
      startListening: start, stopListening: stop, config: toggle,
    }))

    act(() => { pulso('PageDown'); pulso('PageDown') })
    expect(start).toHaveBeenCalledTimes(1)
    expect(stop).not.toHaveBeenCalled()
  })

  // O debounce mede com `performance.now()`, então é ele que o teste avança —
  // `vi.useFakeTimers` não mexe nesse relógio.
  it('pisar o OUTRO botão troca de modo, passada a janela do repique', () => {
    const start = vi.fn(() => true)
    const stop = vi.fn()
    let agora = 0
    const relogio = vi.spyOn(performance, 'now').mockImplementation(() => agora)

    renderHook(() => useCibellyPedal({
      enabled: true, patientAvailable: true,
      startListening: start, stopListening: stop, config: toggle,
    }))

    act(() => pulso('PageDown'))
    expect(start).toHaveBeenLastCalledWith('patient')

    agora += TOGGLE_DEBOUNCE_MS + 1
    act(() => pulso('PageUp'))
    // Encerra o modo anterior e abre o novo — o dentista mudou de assunto,
    // não errou o pé.
    expect(stop).toHaveBeenCalled()
    expect(start).toHaveBeenLastCalledWith('general')

    relogio.mockRestore()
  })
})

/**
 * PULSO NO MODO "SEGURAR" — o caso relatado no consultório.
 *
 * O dentista pisou uma vez, sem segurar, e a escuta encerrou na hora. A causa
 * é o pedal que manda keydown e keyup juntos: em "segurar para falar" isso
 * grava alguns milissegundos. O hook passou a reconhecer o pulso e manter a
 * escuta aberta até o próximo pisão, SEM depender de configuração.
 */
describe('pulso no modo segurar (latch automático)', () => {
  const hold = { patientCode: 'PageDown', generalCode: 'PageUp', activation: 'hold' as const }

  function montar() {
    const start = vi.fn(() => true)
    const stop = vi.fn()
    renderHook(() => useCibellyPedal({
      enabled: true, patientAvailable: true,
      startListening: start, stopListening: stop, config: hold,
    }))
    return { start, stop }
  }

  const down = (code: string) => window.dispatchEvent(new KeyboardEvent('keydown', { code }))
  const up = (code: string) => window.dispatchEvent(new KeyboardEvent('keyup', { code }))

  it('keyup imediato NÃO encerra a escuta', () => {
    let agora = 1000
    const relogio = vi.spyOn(performance, 'now').mockImplementation(() => agora)
    const { start, stop } = montar()

    act(() => { down('PageDown'); agora += 20; up('PageDown') })
    expect(start).toHaveBeenCalledWith('patient')
    expect(stop).not.toHaveBeenCalled()

    relogio.mockRestore()
  })

  it('o pisão seguinte é que encerra', () => {
    let agora = 1000
    const relogio = vi.spyOn(performance, 'now').mockImplementation(() => agora)
    const { stop } = montar()

    act(() => { down('PageDown'); agora += 20; up('PageDown') })
    agora += TOGGLE_DEBOUNCE_MS + 1
    act(() => { down('PageDown'); agora += 20; up('PageDown') })
    expect(stop).toHaveBeenCalledTimes(1)

    relogio.mockRestore()
  })

  // Segurar de verdade continua funcionando: quem usa o TECLADO não pode ter o
  // comportamento trocado embaixo de si.
  it('segurar de verdade encerra no soltar, como sempre', () => {
    let agora = 1000
    const relogio = vi.spyOn(performance, 'now').mockImplementation(() => agora)
    const { start, stop } = montar()

    act(() => { down('PageDown'); agora += 1200; up('PageDown') })
    expect(start).toHaveBeenCalledWith('patient')
    expect(stop).toHaveBeenCalledTimes(1)

    relogio.mockRestore()
  })
})

/**
 * A TELA NÃO PODE ROLAR quando o pedal é pisado.
 *
 * O código aprendido costuma ser PageDown ou uma seta. Com a Cibelly
 * desconectada, o hook retornava antes de prevenir o padrão — e o navegador
 * fazia o que a tecla faz: rolava a página. A tecla é nossa a partir do
 * momento em que é reconhecida como pedal, mesmo quando não há o que acionar.
 */
describe('pedal não rola a página', () => {
  const config = { patientCode: 'PageDown', generalCode: 'PageUp', activation: 'hold' as const }

  function pisar(code: string, opts: Parameters<typeof useCibellyPedal>[0]) {
    renderHook(() => useCibellyPedal(opts))
    const ev = new KeyboardEvent('keydown', { code, cancelable: true })
    act(() => { window.dispatchEvent(ev) })
    return ev
  }

  it('previne o padrão mesmo com a sessão desconectada', () => {
    const ev = pisar('PageDown', {
      enabled: false, patientAvailable: false,
      startListening: () => true, stopListening: () => {}, config,
    })
    expect(ev.defaultPrevented).toBe(true)
  })

  it('previne o padrão no pedal do paciente sem paciente aberto', () => {
    const ev = pisar('PageDown', {
      enabled: true, patientAvailable: false,
      startListening: () => true, stopListening: () => {}, config,
    })
    expect(ev.defaultPrevented).toBe(true)
  })

  // Tecla que não é do pedal segue livre: prevenir tudo quebraria a navegação
  // por teclado da página inteira.
  it('tecla de fora continua rolando a página', () => {
    const ev = pisar('ArrowDown', {
      enabled: true, patientAvailable: true,
      startListening: () => true, stopListening: () => {}, config,
    })
    expect(ev.defaultPrevented).toBe(false)
  })
})
