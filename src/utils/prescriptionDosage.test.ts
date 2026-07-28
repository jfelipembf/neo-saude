import { describe, expect, it } from 'vitest'
import { posologiaPorExtenso } from './prescriptionDosage'

describe('posologiaPorExtenso', () => {
  it('monta a frase completa', () => {
    expect(posologiaPorExtenso({ dose: '1 comprimido', vezesAoDia: 3, dias: 7 }))
      .toBe('1 comprimido, a cada 8 horas, por 7 dias')
  })

  // 24 dividido pelas tomadas é como se escreve receita — "3 vezes ao dia"
  // deixa o intervalo por conta do paciente.
  it('converte a frequência em intervalo quando divide 24', () => {
    expect(posologiaPorExtenso({ vezesAoDia: 2 })).toContain('a cada 12 horas')
    expect(posologiaPorExtenso({ vezesAoDia: 4 })).toContain('a cada 6 horas')
    expect(posologiaPorExtenso({ vezesAoDia: 6 })).toContain('a cada 4 horas')
  })

  it('uma vez ao dia não vira "a cada 24 horas"', () => {
    expect(posologiaPorExtenso({ vezesAoDia: 1 })).toContain('uma vez ao dia')
  })

  // 5x ao dia não divide 24 — não inventa um intervalo quebrado.
  it('frequência que não divide 24 fica como está', () => {
    expect(posologiaPorExtenso({ vezesAoDia: 5 })).toContain('5 vezes ao dia')
  })

  // Sem duração o paciente para sozinho no fim da caixa — a receita tem de
  // dizer que é contínuo.
  it('sem dias, avisa que é uso contínuo', () => {
    expect(posologiaPorExtenso({ dose: '1 comprimido', vezesAoDia: 1 }))
      .toBe('1 comprimido, uma vez ao dia, de uso contínuo')
  })

  // A lista de medicação já mostra um selo "contínuo" ao lado do nome —
  // repetir na frase daria "contínuo · 50mg, uma vez ao dia, de uso contínuo".
  it('o sufixo de uso contínuo pode ser desligado', () => {
    expect(posologiaPorExtenso({ dose: '50mg', vezesAoDia: 1, semSufixoContinuo: true }))
      .toBe('50mg, uma vez ao dia')
  })

  it('desligar o sufixo não mexe em nada quando há prazo', () => {
    expect(posologiaPorExtenso({ vezesAoDia: 2, dias: 5, semSufixoContinuo: true }))
      .toBe('a cada 12 horas, por 5 dias')
  })

  it('um dia no singular', () => {
    expect(posologiaPorExtenso({ vezesAoDia: 2, dias: 1 })).toContain('por 1 dia')
  })

  // Meia posologia é melhor que frase com buraco — o médico vê o que falta.
  it('parte ausente simplesmente não aparece', () => {
    expect(posologiaPorExtenso({ dose: '10 gotas' })).toBe('10 gotas')
    expect(posologiaPorExtenso({})).toBe('')
  })

  it('observação entra no fim', () => {
    expect(posologiaPorExtenso({ dose: '1 comprimido', vezesAoDia: 2, dias: 5, observacao: 'após as refeições' }))
      .toBe('1 comprimido, a cada 12 horas, por 5 dias, após as refeições')
  })

  it('ignora espaço em branco', () => {
    expect(posologiaPorExtenso({ dose: '   ', observacao: '  ' })).toBe('')
  })
})
