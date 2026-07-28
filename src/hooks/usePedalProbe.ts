import { useEffect, useRef, useState } from 'react'

/**
 * SONDA DO PEDAL — escuta TUDO e conta o que chegou.
 *
 * Existe porque "não acontece nada" não é diagnóstico: pode ser pedal
 * desconectado, pedal em modo mídia (que o navegador não entrega), pedal
 * emulando mouse, ou pedal aparecendo como controle de jogo. As quatro causas
 * têm a mesma aparência na tela e correções completamente diferentes.
 *
 * Só o que o NAVEGADOR vê. Se o aparelho não chega até aqui, o ajuste é no
 * pedal (a maioria tem uma combinação de teclas que troca entre modo
 * teclado/mídia/mouse) e nenhuma linha de código resolve.
 */

export interface EventoDaSonda {
  /** Contador para servir de chave na lista sem depender de relógio. */
  seq: number
  tipo: string
  detalhe: string
  /** Segundos desde o início da sondagem — dá a cadência do pedal. */
  emSegundos: number
}

/** Teclado: o caso normal. Mouse e roda: pedal emulando ponteiro. */
const EVENTOS_DOM = [
  'keydown', 'keyup', 'keypress',
  'mousedown', 'mouseup', 'auxclick', 'wheel',
] as const

const LIMITE = 12

export function usePedalProbe(ativo: boolean) {
  const [eventos, setEventos] = useState<EventoDaSonda[]>([])
  const seqRef = useRef(0)
  const inicioRef = useRef(0)

  /**
   * Zera ao LIGAR a sondagem, derivado em render.
   *
   * Não dentro do efeito: `setState` síncrono no corpo dele dispara uma
   * cascata de renders (é o que o eslint cobra), e o efeito rodaria depois da
   * primeira pintura — a lista antiga apareceria por um quadro.
   */
  const [ativoEm, setAtivoEm] = useState(false)
  if (ativo !== ativoEm) {
    setAtivoEm(ativo)
    if (ativo) setEventos([])
  }

  useEffect(() => {
    if (!ativo) return
    // Os contadores são refs e por isso zeram AQUI, não no bloco acima:
    // escrever em ref durante o render é o que o eslint (react-hooks/refs)
    // proíbe — e com razão, porque o render pode ser descartado.
    inicioRef.current = performance.now()
    seqRef.current = 0

    function registrar(tipo: string, detalhe: string) {
      seqRef.current += 1
      const evento: EventoDaSonda = {
        seq: seqRef.current,
        tipo,
        detalhe,
        emSegundos: Math.round((performance.now() - inicioRef.current) / 100) / 10,
      }
      // Mais recente no topo, e um teto: o pedal que "repete" sozinho encheria
      // a lista em segundos e esconderia o primeiro evento, que é o que
      // interessa.
      setEventos(atual => [evento, ...atual].slice(0, LIMITE))
    }

    function onDom(e: Event) {
      if (e instanceof KeyboardEvent) {
        // `preventDefault` para a sonda não rolar a página nem digitar no
        // campo atrás do modal enquanto o dentista pisa.
        e.preventDefault()
        registrar(e.type, `code="${e.code || '(vazio)'}" key="${e.key}"${e.repeat ? ' (repetição)' : ''}`)
        return
      }
      if (e instanceof WheelEvent) {
        registrar('wheel', `deltaY=${Math.round(e.deltaY)} — pedal em modo ROLAGEM`)
        return
      }
      if (e instanceof MouseEvent) {
        registrar(e.type, `botão ${e.button} — pedal em modo MOUSE`)
      }
    }

    for (const tipo of EVENTOS_DOM) window.addEventListener(tipo, onDom, true)

    /**
     * GAMEPAD: alguns pedais aparecem como controle de jogo.
     *
     * A API não emite evento de botão — só o `gamepadconnected`, e depois é
     * preciso PERGUNTAR o estado. Daí a varredura: sem ela, um pedal desses
     * ficaria invisível para a sonda.
     */
    const anterior = new Map<number, boolean[]>()
    let raf = 0
    function varrerGamepads() {
      for (const gp of navigator.getGamepads?.() ?? []) {
        if (!gp) continue
        const antes = anterior.get(gp.index) ?? []
        gp.buttons.forEach((b, i) => {
          if (b.pressed && !antes[i]) {
            registrar('gamepad', `botão ${i} de "${gp.id}" — pedal em modo CONTROLE`)
          }
        })
        anterior.set(gp.index, gp.buttons.map(b => b.pressed))
      }
      raf = requestAnimationFrame(varrerGamepads)
    }
    function onGamepad(e: Event) {
      const gp = (e as GamepadEvent).gamepad
      registrar('gamepad', `conectado: "${gp.id}"`)
    }
    window.addEventListener('gamepadconnected', onGamepad)
    raf = requestAnimationFrame(varrerGamepads)

    return () => {
      for (const tipo of EVENTOS_DOM) window.removeEventListener(tipo, onDom, true)
      window.removeEventListener('gamepadconnected', onGamepad)
      cancelAnimationFrame(raf)
    }
  }, [ativo])

  return eventos
}

/**
 * O VEREDITO a partir do que a sonda colheu.
 *
 * Pura para caber em teste: é a frase que diz ao dentista se o problema é
 * dele, do pedal ou nosso — e essa frase não pode mudar de sentido sem alguém
 * perceber.
 */
export function vereditoDaSonda(eventos: EventoDaSonda[]): string {
  if (eventos.length === 0) {
    return 'Nada chegou ao navegador. O pedal pode estar desconectado, com a tela sem foco, ou em um modo que o navegador não recebe — muitos têm uma combinação de teclas que alterna entre modo teclado, mídia e mouse.'
  }
  const tipos = new Set(eventos.map(e => e.tipo))
  if (tipos.has('keydown') || tipos.has('keyup')) {
    const comCodigo = eventos.some(e => e.tipo.startsWith('key') && !e.detalhe.includes('code="(vazio)"'))
    return comCodigo
      ? 'O pedal é um TECLADO e manda um código utilizável. Use "Aprender" nos botões acima.'
      : 'O pedal manda tecla, mas sem código utilizável — provavelmente teclas de mídia. Troque o modo no próprio pedal para teclado.'
  }
  if (tipos.has('gamepad')) {
    return 'O pedal aparece como CONTROLE DE JOGO, não como teclado. Troque o modo no próprio pedal — o app só aciona por tecla.'
  }
  if (tipos.has('wheel')) {
    return 'O pedal está em modo ROLAGEM (roda do mouse). Troque o modo no próprio pedal para teclado.'
  }
  return 'O pedal está em modo MOUSE. Troque o modo no próprio pedal para teclado.'
}
