import { useConsultorio } from '@/hooks/useConsultorio'
import { montarDocumento } from '@/utils/printDocument'
import type { PrintDocumentInput } from '@/utils/printDocument'

/**
 * Abre a janela de impressão com a estrutura padrão do sistema: cabeçalho com
 * a logo e os dados da clínica (Administrativo → Dados do consultório) e o
 * miolo que cada página monta.
 *
 * Uso: `const imprimir = usePrintDocument()` e depois
 * `imprimir({ titulo: 'Recibo de pagamento', corpo: '<table>…</table>' })`.
 */
export function usePrintDocument() {
  const { data: clinica } = useConsultorio()

  return function imprimir(doc: PrintDocumentInput) {
    const janela = window.open('', '_blank', `width=${doc.largura ?? 680},height=820`)
    if (!janela) return   // pop-up bloqueado

    janela.document.write(montarDocumento(clinica, doc))
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
      janela.focus()
      janela.print()
    })
  }
}
