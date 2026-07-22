import { useEffect, useRef } from 'react'

/**
 * Fecha um elemento flutuante (dropdown, popover) ao clicar fora dele ou ao
 * apertar Esc. Devolve a ref para prender no container do elemento.
 *
 * const ref = useOutsideClick<HTMLDivElement>(() => setAberto(false), aberto)
 * <div ref={ref}>…</div>
 */
export function useOutsideClick<T extends HTMLElement>(aoFechar: () => void, ativo = true) {
  const ref = useRef<T>(null)
  // Guarda o callback numa ref: trocar de função a cada render não deve
  // reassinar os listeners. A escrita vai num efeito — mexer em ref durante
  // o render quebra as regras dos hooks.
  const callback = useRef(aoFechar)
  useEffect(() => {
    callback.current = aoFechar
  })

  useEffect(() => {
    if (!ativo) return

    function aoClicar(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) callback.current()
    }
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') callback.current()
    }

    // `mousedown` (e não `click`): fecha antes de o clique virar outra ação.
    document.addEventListener('mousedown', aoClicar)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('mousedown', aoClicar)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [ativo])

  return ref
}
