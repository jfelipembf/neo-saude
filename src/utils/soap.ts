import { isBlankHtml } from '@/utils/text'
import type { SoapNote, SoapSection } from '@/types/domain'

// ─────────────────────────────────────────────────────────────────────────────
// PRONTUÁRIO SOAP — vocabulário, conversões e o PARSER da saída da IA.
//
// O prontuário virou jsonb com quatro seções (ver appointment.clinical_note),
// mas a edge function `transcribe-audio` — que faz o ditado por voz e o
// "Aprimorar com IA" — continua devolvendo UM HTML corrido no formato
//     <p><strong>Subjetivo:</strong> …</p><p><strong>Objetivo:</strong> …</p>
// e NÃO PODE ser alterada. A ponte entre os dois mundos é este arquivo: o
// front quebra a saída da IA nas quatro seções, e assim ditado e aprimoramento
// seguem funcionando sem tocar na função.
//
// Tudo aqui é função PURA de string (nada de DOMParser): roda no teste em
// Node, e o saneamento de HTML continua sendo do DOMPurify, no editor e na
// exibição — parser não sanea, só reparte.
// ─────────────────────────────────────────────────────────────────────────────

/** As quatro seções na ordem em que a evolução se escreve e se lê. */
export const SOAP_SECTIONS: readonly SoapSection[] = ['subjective', 'objective', 'assessment', 'plan']

/**
 * Rótulo em português de cada seção.
 *
 * Mora aqui, e não em `constants/`, porque não é só rótulo de tela: é o
 * VOCABULÁRIO QUE O PARSER PROCURA na saída da IA (a edge function escreve
 * exatamente "Subjetivo:", "Objetivo:", "Avaliação:", "Plano:"). Separar o
 * rótulo do reconhecimento criaria duas verdades — mudar o texto da tela sem
 * mudar o parser quebraria o ditado em silêncio.
 */
export const SOAP_LABELS: Record<SoapSection, string> = {
  subjective: 'Subjetivo',
  objective:  'Objetivo',
  assessment: 'Avaliação',
  plan:       'Plano',
}

/**
 * O que o botão "repetir última sessão" traz da sessão anterior: SÓ Objetivo e
 * Plano.
 *
 * Subjetivo e Avaliação são exatamente o que muda de uma sessão para a outra —
 * o relato do paciente ("hoje a dor está 3, semana passada estava 7") e a
 * leitura clínica em cima dele. Repetidos, são o que um fiscal do CREFITO lê
 * como prontuário carimbado: evolução idêntica sessão após sessão vale como
 * atendimento não registrado. Objetivo e Plano, ao contrário, repetem por
 * natureza — a mesma série de exercícios, a mesma conduta — e são justamente
 * o trabalho braçal de redigitar que faz a evolução não ser escrita.
 */
export const REPEATABLE_SOAP_SECTIONS: readonly SoapSection[] = ['objective', 'plan']

/** Uma linha por seção explicando o que entra nela — texto de apoio do editor. */
export const SOAP_HINTS: Record<SoapSection, string> = {
  subjective: 'O que o paciente relata: queixa, dor, sono, o que mudou desde a última sessão.',
  objective:  'O que você mediu e observou: amplitude, força, testes, exercícios executados.',
  assessment: 'Sua interpretação clínica do que foi relatado e medido.',
  plan:       'Conduta, progressão e orientações para a próxima sessão.',
}

const stripAccents = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/** 'Avaliação:' → 'avaliacao' — a forma em que rótulo escrito e rótulo
 *  procurado se encontram (sem acento, sem caixa, sem dois-pontos). */
function normalizeLabel(text: string) {
  return stripAccents(text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' '))
    .toLowerCase()
    .replace(/[:\s]+$/, '')
    .trim()
}

const SECTION_BY_LABEL = new Map<string, SoapSection>(
  SOAP_SECTIONS.map(section => [normalizeLabel(SOAP_LABELS[section]), section]),
)

