import { useClinic } from '@/hooks/useClinic'
import { A4_ALTURA_UTIL_MM, A4_LARGURA_UTIL_MM, buildDocument } from '@/utils/printDocument'
import type { PrintDocumentInput } from '@/utils/printDocument'

// Faixa-alvo da logo no cabeçalho impresso: até 56px de altura, mas nunca
// mais estreita que 40px — os dois tetos existem pra logo NUNCA desaparecer
// pequena (um wordmark bem largo, tipo o da Neo) nem estourar o cabeçalho
// (um brasão bem alto/estreito).
const LOGO_MAX_HEIGHT = 56
const LOGO_MAX_WIDTH = 160
const LOGO_MIN_WIDTH = 40

/**
 * Redimensiona a logo da clínica pelo FORMATO REAL da imagem enviada
 * (aspect ratio) — a caixa fixa (ex.: 56×56) que existia antes espremia
 * uma logo larga até ela ficar minúscula, porque o `object-fit: contain`
 * respeita a proporção original e sobra vazio na caixa em vez de crescer.
 * Aqui o cálculo é o inverso: parte da altura-alvo e só cai para a
 * largura-alvo se uma delas estourar o teto/piso.
 */
function ajustarLogoImpressa(img: HTMLImageElement) {
  const { naturalWidth: w, naturalHeight: h } = img
  if (!w || !h) return

  const ratio = w / h
  let height = LOGO_MAX_HEIGHT
  let width = height * ratio

  if (width > LOGO_MAX_WIDTH) {
    width = LOGO_MAX_WIDTH
    height = width / ratio
  } else if (width < LOGO_MIN_WIDTH) {
    width = LOGO_MIN_WIDTH
    height = width / ratio
  }

  img.style.width = `${width}px`
  img.style.height = `${height}px`
}

// ── "Cabe em uma folha" (PrintDocumentInput.fitToPage) ──────────────────────

/** Pixels de CSS por milímetro na régua de 96dpi que o navegador usa. */
const PX_POR_MM = 96 / 25.4

/**
 * Piso do encolhimento. Abaixo disto o documento vira letra miúda de contrato
 * — e um relatório que vai assinado, para o paciente ou para o convênio,
 * precisa ser LIDO. Chegando aqui sem caber, o documento sai em duas folhas
 * mesmo: espremer além disso troca um problema de papel por um de leitura.
 */
const ESCALA_MINIMA = 0.65

/** Passes da busca binária. Cinco varrem a faixa [0,65 … 1] com precisão de
 *  ~1% — mais que isso não muda um pixel do que sai impresso. */
const PASSES = 5

/**
 * Encolhe o documento até ele caber em UMA página A4 — assinatura inclusa.
 *
 * `zoom` e não `transform: scale()`: o zoom entra no LAYOUT (o texto reflui e
 * a página impressa continua sendo uma página), enquanto o transform só
 * desenha menor, mantendo a caixa original e a quebra de folha onde estava.
 *
 * A largura é reescrita junto (`útil / escala`): com zoom de 0,8 numa folha de
 * 180mm, o papel sairia com 144mm de conteúdo e um vão branco à direita. Dividir
 * a largura pelo zoom devolve os 180mm impressos e usa a diminuição só onde
 * ela interessa, que é na ALTURA.
 *
 * `body.scrollHeight` é lido em pixels de layout (antes do zoom), por isso a
 * altura física é `scrollHeight * escala`.
 */
function ajustarParaUmaPagina(doc: Document) {
  const body = doc.body
  const alvo = A4_ALTURA_UTIL_MM * PX_POR_MM

  function aplicar(escala: number) {
    if (escala === 1) {
      body.style.removeProperty('zoom')
      body.style.removeProperty('width')
      return
    }
    body.style.zoom = String(escala)
    body.style.width = `${A4_LARGURA_UTIL_MM / escala}mm`
  }

  function cabe(escala: number) {
    aplicar(escala)
    return body.scrollHeight * escala <= alvo
  }

  if (cabe(1)) return

  /**
   * BUSCA BINÁRIA pela MAIOR escala que ainda cabe — e não uma regra de três a
   * partir da altura que sobrou.
   *
   * A conta direta erra para baixo, e erra feio: encolher também alarga a folha
   * em pixels de layout (a largura é dividida pela escala), o texto reflui em
   * menos linhas e o documento encolhe mais do que a proporção previa. Num
   * relatório de teste, a regra de três parava em 0,80 quando 0,87 já cabia —
   * sete pontos de letra jogados fora num papel que precisa ser lido.
   */
  // `piso` é a menor escala aceitável (assumida como "cabe" — se nem ela
  // couber, o documento sai em duas folhas mesmo, e é o melhor que dá para
  // fazer sem torná-lo ilegível); `teto` é a maior que JÁ SE SABE não caber.
  let piso = ESCALA_MINIMA
  let teto = 1
  let melhor = ESCALA_MINIMA

  for (let passe = 0; passe < PASSES; passe++) {
    const meio = (piso + teto) / 2
    if (cabe(meio)) { melhor = meio; piso = meio } else { teto = meio }
  }

  aplicar(melhor)
}

