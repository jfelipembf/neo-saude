import { useEffect, useState } from 'react'

/**
 * Valor que só acompanha a fonte depois de `atraso` ms parado — usado nas
 * buscas para não refiltrar (e, no Supabase, não consultar) a cada tecla.
 *
 * const busca = ...                        // o que o usuário digita (input)
 * const termo = useDebounce(busca)         // o que a lista usa para filtrar
 */
export function useDebounce<T>(valor: T, atraso = 300) {
  const [debounced, setDebounced] = useState(valor)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(valor), atraso)
    return () => clearTimeout(id)   // digitou de novo? cancela o anterior
  }, [valor, atraso])

  return debounced
}
