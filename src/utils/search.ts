import { PARTICULAS_NOME } from './text'

/**
 * Texto comparável: sem acento e em minúsculas.
 * 'João D'Ávila' → 'joao d'avila' — assim "joao" acha "João".
 */
export function normalizarTexto(texto: string) {
  return texto
    .normalize('NFD')                  // separa a letra do acento
    .replace(/[\u0300-\u036f]/g, '')   // remove os acentos (marcas combinantes)
    .toLowerCase()
    .trim()
}

/** Palavras comparáveis de um texto, já sem acento e sem as partículas
 *  ("de", "da", "dos"…) — é o que faz "Maria Souza" achar "Maria de Souza". */
function palavras(texto: string) {
  return normalizarTexto(texto)
    .split(/[^a-z0-9]+/)
    .filter(p => p && !PARTICULAS_NOME.has(p))
}

/**
 * O texto combina com o termo buscado? Cada palavra do termo precisa aparecer
 * em alguma palavra do texto — sem depender de acento, de partícula nem da
 * ordem. Termo vazio combina com tudo (lista inteira).
 *
 * combinaBusca('Maria de Souza', 'maria souza')  → true
 * combinaBusca('João Santos',    'joao')         → true
 * combinaBusca('Maria de Souza', 'souza maria')  → true
 */
export function combinaBusca(texto: string, termo: string) {
  const buscadas = palavras(termo)
  if (buscadas.length === 0) return true

  const alvo = palavras(texto)
  return buscadas.every(b => alvo.some(a => a.includes(b)))
}