/**
 * Abre a janela de impressão com a estrutura padrão do sistema: cabeçalho com
 * a logo e os dados da clínica (Administrativo → Dados do consultório) e o
 * miolo que cada página monta.
 *
 * Uso: `const imprimir = usePrintDocument()` e depois
 * `imprimir({ titulo: 'Recibo de pagamento', corpo: '<table>…</table>' })`.
 */
export function usePrintDocument() {
  const { data: clinica } = useClinic()

  return function imprimir(doc: PrintDocumentInput) {
    const janela = window.open('', '_blank', `width=${doc.width ?? 680},height=820`)
    if (!janela) return   // pop-up bloqueado

    janela.document.write(buildDocument(clinica, doc))
    janela.document.close()

    // A logo é uma imagem: chamar print() na hora imprimiria o documento antes
    // dela carregar. Espera cada imagem resolver (ou falhar) e só então imprime.
    const imagens = Array.from(janela.document.images)
    Promise.all(
      imagens.map(img => img.complete
        ? Promise.resolve()
        : new Promise<void>(resolve => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          })),
    ).then(() => {
      const logo = janela.document.querySelector<HTMLImageElement>('.clinica-logo')
      if (logo?.complete && logo.naturalWidth) ajustarLogoImpressa(logo)
      // DEPOIS da logo: ela é o elemento mais alto do cabeçalho, e medir antes
      // de o tamanho final dela ser aplicado erraria a altura do documento.
      if (doc.fitToPage) ajustarParaUmaPagina(janela.document)

      janela.focus()
      janela.print()
    })
  }
}

/** Depois de quanto tempo desiste de esperar `afterprint` e remove o iframe
 *  de qualquer jeito — nem todo navegador dispara o evento para o iframe
 *  (ver usePrintDocumentSemGesto). */
const REMOCAO_IFRAME_TIMEOUT_MS = 60_000

/**
 * Imprime SEM depender de um clique — para o único caso do sistema em que a
 * ação nasce de um comando de voz confirmado, não de um clique do dentista.
 *
 * `usePrintDocument` (acima) abre `window.open()`, e todo navegador
 * moderno BLOQUEIA isso sem um gesto do usuário na pilha de chamada — o que
 * nunca existe aqui, porque a confirmação chega depois de um round-trip de
 * voz (fala → transcrição → modelo → ferramenta). A tentativa falharia em
 * silêncio (`janela === null`), que foi exatamente o sintoma reportado: o
 * documento gerado, mas nada saindo na impressora.
 *
 * A saída é um `<iframe>` escondido na PRÓPRIA página: como não abre aba/
 * janela nova, o bloqueador de pop-up não entra em ação, e `print()` no
 * `contentWindow` dele imprime só o conteúdo do iframe — a mesma técnica
 * usada por qualquer biblioteca de "imprimir sem popup".
 *
 * Fica em um hook SEPARADO de propósito: os botões manuais de imprimir
 * (PrescriptionsPanel, BudgetsPanel, TreatmentsPanel…) continuam usando
 * `usePrintDocument` sem mudança nenhuma — são cliques de verdade, o
 * `window.open()` funciona neles, e trocar o mecanismo ali seria risco sem
 * necessidade.
 */
export function usePrintDocumentSemGesto() {
  const { data: clinica } = useClinic()

  return function imprimirSemGesto(doc: PrintDocumentInput) {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.inset = 'auto 0 0 auto'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.setAttribute('aria-hidden', 'true')

    // Anexa ANTES de escrever: `contentWindow` só existe depois que o iframe
    // entra no DOM. `document.write` + `close()` nele é síncrono — mesma
    // chamada que `usePrintDocument` já faz na janela popup, sem a corrida de
    // esperar um `onload` de `srcdoc` (que dispara uma vez para o
    // "about:blank" inicial e de novo para o conteúdo, em ordem que varia
    // por navegador).
    document.body.appendChild(iframe)
    const janela = iframe.contentWindow
    if (!janela) { iframe.remove(); return }

    janela.document.write(buildDocument(clinica, doc))
    janela.document.close()

    let removido = false
    function remover() {
      if (removido) return
      removido = true
      iframe.remove()
    }

    // A logo é uma imagem: chamar print() na hora imprimiria o documento antes
    // dela carregar. Espera cada imagem resolver (ou falhar) e só então imprime.
    const imagens = Array.from(janela.document.images)
    Promise.all(
      imagens.map(img => img.complete
        ? Promise.resolve()
        : new Promise<void>(resolve => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          })),
    ).then(() => {
      const logo = janela.document.querySelector<HTMLImageElement>('.clinica-logo')
      if (logo?.complete && logo.naturalWidth) ajustarLogoImpressa(logo)
      if (doc.fitToPage) ajustarParaUmaPagina(janela.document)

      janela.focus()
      janela.print()
      janela.addEventListener('afterprint', remover, { once: true })
      window.setTimeout(remover, REMOCAO_IFRAME_TIMEOUT_MS)
    })
  }
}
