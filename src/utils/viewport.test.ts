import { describe, expect, it, vi, afterEach } from 'vitest'
import { MOBILE_MAX_WIDTH, isMobileViewport } from './viewport'

/** Troca o matchMedia global por um que responde como uma tela de `width` px.
 *  O setup dos testes instala um mock que responde `false` para tudo; aqui a
 *  consulta é de verdade avaliada contra a largura informada. */
function comLarguraDeTela(width: number) {
  vi.stubGlobal('matchMedia', (query: string) => {
    const limite = Number(/max-width:\s*(\d+)px/.exec(query)?.[1])
    return { matches: Number.isFinite(limite) && width <= limite, media: query }
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('isMobileViewport', () => {
  it('é celular abaixo do corte', () => {
    comLarguraDeTela(375)   // iPhone
    expect(isMobileViewport()).toBe(true)
  })

  it('é celular EXATAMENTE no corte — o mixin do SCSS usa max-width, que inclui o limite', () => {
    comLarguraDeTela(MOBILE_MAX_WIDTH)
    expect(isMobileViewport()).toBe(true)
  })

  it('não é celular um pixel acima do corte', () => {
    comLarguraDeTela(MOBILE_MAX_WIDTH + 1)
    expect(isMobileViewport()).toBe(false)
  })

  it('não é celular no desktop', () => {
    comLarguraDeTela(1440)
    expect(isMobileViewport()).toBe(false)
  })

  it('devolve false sem matchMedia, em vez de estourar', () => {
    // Ambiente sem navegador (SSR, ou jsdom antes do setup): a Agenda tem de
    // abrir na semana, não quebrar na montagem.
    vi.stubGlobal('matchMedia', undefined)
    expect(isMobileViewport()).toBe(false)
  })

  it('o corte é o mesmo de $bp-tablet no SCSS', () => {
    // Guarda contra alguém mudar um lado só. Se este teste falhar, confira
    // src/styles/_breakpoints.scss antes de ajustar o número aqui.
    expect(MOBILE_MAX_WIDTH).toBe(768)
  })
})
