import { useEffect, useRef } from 'react'

// Elementos que recebem foco por Tab — usado pelo trap de foco abaixo.
const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'

/**
 * Comportamento de acessibilidade compartilhado por Modal e Drawer:
 * trap de foco (Tab/Shift+Tab circulam dentro do painel), ESC fecha, e o
 * scroll da página atrás fica travado enquanto está aberto.
 *
 * Os dois componentes tinham este bloco DUPLICADO — uma correção de
 * acessibilidade precisava ser feita duas vezes. Aqui é uma só.
 *
 * Devolve a ref para prender no painel (mesmo padrão do useOutsideClick):
 *
 *   const panelRef = useDialogBehavior<HTMLDivElement>(open, onClose)
 *   <div ref={panelRef} role="dialog" aria-modal="true">…</div>
 */
export function useDialogBehavior<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const panelRef = useRef<T>(null)
  // Guarda o callback numa ref: trocar de função a cada render não deve
  // reassinar o listener de teclado.
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onCloseRef.current(); return }
      if (e.key === 'Tab' && panel) {
        const items = panel.querySelectorAll<HTMLElement>(FOCUSABLE)
        if (!items.length) { e.preventDefault(); return }
        const first = items[0]
        const last = items[items.length - 1]
        const active = document.activeElement
        if (e.shiftKey && (active === first || !panel.contains(active))) {
          e.preventDefault(); last.focus()
        } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
          e.preventDefault(); first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return panelRef
}
