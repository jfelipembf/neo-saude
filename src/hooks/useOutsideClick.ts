import { useEffect, useRef } from 'react'

/**
 * Fecha um elemento flutuante (dropdown, popover) ao clicar fora dele ou ao
 * apertar Esc. Devolve a ref para prender no container do elemento.
 *
 * const ref = useOutsideClick<HTMLDivElement>(() => setAberto(false), aberto)
 * <div ref={ref}>…</div>
 */
export function useOutsideClick<T extends HTMLElement>(onClose: () => void, active = true) {
  const ref = useRef<T>(null)
  // Guarda o callback numa ref: trocar de função a cada render não deve
  // reassinar os listeners. A escrita vai num efeito — mexer em ref durante
  // o render quebra as regras dos hooks.
  const callback = useRef(onClose)
  useEffect(() => {
    callback.current = onClose
  })

  useEffect(() => {
    if (!active) return

    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) callback.current()
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') callback.current()
    }

    // `mousedown` (e não `click`): fecha antes de o clique virar outra ação.
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [active])

  return ref
}
