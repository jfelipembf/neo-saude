import { useMemo } from 'react'
import DOMPurify from 'dompurify'

interface SafeHtmlProps {
  /** HTML vindo do banco (evolução, modelo, observação). */
  html: string | null | undefined
  className?: string
}

/**
 * A ÚNICA forma de renderizar HTML vindo do banco.
 *
 * Existe porque o projeto tinha cinco pontos com `dangerouslySetInnerHTML` e
 * **três deles não saneavam** — confiavam no saneamento da ESCRITA, feito pelo
 * `RichTextEditor`. Esse raciocínio não se sustenta: o editor não é o único
 * caminho até a coluna. Um usuário de clínica tem GRANT de UPDATE e escreve
 * `treatment_session.evolution` direto pelo PostgREST com o próprio token, sem
 * passar por editor nenhum. Sanear só na escrita é trava que se contorna dando
 * a volta — e o conteúdo é renderizado para OUTROS usuários da clínica.
 *
 * Concentrar aqui muda a natureza do erro: antes, esquecer o DOMPurify num
 * ponto novo era invisível; agora, renderizar HTML sem passar por este
 * componente é uma escolha explícita, visível na revisão.
 *
 * O `useMemo` não é micro-otimização: sanear roda a cada render, e um prontuário
 * lista dezenas de evoluções.
 */
export function SafeHtml({ html, className }: SafeHtmlProps) {
  const limpo = useMemo(() => (html ? DOMPurify.sanitize(html) : ''), [html])

  if (!limpo) return null
  return <div className={className} dangerouslySetInnerHTML={{ __html: limpo }} />
}
