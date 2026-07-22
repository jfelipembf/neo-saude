import { NAME_PARTICLES } from './text'

/**
 * Texto comparável: sem acento e em minúsculas.
 * 'João D'Ávila' → 'joao d'avila' — assim "joao" acha "João".
 */
export function normalizeText(text: string) {
  return text
    .normalize('NFD')                  // separa a letra do acento
    .replace(/[\u0300-\u036f]/g, '')   // remove os acentos (marcas combinantes)
    .toLowerCase()
    .trim()
}

/** Palavras comparáveis de um texto, já sem acento e sem as partículas
 *  ("de", "da", "dos"…) — é o que faz "Maria Souza" achar "Maria de Souza". */
function words(text: string) {
  return normalizeText(text)
    .split(/[^a-z0-9]+/)
    .filter(w => w && !NAME_PARTICLES.has(w))
}

/**
 * O texto combina com o termo buscado? Cada palavra do termo precisa aparecer
 * em alguma palavra do texto — sem depender de acento, de partícula nem da
 * ordem. Termo vazio combina com tudo (lista inteira).
 *
 * matchesSearch('Maria de Souza', 'maria souza')  → true
 * matchesSearch('João Santos',    'joao')         → true
 * matchesSearch('Maria de Souza', 'souza maria')  → true
 */
export function matchesSearch(text: string, term: string) {
  const searched = words(term)
  if (searched.length === 0) return true

  const target = words(text)
  return searched.every(s => target.some(t => t.includes(s)))
}
