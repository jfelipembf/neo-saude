import { describe, it, expect } from 'vitest'
import { agruparAchados, notasLivres, resumirDentes } from './toothNoteGroups'

describe('resumirDentes — faixas como um dentista lê', () => {
  it('colapsa sequência contígua', () => {
    expect(resumirDentes([11, 12, 13, 14])).toBe('11 a 14')
  })

  it('NÃO atravessa quadrante', () => {
    // 18 e 21 são vizinhos na boca e quadrantes diferentes: "18 a 21" não
    // significa nada. O caso real é o aparelho na arcada superior inteira.
    expect(resumirDentes([11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28]))
      .toBe('11 a 18, 21 a 28')
  })

  it('dois seguidos saem separados, não como faixa', () => {
    expect(resumirDentes([14, 15])).toBe('14, 15')
  })

  it('mistura faixa e avulso', () => {
    expect(resumirDentes([11, 12, 13, 17])).toBe('11 a 13, 17')
  })

  it('ordena e remove repetido', () => {
    expect(resumirDentes([16, 11, 16, 13])).toBe('11, 13, 16')
    expect(resumirDentes([])).toBe('')
  })
})

describe('agruparAchados', () => {
  const notes = [
    { tooth: 11, clinical: 'Aparelho ortodôntico: Bracket', text: '' },
    { tooth: 12, clinical: 'Aparelho ortodôntico: Bracket', text: '' },
    { tooth: 14, clinical: 'Restauração de resina composta · Aparelho ortodôntico: Bracket', text: 'raio-x' },
    { tooth: 15, clinical: 'Restauração de amálgama', text: '' },
  ]

  it('separa os achados que o motor juntou com " · "', () => {
    const g = agruparAchados(notes)
    const aparelho = g.find(x => x.achado === 'Aparelho ortodôntico: Bracket')
    expect(aparelho?.dentes).toEqual([11, 12, 14])
    expect(aparelho?.resumo).toBe('11, 12, 14')
  })

  it('ordena do achado mais espalhado para o menos', () => {
    expect(agruparAchados(notes)[0].achado).toBe('Aparelho ortodôntico: Bracket')
  })

  it('não inventa grupo em boca limpa', () => {
    expect(agruparAchados([])).toEqual([])
    expect(agruparAchados([{ tooth: 11, clinical: '', text: 'só anotação' }])).toEqual([])
  })
})

describe('notasLivres', () => {
  it('fica FORA dos achados — é texto, não marcação', () => {
    const n = notasLivres([
      { tooth: 14, clinical: 'Restauração', text: 'pedir raio-x' },
      { tooth: 11, clinical: 'Cárie', text: '' },
    ])
    expect(n).toEqual([{ tooth: 14, text: 'pedir raio-x' }])
  })
})
