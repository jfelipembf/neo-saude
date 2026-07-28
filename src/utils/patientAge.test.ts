import { describe, expect, it } from 'vitest'
import { idadeDoPaciente } from './patientAge'

const HOJE = new Date(2026, 6, 27)   // 27/07/2026

describe('idadeDoPaciente', () => {
  it('conta anos completos', () => {
    expect(idadeDoPaciente('27/07/1990', HOJE)).toBe('36 anos')
  })

  // A conta ingênua (só subtrair os anos) daria 36 aqui — e um ano a mais no
  // prontuário muda faixa de referência de exame.
  it('quem ainda não fez aniversário tem um ano a menos', () => {
    expect(idadeDoPaciente('28/07/1990', HOJE)).toBe('35 anos')
    expect(idadeDoPaciente('01/12/1990', HOJE)).toBe('35 anos')
  })

  it('aniversário hoje já conta', () => {
    expect(idadeDoPaciente('27/07/2000', HOJE)).toBe('26 anos')
  })

  // Pediatria registra em meses: "1 ano" cobre do bebê de 12 ao de 23 meses.
  it('abaixo de 1 ano sai em meses', () => {
    expect(idadeDoPaciente('27/01/2026', HOJE)).toBe('6 meses')
    expect(idadeDoPaciente('27/06/2026', HOJE)).toBe('1 mês')
  })

  it('entre 1 e 2 anos mostra ano e meses', () => {
    expect(idadeDoPaciente('27/01/2025', HOJE)).toBe('1 ano e 6 meses')
    expect(idadeDoPaciente('27/07/2025', HOJE)).toBe('1 ano')
  })

  it('sem data, sem idade — não inventa zero', () => {
    expect(idadeDoPaciente(undefined, HOJE)).toBe('')
    expect(idadeDoPaciente('', HOJE)).toBe('')
    expect(idadeDoPaciente('data ruim', HOJE)).toBe('')
  })

  it('data no futuro não vira idade negativa', () => {
    expect(idadeDoPaciente('27/07/2030', HOJE)).toBe('')
  })
})
