import { describe, expect, it } from 'vitest'
import {
  PEDAL_PADRAO, ativacaoSugerida, listeningModeFromPedal, nomeDaTecla,
  normalizarPedal, pedalCodeProibido,
} from './pedalConfig'

const tecla = (code: string, key = '') => ({ code, key })

describe('listeningModeFromPedal', () => {
  const config = { patientCode: 'PageDown', generalCode: 'PageUp', activation: 'hold' as const }

  it('reconhece os códigos aprendidos do pedal', () => {
    expect(listeningModeFromPedal(tecla('PageDown'), config)).toBe('patient')
    expect(listeningModeFromPedal(tecla('PageUp'), config)).toBe('general')
  })

  // Com um pedal de verdade configurado, a LETRA PERDE A MAGIA. J e F valiam
  // sempre, por cima de qualquer configuração — e isso abria o microfone em
  // qualquer canto da tela fora de um campo de texto. O caminho de volta hoje é
  // o botão na tela, que não depende de teclado nem de bateria.
  it('J e F não valem mais quando há pedal configurado', () => {
    expect(listeningModeFromPedal(tecla('KeyJ', 'j'), config)).toBeNull()
    expect(listeningModeFromPedal(tecla('KeyF', 'f'), config)).toBeNull()
  })

  it('tecla de fora não aciona nada', () => {
    expect(listeningModeFromPedal(tecla('KeyZ', 'z'), config)).toBeNull()
    expect(listeningModeFromPedal(tecla('Space', ' '), config)).toBeNull()
  })

  // Quem NUNCA configurou continua no teclado — não pelo atalho removido, mas
  // porque PEDAL_PADRAO é a configuração de quem não tem outra.
  it('sem configuração, vale o teclado', () => {
    expect(listeningModeFromPedal(tecla('KeyJ', 'j'), PEDAL_PADRAO)).toBe('patient')
    expect(listeningModeFromPedal(tecla('PageDown'), PEDAL_PADRAO)).toBeNull()
  })
})

describe('normalizarPedal', () => {
  // O erro que acontece de verdade: o dentista pisa o MESMO pedal nas duas
  // capturas. Aceitar daria um botão que nunca dispara, sem dizer por quê.
  it('recusa os dois botões com o mesmo código', () => {
    const c = normalizarPedal({ patientCode: 'PageDown', generalCode: 'PageDown' })
    expect(c.patientCode).toBe('PageDown')
    expect(c.generalCode).not.toBe('PageDown')
  })

  it('lixo vira o padrão do teclado', () => {
    expect(normalizarPedal(null)).toEqual(PEDAL_PADRAO)
    expect(normalizarPedal({ patientCode: 42 })).toEqual(PEDAL_PADRAO)
    expect(normalizarPedal({ patientCode: '  ' })).toEqual(PEDAL_PADRAO)
  })

  it('activation só aceita os dois valores', () => {
    expect(normalizarPedal({ activation: 'toggle' }).activation).toBe('toggle')
    expect(normalizarPedal({ activation: 'qualquer' }).activation).toBe('hold')
  })

  // Sequestrar Tab ou Escape deixaria o app inoperante — e quem configurou
  // errado não conseguiria voltar à tela de configuração para corrigir.
  it('recusa teclas que deixariam o app inoperante', () => {
    for (const code of ['Tab', 'Escape', 'Enter', 'NumpadEnter']) {
      expect(pedalCodeProibido(code), code).toBe(true)
      expect(normalizarPedal({ patientCode: code }).patientCode).toBe(PEDAL_PADRAO.patientCode)
    }
  })
})

describe('ativacaoSugerida', () => {
  // Pedal que só PULSA (keydown e keyup juntos) gravaria milissegundos de
  // áudio no modo "segurar" — a medição da captura é o que descobre isso.
  it('toque curto sugere alternar', () => {
    expect(ativacaoSugerida(40)).toBe('toggle')
    expect(ativacaoSugerida(399)).toBe('toggle')
  })

  it('pedal que aguenta segurar fica em segurar', () => {
    expect(ativacaoSugerida(400)).toBe('hold')
    expect(ativacaoSugerida(1500)).toBe('hold')
  })
})

describe('nomeDaTecla', () => {
  it('mostra o que o dentista reconhece', () => {
    expect(nomeDaTecla('KeyJ')).toBe('J')
    expect(nomeDaTecla('Digit1')).toBe('1')
    expect(nomeDaTecla('PageDown')).toBe('Page Down')
    expect(nomeDaTecla('ArrowUp')).toBe('Arrow Up')
    expect(nomeDaTecla('NumpadAdd')).toBe('Num Add')
    expect(nomeDaTecla('Space')).toBe('Space')
  })
})
