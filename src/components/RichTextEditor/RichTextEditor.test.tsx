import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RichTextEditor } from './RichTextEditor'

// O texto de apoio (`placeholder`) some EM SILÊNCIO quando a fiação quebra: o
// campo continua funcionando, só fica sem a linha que diz o que escrever nele
// — e foi assim que ele passou um tempo inteiro sem aparecer em prontuário
// nenhum (o atributo ia parar na div raiz, e o `attr(data-placeholder)` do
// `p::before` resolvia vazio). Daí o teste: quem trocar a extensão Placeholder
// ou o seletor do CSS quebra aqui, não na tela do profissional.

describe('RichTextEditor — texto de apoio', () => {
  it('marca o parágrafo vazio e pendura o texto de apoio NELE (não na raiz)', async () => {
    render(<RichTextEditor value="" onChange={() => {}} placeholder="Anote aqui" />)

    const paragrafo = await screen.findByText(
      (_, el) => el?.tagName === 'P' && el.classList.contains('is-empty'),
    )
    expect(paragrafo.getAttribute('data-placeholder')).toBe('Anote aqui')
  })
})
