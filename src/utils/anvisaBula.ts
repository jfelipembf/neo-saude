/**
 * LINK PARA A BULA OFICIAL no Bulário Eletrônico da ANVISA.
 *
 * Por que LINK e não cópia — as duas razões pesam igual:
 *
 *  1. TÉCNICA: não dá para servir a bula do nosso lado. O Cloudflare da ANVISA
 *     bloqueia por fingerprint TLS (curl com headers perfeitos de Chrome toma
 *     403; navegador real, mesmo IP, recebe 200), e o token de download expira
 *     em 300 s contados a partir da BUSCA. Proxy, cache e pré-carga estão todos
 *     fora de alcance.
 *  2. JURÍDICA: bula não é documento público — quem a redige é a empresa
 *     titular do registro, a ANVISA só aprova. Copiar o texto para dentro do
 *     produto reproduz a forma, que é justamente o que a lei protege. Link não
 *     reproduz nada.
 *
 * O usuário abre no navegador dele, que é onde funciona, e lê a bula na fonte
 * — sempre na versão vigente, sem nada nosso no meio para ficar desatualizado.
 */

const BULARIO = 'https://consultas.anvisa.gov.br/#/bulario/q/'

/**
 * Monta a URL do Bulário já filtrada pelo nome.
 *
 * O parâmetro é `nomeProduto` (verificado em navegador real: devolve a lista
 * do medicamento com bula do paciente, bula do profissional e histórico).
 * `filter[substancia]` existe mas é armadilha — aceita texto livre e devolve
 * lixo: buscar "DIPIRONA MONOIDRATADA" por ele trouxe HERCEPTIN como primeiro
 * resultado, porque o campo espera um id do autocomplete, não um nome.
 */
export function bulaUrl(nomeProduto: string | null | undefined): string | null {
  const nome = (nomeProduto ?? '').trim()
  if (!nome) return null
  return `${BULARIO}?nomeProduto=${encodeURIComponent(nome)}`
}

/**
 * O nome que tem mais chance de achar a bula.
 *
 * A busca da ANVISA é por nome de PRODUTO, e o catálogo da CMED traz a marca
 * (`BEXAI`) junto com o princípio ativo. Marca acha direto; princípio ativo
 * acha os genéricos. Quando o produto é genérico, o nome dele JÁ é o princípio
 * ativo — e aí os dois coincidem.
 *
 * Corta o que está entre parênteses e depois de vírgula: "DIPIRONA (SÓDICA)"
 * e "AMOXICILINA, TRIIDRATADA" não existem como nome de produto na ANVISA, e o
 * termo mais curto acha mais.
 */
export function termoDeBusca(nomeProduto: string): string {
  return nomeProduto
    .replace(/\(.*?\)/g, ' ')
    .split(',')[0]
    .replace(/\s+/g, ' ')
    .trim()
}
