/**
 * Partículas dos nomes em português que ficam em MINÚSCULA no meio do nome
 * ("Maria de Souza", "João dos Santos") e que a busca ignora — quem digita
 * "Maria Souza" precisa achar "Maria de Souza".
 */
export const PARTICULAS_NOME = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e',
  'di', 'du', 'del', 'della', 'van', 'von', 'y', 'la', 'le',
])

/** 'ana' → 'Ana' (respeita hífen: 'ana-maria' → 'Ana-Maria'). */
function capitalizarPalavra(palavra: string) {
  return palavra
    .split('-')
    .map(parte => parte ? parte[0].toUpperCase() + parte.slice(1) : parte)
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
export function capitalizarNome(nome: string) {
  return nome
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((palavra, i) => {
      // Partícula no meio do nome fica minúscula ("Maria de Souza").
      if (i > 0 && PARTICULAS_NOME.has(palavra)) return palavra
      // Prefixos com apóstrofo: d'Ávila, o'Brien — capitaliza depois do apóstrofo.
      const apostrofo = palavra.match(/^([dlo])'(.+)$/)
      if (apostrofo) return `${apostrofo[1]}'${capitalizarPalavra(apostrofo[2])}`
      return capitalizarPalavra(palavra)
    })
    .join(' ')
}

/**
 * Iniciais para círculos de foto/avatar: primeiro + último nome, ignorando o
 * prefixo "Dr./Dra." (no-op em nomes que não o têm).
 * 'Dra. Ana Paula Souza' → 'AS' · 'João Silva' → 'JS'
 */
export function initials(nome: string) {
  const partes = nome.replace(/^Dra?\.\s*/i, '').split(' ').filter(Boolean)
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primeira + ultima).toUpperCase()
}

/** '(79) 99811-4501' → '79998114501' (para links tel:/wa.me e comparações). */
export function somenteDigitos(texto: string) {
  return texto.replace(/\D/g, '')
}
