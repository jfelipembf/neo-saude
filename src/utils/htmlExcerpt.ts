/**
 * O RESUMO DE UM TEXTO EM HTML — a linha que aparece na timeline.
 *
 * A evolução médica é gravada como HTML (o editor é rico). A timeline precisa
 * de uma frase, não de marcação: sem tirar as tags, "<p>Paciente refere dor</p>"
 * apareceria com os sinais de menor e maior na tela.
 *
 * Não é sanitização — é EXTRAÇÃO. Quem exibe o HTML de verdade continua
 * passando pelo DOMPurify (ver RichTextEditor); aqui o resultado é texto puro,
 * então não há como sobrar script.
 */

/** Entidades que o editor produz e que precisam voltar a ser caractere. */
const ENTIDADES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
}

export function textoDoHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html
    // Bloco que fecha vira espaço, senão "…dor.</p><p>Exame…" cola as frases.
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z#0-9]+;/gi, e => ENTIDADES[e.toLowerCase()] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Primeiras palavras do texto, para caber numa linha.
 *
 * Corta em ESPAÇO, não no caractere exato: "Paciente refere dor abdo…" é
 * legível, "Paciente refere dor abd…" cortado no meio da palavra parece erro.
 */
export function resumoDoHtml(html: string | null | undefined, limite = 120): string {
  const texto = textoDoHtml(html)
  if (texto.length <= limite) return texto

  const cortado = texto.slice(0, limite)
  const ultimoEspaco = cortado.lastIndexOf(' ')
  return `${ultimoEspaco > limite * 0.6 ? cortado.slice(0, ultimoEspaco) : cortado}…`
}