// ── Normalização de HTML de seção ────────────────────────────────────────────

/** Blocos que NÃO podem ser fatiados em parágrafos — uma lista com três itens
 *  é um bloco só, e quebrá-la em `<p>` viraria três frases soltas. */
const ATOMIC_BLOCKS = ['ul', 'ol', 'blockquote', 'pre', 'table', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
const ATOMIC_OPEN = new RegExp(`<(${ATOMIC_BLOCKS.join('|')})\\b[^>]*>`, 'i')

/** Índice logo DEPOIS do `</tag>` que fecha o bloco aberto em `openEnd`,
 *  contando aninhamento (lista dentro de lista fecha na de fora, não na de
 *  dentro). */
function blockEnd(html: string, tag: string, openEnd: number): number {
  const tags = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi')
  tags.lastIndex = openEnd
  let depth = 1
  let match = tags.exec(html)
  while (match) {
    depth += match[1] ? -1 : 1
    if (depth === 0) return tags.lastIndex
    match = tags.exec(html)
  }
  return html.length   // HTML truncado: o resto vira o bloco
}

/** Parágrafo COMPLETO, com os atributos que o editor pôs nele (alinhamento). */
const WHOLE_PARAGRAPH = /<p\b[^>]*>([\s\S]*?)<\/p\s*>/gi

/**
 * Texto que sobrou FORA de um parágrafo completo — o começo e o fim de toda
 * fatia que o parser recorta, porque o rótulo mora dentro do `<p>`. As tags de
 * parágrafo penduradas caem, o `<br>` vira quebra de parágrafo e cada pedaço
 * com conteúdo ganha um `<p>` próprio.
 */
function wrapLoose(html: string): string[] {
  return html
    .split(/<\/p\s*>|<p\b[^>]*>|<br\s*\/?>/i)
    .map(fragment => fragment.trim())
    .filter(fragment => !isBlankHtml(fragment))
    .map(fragment => `<p>${fragment}</p>`)
}

/**
 * Trecho SEM bloco atômico repartido em parágrafos bem formados. Parágrafo que
 * já vem inteiro é copiado COM a tag de abertura original: reescrever tudo
 * como `<p>` puro apagaria o alinhamento que o profissional aplicou — e o
 * ditado passa por aqui a cada gravação, então a perda seria silenciosa e
 * acumulativa.
 */
function paragraphize(html: string): string[] {
  const out: string[] = []
  let last = 0
  for (const match of html.matchAll(WHOLE_PARAGRAPH)) {
    if (match.index === undefined) continue
    out.push(...wrapLoose(html.slice(last, match.index)))
    if (!isBlankHtml(match[1])) out.push(match[0])
    last = match.index + match[0].length
  }
  out.push(...wrapLoose(html.slice(last)))
  return out
}

/**
 * Fecha o HTML de uma seção: as fatias que o parser recorta começam e terminam
 * no meio de um `<p>` (o rótulo mora DENTRO do parágrafo), então sobram tags
 * penduradas que o editor rico e o `dangerouslySetInnerHTML` renderizariam
 * torto. Aqui cada pedaço de texto vira um `<p>` inteiro e o que era bloco
 * (lista, citação) passa intacto.
 */
function toParagraphs(html: string): string {
  const out: string[] = []
  let rest = html
  let opening = rest.match(ATOMIC_OPEN)
  while (opening?.index !== undefined) {
    out.push(...paragraphize(rest.slice(0, opening.index)))
    const end = blockEnd(rest, opening[1], opening.index + opening[0].length)
    out.push(rest.slice(opening.index, end))
    rest = rest.slice(end)
    opening = rest.match(ATOMIC_OPEN)
  }
  out.push(...paragraphize(rest))
  return out.join('')
}

// ── O parser ─────────────────────────────────────────────────────────────────

interface Marker {
  section: SoapSection
  /** Onde o rótulo COMEÇA — fim do conteúdo da seção anterior. */
  start: number
  /** Onde o conteúdo da seção começa (depois do rótulo, do ':' e do espaço). */
  contentStart: number
}

/** Rótulo em negrito — o formato que a edge function devolve. */
const BOLD_RUN = /<(strong|b)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi

/** Rótulo sem negrito, mas ABRINDO um parágrafo/linha e seguido de ':' — a
 *  forma em que a IA às vezes devolve e a que uma pessoa digita à mão. Exigir
 *  o começo do parágrafo é o que impede casar com um "plano:" no meio da
 *  frase ("mudamos o plano: agora são 3x"). */
const PLAIN_LABEL = /(?:^|<p\b[^>]*>|<br\s*\/?>)\s*(subjetivo|objetivo|avalia[çc][ãa]o|plano)\s*:/gi

/** Espaço, `&nbsp;` e o ':' que às vezes fica FORA do negrito
 *  (`<strong>Plano</strong>: conduta`) — nada disso é conteúdo da seção. */
const LEADING_NOISE = /^(?:\s|&nbsp;|:)+/

function collectMarkers(html: string): Marker[] {
  const markers: Marker[] = []

  BOLD_RUN.lastIndex = 0
  for (const match of html.matchAll(BOLD_RUN)) {
    const section = SECTION_BY_LABEL.get(normalizeLabel(match[2]))
    if (!section || match.index === undefined) continue
    const afterLabel = match.index + match[0].length
    const noise = html.slice(afterLabel).match(LEADING_NOISE)?.[0].length ?? 0
    markers.push({ section, start: match.index, contentStart: afterLabel + noise })
  }

  PLAIN_LABEL.lastIndex = 0
  for (const match of html.matchAll(PLAIN_LABEL)) {
    const section = SECTION_BY_LABEL.get(normalizeLabel(match[1]))
    if (!section || match.index === undefined) continue
    const labelStart = match.index + match[0].indexOf(match[1])
    // Um rótulo em negrito JÁ virou marcador acima; este passe só completa o
    // que não estava em negrito, nunca duplica.
    if (markers.some(m => labelStart >= m.start && labelStart < m.contentStart)) continue
    const afterLabel = match.index + match[0].length
    const noise = html.slice(afterLabel).match(LEADING_NOISE)?.[0].length ?? 0
    markers.push({ section, start: labelStart, contentStart: afterLabel + noise })
  }

  return markers.sort((a, b) => a.start - b.start)
}

/**
 * Quebra o HTML corrido do ditado/"Aprimorar com IA" nas quatro seções SOAP.
 *
 * Casos que ele trata de propósito (todos acontecem na prática):
 *  · SEÇÃO AUSENTE — a própria edge function manda omitir a seção sem
 *    informação; chave ausente é a forma certa de "não preenchi".
 *  · ORDEM TROCADA — o rótulo é que manda, não a posição.
 *  · RÓTULO REPETIDO — o ditado SOMA ao que já estava escrito
 *    (`soapToHtml(nota) + htmlDitado`, ver AiNoteActions), então "Objetivo:"
 *    aparece duas vezes no mesmo texto: as duas partes se juntam na MESMA
 *    seção, na ordem em que foram escritas. Sem isso, ditar por cima de uma
 *    evolução já começada apagaria a primeira metade.
 *  · TEXTO SEM RÓTULO NENHUM (ou antes do primeiro rótulo) — vai para
 *    SUBJETIVO. Duas razões: é a seção do relato corrido, que é como a pessoa
 *    fala quando não dita em SOAP; e é a única escolha que NÃO PERDE TEXTO —
 *    descartar apagaria o que o profissional acabou de ditar, e jogar no Plano
 *    inventaria conduta que ninguém escreveu. Fica em S, visível e fácil de
 *    recortar para a seção certa.
 */
export function parseSoapHtml(html: string | null | undefined): SoapNote {
  const source = html ?? ''
  const markers = collectMarkers(source)
  const parts: Record<SoapSection, string[]> = { subjective: [], objective: [], assessment: [], plan: [] }

  const preamble = source.slice(0, markers[0]?.start ?? source.length)
  if (!isBlankHtml(preamble)) parts.subjective.push(preamble)

  markers.forEach((marker, i) => {
    const end = markers[i + 1]?.start ?? source.length
    parts[marker.section].push(source.slice(marker.contentStart, end))
  })

  const note: SoapNote = {}
  for (const section of SOAP_SECTIONS) {
    const content = toParagraphs(parts[section].join(''))
    if (!isBlankHtml(content)) note[section] = content
  }
  return note
}

/**
 * A nota inteira num HTML só, no MESMO formato que a edge function entende —
 * é o que vai para a impressão, para a leitura de uma sessão antiga e para o
 * "Aprimorar com IA" (que recebe HTML corrido e devolve HTML corrido).
 * `parseSoapHtml(soapToHtml(nota))` devolve a nota de volta.
 */
export function soapToHtml(note: SoapNote | null | undefined): string {
  if (!note) return ''
  return SOAP_SECTIONS
    .filter(section => !isBlankHtml(note[section]))
    .map(section => `<p><strong>${SOAP_LABELS[section]}:</strong></p>${toParagraphs(note[section] as string)}`)
    .join('')
}

/**
 * Deixa a nota na forma que o banco aceita: seção em branco vira chave
 * AUSENTE e nota sem nenhuma seção vira `undefined` (coluna NULL). O CHECK
 * `private.is_soap_note` recusa `''` e `'{}'` justamente para não existirem
 * dois jeitos de dizer "vazio" — sem passar por aqui, apagar o texto de uma
 * seção no editor gravaria `'<p></p>'` e o relatório contaria a seção como
 * preenchida.
 */
export function normalizeSoapNote(note: SoapNote | null | undefined): SoapNote | undefined {
  if (!note) return undefined
  const clean: SoapNote = {}
  for (const section of SOAP_SECTIONS) {
    const html = (note[section] ?? '').trim()
    // Sem reprocessar o HTML: aqui o conteúdo vem do editor rico (listas,
    // alinhamento, cor) e é gravado como está — quem normaliza parágrafo é o
    // parser, cuja entrada é a saída simples da IA.
    if (!isBlankHtml(html)) clean[section] = html
  }
  return Object.keys(clean).length > 0 ? clean : undefined
}

/** Nota sem nenhuma seção preenchida. */
export function isBlankSoap(note: SoapNote | null | undefined): boolean {
  return normalizeSoapNote(note) === undefined
}

/** Quais seções têm conteúdo, na ordem canônica. */
export function filledSoapSections(note: SoapNote | null | undefined): SoapSection[] {
  return SOAP_SECTIONS.filter(section => !isBlankHtml(note?.[section]))
}

/** Só as seções pedidas (o "repetir última sessão" copia Objetivo e Plano). */
export function pickSoapSections(note: SoapNote | null | undefined, sections: readonly SoapSection[]): SoapNote {
  const picked: SoapNote = {}
  for (const section of sections) {
    const html = note?.[section]
    if (!isBlankHtml(html)) picked[section] = html as string
  }
  return picked
}

/** Texto sem marcação — prévia da seção recolhida e base da comparação. */
export function soapPlainText(html: string | null | undefined): string {
  return (html ?? '')
    .replace(/<\/(p|div|li|h[1-6])\s*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * As duas notas dizem a mesma coisa? Compara o TEXTO, não o HTML: trocar a
 * fonte ou a cor de uma evolução copiada não a torna uma evolução nova, e é
 * exatamente esse carbono que um fiscal lê como prontuário não feito (ver o
 * aviso de "idêntica à sessão anterior" no AppointmentModal).
 */
export function isSameSoapNote(a: SoapNote | null | undefined, b: SoapNote | null | undefined): boolean {
  return SOAP_SECTIONS.every(section => soapPlainText(a?.[section]) === soapPlainText(b?.[section]))
}
