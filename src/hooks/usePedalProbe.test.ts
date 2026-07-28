import { describe, expect, it } from 'vitest'
import { vereditoDaSonda } from './usePedalProbe'
import type { EventoDaSonda } from './usePedalProbe'

const ev = (tipo: string, detalhe: string): EventoDaSonda =>
  ({ seq: 1, tipo, detalhe, emSegundos: 0 })

describe('vereditoDaSonda', () => {
  // As quatro causas de "não acontece nada" têm a mesma aparência na tela e
  // correções completamente diferentes. É isto que a sonda existe para separar.
  it('nada recebido: o problema está antes do navegador', () => {
    expect(vereditoDaSonda([])).toContain('Nada chegou ao navegador')
  })

  it('tecla com código: dá para aprender', () => {
    const v = vereditoDaSonda([ev('keydown', 'code="PageDown" key="PageDown"')])
    expect(v).toContain('TECLADO')
    expect(v).toContain('Aprender')
  })

  // Tecla de mídia chega como evento, mas sem `code` — e um `code` vazio não
  // serve de atalho. É o caso que mais confunde: "está mandando algo".
  it('tecla sem código: modo mídia', () => {
    const v = vereditoDaSonda([ev('keydown', 'code="(vazio)" key="MediaPlayPause"')])
    expect(v).toContain('mídia')
    expect(v).not.toContain('Aprender')
  })

  it('controle de jogo', () => {
    expect(vereditoDaSonda([ev('gamepad', 'botão 0 de "Pedal BT"')])).toContain('CONTROLE DE JOGO')
  })

  it('roda do mouse', () => {
    expect(vereditoDaSonda([ev('wheel', 'deltaY=100')])).toContain('ROLAGEM')
  })

  it('clique de mouse', () => {
    expect(vereditoDaSonda([ev('mousedown', 'botão 0')])).toContain('MOUSE')
  })

  // Tecla ganha de qualquer outro sinal: um pedal pode mandar clique JUNTO com
  // a tecla, e nesse caso ele serve — dizer "está em modo mouse" mandaria o
  // dentista mexer num pedal que já funciona.
  it('tecla utilizável vence ruído de mouse na mesma sondagem', () => {
    const v = vereditoDaSonda([
      ev('mousedown', 'botão 0'),
      ev('keydown', 'code="PageUp" key="PageUp"'),
    ])
    expect(v).toContain('TECLADO')
  })
})
