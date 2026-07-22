/**
 * Partículas dos nomes em português que ficam em MINÚSCULA no meio do nome
 * ("Maria de Souza", "João dos Santos") e que a busca ignora — quem digita
 * "Maria Souza" precisa achar "Maria de Souza".
 */
export const NAME_PARTICLES = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e',
  'di', 'du', 'del', 'della', 'van', 'von', 'y', 'la', 'le',
])

/** 'ana' → 'Ana' (respeita hífen: 'ana-maria' → 'Ana-Maria'). */
function capitalizeWord(word: string) {
  return word
    .split('-')
    .map(part => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join('-')
}

/**
 * Normaliza o nome como o cadastro deve guardar: primeira letra de cada palavra
 * em maiúscula, o resto em minúscula, independente de como foi digitado.
 * As partículas continuam minúsculas (menos na primeira posição).
 *
 * 'MARIA DE SOUZA' | 'maria de souza' → 'Maria de Souza'
 * 'dra. camila duarte'                → 'Dra. Camila Duarte'
 * "joão d'ávila"                      → "João d'Ávila"
 */
export function capitalizeName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((word, i) => {
      // Partícula no meio do nome fica minúscula ("Maria de Souza").
      if (i > 0 && NAME_PARTICLES.has(word)) return word
      // Prefixos com apóstrofo: d'Ávila, o'Brien — capitaliza depois do apóstrofo.
      const apostrophe = word.match(/^([dlo])'(.+)$/)
      if (apostrophe) return `${apostrophe[1]}'${capitalizeWord(apostrophe[2])}`
      return capitalizeWord(word)
    })
    .join(' ')
}

/**
 * Nome sem o título profissional — 'Dra. Camila Duarte' → 'Camila Duarte'.
 * No-op em nomes que não o têm.
 *
 * O título faz parte do nome cadastrado; quem EXIBE decide se escreve "Dr(a)"
 * por conta própria. Sem tirar antes, sai "Dr(a) Dra. Camila Duarte".
 */
export function stripTitle(name: string) {
  return name.replace(/^Dra?\.\s*/i, '').trim()
}

/** Primeiro nome, sem o título — 'Dra. Camila Duarte' → 'Camila'. */
export function firstName(name: string) {
  return stripTitle(name).split(' ')[0] ?? ''
}

/**
 * Iniciais para círculos de foto/avatar: primeiro + último nome, ignorando o
 * prefixo "Dr./Dra." (no-op em nomes que não o têm).
 * 'Dra. Ana Paula Souza' → 'AS' · 'João Silva' → 'JS'
 */
export function initials(name: string) {
  const parts = stripTitle(name).split(' ').filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

/** '(79) 99811-4501' → '79998114501' (para links tel:/wa.me e comparações). */
export function digitsOnly(text: string) {
  return text.replace(/\D/g, '')
}
