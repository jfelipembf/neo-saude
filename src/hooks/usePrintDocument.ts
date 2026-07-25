import { useClinic } from '@/hooks/useClinic'
import { buildDocument } from '@/utils/printDocument'
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

      janela.focus()
      janela.print()
    })
  }
}
