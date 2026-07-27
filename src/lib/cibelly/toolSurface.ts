/**
 * ONDE cada ferramenta existe — a Cibelly atende em duas superfícies.
 *
 *  - `odontogram`: a tela cheia do odontograma. Tem o desenho na mão e uma
 *    ficha aberta, então atende tudo, inclusive marcar e apagar dente.
 *  - `global`: o pedal F em qualquer outra tela (agenda, pacientes,
 *    financeiro…). Não há motor de odontograma montado nem ficha aberta.
 *
 * A separação não é preferência: o motor do odontograma é GLOBAL DE MÓDULO e
 * só existe montado naquela tela. Chamar `marcar_dente` fora dela não marcaria
 * nada — e, pior, não marcaria em SILÊNCIO, com a Cibelly anunciando "marcado"
 * para um comando que se perdeu. Por isso a superfície global recusa esses
 * comandos com uma frase que diz o que fazer, em vez de deixá-los cair no vazio.
 *
 * O domínio de cada ferramenta já existe em toolCatalog.ts (fonte única) —
 * aqui só se decide quais domínios cada superfície aceita. Ferramenta nova
 * herda a regra do domínio dela, sem ninguém precisar lembrar de cadastrá-la.
 */

import {
  CIBELLY_TOOL_CATALOG,
  isCibellyToolName,
  type CibellyToolDomain,
  type CibellyToolName,
} from './toolCatalog'

export type CibellyToolSurface = 'odontogram' | 'global'

/** O único domínio que depende do desenho montado na tela. */
const DOMINIOS_DA_TELA_CHEIA: ReadonlySet<CibellyToolDomain> = new Set(['odontogram'])

export function toolAvailableOnSurface(
  tool: string,
  surface: CibellyToolSurface,
): boolean {
  if (!isCibellyToolName(tool)) return false
  if (surface === 'odontogram') return true
  return !DOMINIOS_DA_TELA_CHEIA.has(CIBELLY_TOOL_CATALOG[tool].domain)
}

/** As ferramentas que a superfície oferece — é o que vai no schema da sessão. */
export function toolsForSurface(surface: CibellyToolSurface): CibellyToolName[] {
  return (Object.keys(CIBELLY_TOOL_CATALOG) as CibellyToolName[])
    .filter(tool => toolAvailableOnSurface(tool, surface))
}

/**
 * A recusa que ela fala quando o comando não cabe na superfície.
 *
 * Diz O QUE FAZER, e não só que não deu: sem isso o dentista ouve "não
 * consigo" e não sabe que basta abrir o odontograma daquele paciente.
 */
export function surfaceRefusal(tool: string, surface: CibellyToolSurface): string | null {
  if (toolAvailableOnSurface(tool, surface)) return null
  if (!isCibellyToolName(tool)) return `Ferramenta desconhecida: ${tool}`
  return 'O odontograma não está aberto. Abra a ficha do paciente no odontograma '
    + 'para marcar, apagar ou consultar dente — daqui eu resolvo agenda, materiais, '
    + 'mensagens e cadastro.'
}
