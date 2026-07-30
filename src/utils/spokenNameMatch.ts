import { words } from './search'

/**
 * NOME DITO EM VOZ ALTA × NOME CADASTRADO.
 *
 * A busca normal exige que a palavra procurada seja SUBSTRING do cadastro
 * (`matchesSearch`), e isso basta para quem digita. Para quem fala, não: a
 * transcrição erra em nome próprio o tempo todo, e erra em silêncio.
 *
 * O caso que originou este arquivo: "agende para michele dotrovisk" contra
 * "Michelle Dratovsky". As duas palavras falham no substring —
 * `'michelle'.includes('michele')` é falso por causa do segundo L — e a
 * resposta era "não encontrei paciente", com o nome certo na base.
 *
 * DOIS CRITÉRIOS, porque os erros são de duas naturezas:
 *
 *  1. LETRA A MAIS OU A MENOS — "michele"/"michelle". Distância de edição
 *     pequena resolve.
 *  2. VOGAL TROCADA NO MEIO — "dotrovisk"/"dratovsky". A distância de edição
 *     entre essas duas é SEIS: nenhum limiar honesto as aproxima sem aproximar
 *     também nomes diferentes. Mas o esqueleto de consoantes é `drtvsk` contra
 *     `dtrvsk` — a mesma sequência com dois vizinhos trocados. É nas vogais que
 *     a transcrição de nome estrangeiro mais erra, e é por isso que ignorá-las
 *     revela o parentesco.
 *
 * ONDE ISTO É SEGURO: só entra quando a busca exata e a por substring não
 * acharam NADA, e quem chama já pergunta qual quando sobra mais de um
 * (`resolvePatientReference`). Aproximar demais custa uma pergunta; aproximar
 * de menos custa um paciente que existe e não é encontrado.
 */

/** Vogais e o H — o que a fala mais deforma e o que menos identifica um nome. */
const SEM_IDENTIDADE = /[aeiouyh]/g

/**
 * O esqueleto de consoantes, com as duplicadas colapsadas.
 *
 * 'dratovsky' → 'drtvsk' · 'michelle' → 'mcl' · 'michele' → 'mcl'
 */
function esqueleto(palavra: string): string {
  return palavra.replace(SEM_IDENTIDADE, '').replace(/(.)\1+/g, '$1')
}

/**
 * Distância de edição com TRANSPOSIÇÃO (Damerau, alinhamento ótimo).
 *
 * A transposição não é luxo aqui: é justamente ela que faz `drtvsk` e `dtrvsk`
 * ficarem a uma unidade de distância. Sem contá-la seriam duas, e o limiar
 * teria de dobrar — aproximando junto um monte de nome que não tem parentesco.
 */
function distancia(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length || !b.length) return Math.max(a.length, b.length)

  const linhas = a.length + 1
  const colunas = b.length + 1
  const d: number[][] = Array.from({ length: linhas }, (_, i) =>
    Array.from({ length: colunas }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)))

  for (let i = 1; i < linhas; i++) {
    for (let j = 1; j < colunas; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(
        d[i - 1][j] + 1,        // remoção
        d[i][j - 1] + 1,        // inserção
        d[i - 1][j - 1] + custo, // substituição
      )
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)   // transposição
      }
    }
  }
  return d[a.length][b.length]
}

/**
 * Quanto erro tolerar numa palavra, pelo tamanho dela.
 *
 * Curta não tolera nada: "ana" e "ane" ficam a uma unidade e são pessoas
 * diferentes. É em nome longo que a transcrição erra, e é nele que sobra
 * contexto suficiente para o erro não virar troca de paciente.
 */
function tolerancia(tamanho: number): number {
  if (tamanho < 5) return 0
  if (tamanho < 8) return 1
  return 2
}

/** Duas palavras podem ser o MESMO nome, uma delas dita em voz alta? */
export function pareceMesmaPalavra(a: string, b: string): boolean {
  if (!a || !b) return false
  if (a === b) return true

  // Nome abreviado na fala ("michel" por "michelle") ou o contrário.
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))) return true

  const limite = tolerancia(Math.max(a.length, b.length))
  if (limite > 0 && distancia(a, b) <= limite) return true

  // O esqueleto só decide em palavra com consoante bastante para ser um nome:
  // com duas, quase tudo vira parente de tudo.
  const ea = esqueleto(a)
  const eb = esqueleto(b)
  return ea.length >= 3 && eb.length >= 3 && distancia(ea, eb) <= 1
}

/**
 * O nome cadastrado corresponde ao que foi dito?
 *
 * Mesma regra de `matchesSearch` — toda palavra dita precisa achar a sua no
 * cadastro, sem depender de ordem nem de partícula —, só que comparando por
 * semelhança em vez de substring.
 */
export function pareceMesmoNome(cadastrado: string, dito: string): boolean {
  const ditas = words(dito)
  if (ditas.length === 0) return false

  const alvo = words(cadastrado)
  return ditas.every(d => alvo.some(t => pareceMesmaPalavra(t, d)))
}
