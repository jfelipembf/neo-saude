import { describe, expect, it } from 'vitest'
import { resumoDoHtml, textoDoHtml } from './htmlExcerpt'

describe('textoDoHtml', () => {
  it('tira as tags', () => {
    expect(textoDoHtml('<p>Paciente refere dor</p>')).toBe('Paciente refere dor')
    expect(textoDoHtml('<strong>Febre</strong> há 3 dias')).toBe('Febre há 3 dias')
  })

  // Sem o espaço, "…dor.</p><p>Exame…" viraria "dor.Exame".
  it('separa blocos que se fecham', () => {
    expect(textoDoHtml('<p>Queixa: dor.</p><p>Exame: normal.</p>'))
      .toBe('Queixa: dor. Exame: normal.')
    expect(textoDoHtml('linha um<br>linha dois')).toBe('linha um linha dois')
  })

  it('devolve entidades ao caractere', () => {
    expect(textoDoHtml('<p>Dor &lt; 3 dias &amp; febre</p>')).toBe('Dor < 3 dias & febre')
    expect(textoDoHtml('a&nbsp;b')).toBe('a b')
  })

  it('vazio e nulo não quebram', () => {
    expect(textoDoHtml('')).toBe('')
    expect(textoDoHtml(null)).toBe('')
    expect(textoDoHtml(undefined)).toBe('')
  })

  // Extração, não sanitização — mas o resultado é texto puro de qualquer jeito.
  it('script não sobrevive', () => {
    expect(textoDoHtml('<script>alert(1)</script>ok')).not.toContain('<')
  })
})

describe('resumoDoHtml', () => {
  it('texto curto passa inteiro, sem reticências', () => {
    expect(resumoDoHtml('<p>Consulta de rotina</p>')).toBe('Consulta de rotina')
  })

  it('corta no espaço, não no meio da palavra', () => {
    const html = `<p>${'palavra '.repeat(40)}</p>`
    const r = resumoDoHtml(html, 50)
    expect(r.endsWith('…')).toBe(true)
    expect(r.replace('…', '').trim().endsWith('palavra')).toBe(true)
  })

  // Palavra única gigante não tem espaço para cortar — corta no limite mesmo,
  // em vez de devolver a linha inteira.
  it('palavra sem espaço é cortada no limite', () => {
    const r = resumoDoHtml('<p>' + 'a'.repeat(300) + '</p>', 50)
    expect(r.length).toBeLessThanOrEqual(51)
  })
})
