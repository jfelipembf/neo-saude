/**
 * ONDE cada ferramenta existe — a Cibelly atende em duas superfícies.
 *
 *  - `odontogram`: a tela cheia do odontograma — o atendimento NA CADEIRA, com
 *    o desenho na mão e uma ficha aberta.
 *  - `global`: o pedal F em qualquer outra tela (agenda, pacientes,
 *    financeiro…). Não há motor de odontograma montado nem ficha aberta.
 *
 * A separação não é preferência: o motor do odontograma é GLOBAL DE MÓDULO e
 * só existe montado naquela tela. Chamar `marcar_dente` fora dela não marcaria
 * nada — e, pior, não marcaria em SILÊNCIO, com a Cibelly anunciando "marcado"
 * para um comando que se perdeu. Por isso a superfície global recusa esses
 * comandos com uma frase que diz o que fazer, em vez de deixá-los cair no vazio.
 *
 * ⚠️ ESTA LISTA É O QUE VAI NO SCHEMA DA SESSÃO — e é dinheiro.
 *
 * Em API Live o catálogo inteiro é recobrado A CADA TURNO, junto do prompt e do
 * histórico: as 22 ferramentas somam ~9.200 tokens, e a medição real
 * (cibelly_usage) mostrou 102 mil tokens de TEXTO por sessão, 83% da fatura do
 * Gemini — que não tem camada de cache. Mandar para a cadeira o fluxo de
 * compras do escritório é pagar por um manual que ninguém vai abrir ali.
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

/**
 * O QUE NÃO SE FAZ NA CADEIRA — some do schema da superfície `odontogram`.
 *
 * São as ferramentas do escritório: o fluxo de compras (carrinho, orçamento de
 * fornecedor) e a busca por OUTRO paciente. Nenhuma delas acontece com um
 * paciente na cadeira e a luminária acesa; a mão do dentista está no dente.
 *
 * Por tarefa e não por domínio, de propósito: `consultar_materiais` e
 * `registrar_material_usado` são do mesmo domínio `inventory` e FICAM — "gastei
 * uma resina" é falado na cadeira, e é o registro que mais se perde quando não
 * é dito na hora.
 *
 * O que sai daqui continua a um pedal de distância: no pedal F, fora da tela
 * cheia, a superfície `global` oferece tudo isso.
 */
const FORA_DA_CADEIRA: ReadonlySet<CibellyToolName> = new Set([
  'solicitar_orcamento_fornecedor',
  'adicionar_ao_carrinho',
  'consultar_carrinho',
  'pedir_orcamento_do_carrinho',
  'consultar_pacientes',
])

export function toolAvailableOnSurface(
  tool: string,
  surface: CibellyToolSurface,
): boolean {
  if (!isCibellyToolName(tool)) return false
  if (surface === 'odontogram') return !FORA_DA_CADEIRA.has(tool)
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

  // Rede de segurança: com a ferramenta fora do schema o modelo não deveria
  // sequer chamá-la. Se chamar (nome inventado, sessão antiga em cache), a
  // recusa diz ONDE aquilo se faz, em vez de "não consigo".
  if (surface === 'odontogram') {
    return 'Isso é do escritório, não da cadeira. Saia da tela cheia do '
      + 'odontograma e use o pedal geral para compras, fornecedor ou buscar '
      + 'outro paciente.'
  }

  return 'O odontograma não está aberto. Abra a ficha do paciente no odontograma '
    + 'para marcar, apagar ou consultar dente — daqui eu resolvo agenda, materiais, '
    + 'mensagens e cadastro.'
}
