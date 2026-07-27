/**
 * NOME PELO QUAL CHAMAR A PESSOA EM VOZ ALTA.
 *
 * Existe para a Cibelly (assistente de voz do odontograma) cumprimentar o
 * paciente na abertura do atendimento. O campo `patient.common_name` é digitado
 * pela clínica e manda em tudo; quando está vazio — que é o caso da maioria da
 * base — o nome de chamar é DERIVADO de `patient.name`.
 *
 * DOUTRINA, e ela explica cada decisão abaixo: o pior resultado deste arquivo é
 * a assistente falar, na frente do paciente, uma palavra que não é o nome dele
 * — o sobrenome ("Paciente Dratovsky"), o convênio ("Paciente Unimed") ou lixo
 * de importação ("Paciente Mãe"). Contra isso, duas regras:
 *
 *   1. Só entra regra cujo PIOR caso seja silêncio ou um nome mais CURTO.
 *      Errar para menos ("Maria" em quem é Maria Clara) não ofende ninguém;
 *      errar para mais é o que faz o dentista desligar a assistente.
 *   2. Entrada suspeita se REJEITA, nunca se conserta. Consertar a pontuação
 *      dentro do token é o que transformaria `${OPENAI_API_KEY}` em uma palavra
 *      pronunciável — e este texto entra no prompt do modelo.
 *
 * Devolver '' é saída de primeira classe: quer dizer "não fale nome nenhum".
 *
 * SEM IMPORTS DE PROPÓSITO. A Edge Function `cibelly-session` roda em Deno, que
 * não conhece o alias "@/" nem o resto do bundle — ela importa ESTE arquivo por
 * caminho relativo. É o que evita a cópia paralela (o precedente do repo,
 * `primeiroNome()` em index.ts, custa 6 linhas; as listas daqui custariam 100+,
 * e `supabase/functions` está fora do eslint, do tsc e do vitest).
 */

/** Partículas que nunca são nome de chamar ("Maria de Souza" → Maria). */
const PARTICLES = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e',
  'di', 'du', 'del', 'della', 'van', 'von', 'y', 'la', 'le',
])

/**
 * Tratamento digitado junto do nome. Descartado em laço no começo do campo.
 * "Seu" está aqui porque é o par masculino exato de "Dona" e igualmente comum
 * em ficha de paciente idoso; "irmã" NÃO está, porque colide com o prenome Irma.
 */
const TREATMENTS = new Set([
  'dr', 'dra', 'doutor', 'doutora', 'sr', 'sra', 'srta', 'seu', 'dona', 'dna', 'd',
  'prof', 'profa', 'paciente', 'menor',
  'vo', 'vovo', 'vovó', 'tia', 'tio', 'pastor', 'padre', 'dom', 'madre',
])

/**
 * Palavra que aparece no campo nome mas NÃO é nome de gente: convênio digitado
 * junto e placeholder de cadastro. Só sabe CALAR — por isso é auditável sem
 * risco, ao contrário de uma lista que faz a assistente FALAR alguma coisa.
 */
const NOT_A_NAME = new Set([
  // convênios (a recepção escreve tanto antes quanto depois do nome)
  'unimed', 'amil', 'bradesco', 'sulamerica', 'odontoprev', 'hapvida', 'golden',
  'notredame', 'particular', 'convenio', 'plano',
  // placeholders de cadastro
  'novo', 'nova', 'teste', 'encaixe', 'retorno', 'avaliacao', 'espolio',
  'falecido', 'obito', 'fulano', 'fulana', 'beltrano', 'sicrano', 'xxx', 'nn',
  // anotação que a recepção emenda depois da vírgula
  'mae', 'pai', 'filho', 'filha', 'responsavel', 'gestante', 'anos', 'acompanhante',
])

/**
 * Sobrenome de altíssima frequência que NÃO existe como prenome no Brasil.
 * Serve para UM caso: o import legado que grava "RIBEIRO ANA LUCIA". Achando um
 * destes na PRIMEIRA posição de um nome com 2+ tokens, o cadastro está
 * invertido e a função desiste — dizer "Paciente Ribeiro" é o erro cardinal.
 *
 * Ficam de FORA de propósito Rosa, Cruz, Miranda, Duarte, Xavier, Batista,
 * Neves e Vitória: são prenome de gente de verdade, e calá-las custaria mais do
 * que o erro que evitariam. E nada de regra morfológica de patronímico (-es):
 * calaria Inês, Lourdes, Moisés, Ulisses e Mercedes.
 */
const SURNAMES = new Set([
  'silva', 'santos', 'souza', 'sousa', 'oliveira', 'lima', 'costa', 'pereira',
  'ferreira', 'rodrigues', 'almeida', 'ribeiro', 'carvalho', 'gomes', 'martins',
  'nascimento', 'araujo', 'barros', 'freitas', 'cardoso', 'teixeira', 'monteiro',
  'moreira', 'nunes', 'mendes', 'cavalcanti', 'machado', 'fonseca', 'azevedo',
  'lopes', 'marques', 'soares', 'pinto', 'cunha', 'coelho', 'andrade', 'bezerra',
  'alves', 'dias', 'ramos', 'rocha', 'barbosa', 'melo', 'correia', 'vieira',
  'campos', 'reis', 'farias', 'sampaio', 'siqueira', 'nogueira', 'albuquerque',
  'guimaraes', 'magalhaes', 'macedo', 'pinheiro', 'borges', 'fernandes',
  'goncalves', 'moraes', 'castro', 'antunes', 'tavares',
])

/** Sufixo de geração — só descartado quando há nome ANTES ("Neto" sozinho é apelido). */
const GENERATION_SUFFIXES = new Set([
  'junior', 'jr', 'filho', 'neto', 'netto', 'sobrinho', 'ii', 'iii', 'iv',
])

/**
 * NOME COMPOSTO — a decisão NÃO é "o segundo token parece nome próprio", é um
 * PAR: prefixo na posição 1 × segundo elemento na posição 2. "Ana Beatriz" é
 * composto; "Camila Beatriz" é Camila com nome do meio. Sem o portão do
 * prefixo, a regra estoura para todo mundo que tem nome do meio.
 */
const COMPOUND_PREFIXES = new Set([
  'maria', 'ana', 'jose', 'joao', 'luiz', 'luis',
  'antonio', 'francisco', 'pedro', 'carlos', 'marco', 'marcos', 'paulo',
])

/**
 * Segundos elementos. Só entra nome que NÃO circula como sobrenome brasileiro —
 * por isso ficam de fora Augusto, Batista, Gonzaga, Duarte e Xavier, que
 * existem como composto mas colidem com sobrenome comum, e também César e
 * Miguel, os dois únicos que erraram PARA MAIS na medição ("Marcos Cesar
 * Simões" e "Paulo Miguel Antunes" viravam duas palavras indevidamente).
 */
const COMPOUND_SECONDS = new Set([
  // femininos
  'clara', 'luisa', 'luiza', 'eduarda', 'beatriz', 'fernanda', 'carolina',
  'cecilia', 'helena', 'julia', 'alice', 'vitoria', 'paula', 'cristina',
  'lucia', 'rita', 'aparecida', 'flavia', 'gabriela', 'maria', 'isabel',
  'sofia', 'sophia', 'antonia', 'laura', 'livia', 'regina', 'teresa', 'tereza',
  // masculinos
  'jose', 'pedro', 'vitor', 'victor', 'henrique', 'carlos', 'felipe',
  'fernando', 'antonio', 'guilherme', 'eduardo', 'ricardo', 'roberto',
  'lucas', 'marcos', 'paulo', 'alberto', 'gustavo',
])

/** Token falável: começa em letra, segue em letra/hífen/apóstrofo. */
const SPEAKABLE = /^\p{L}[\p{L}'’-]*$/u

/**
 * Espaço, em escape e não literal — o eslint proíbe caractere de espaço exótico
 * no código-fonte, e com razão: são invisíveis na revisão. `\s` com a flag `u`
 * já cobre NBSP, espaço fino, ideográfico e BOM; o que falta são os de largura
 * zero, que vêm colados do Excel e partiriam o token no meio.
 */
const SPACES = /[\s\u200B-\u200D]+/gu

/** Teto de tamanho — aplicado ANTES de qualquer outra coisa. */
const MAX_FIELD = 120
const MAX_TOKEN = 20

/** Sem acento, sem caixa, sem pontuação: 'Luís' e 'Luiz' viram a mesma chave. */
function key(token: string): string {
  return token
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.'’ªº]/g, '')
    .toLowerCase()
}

function capitalizeWord(word: string): string {
  return word
    .split('-')
    .map(part => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join('-')
}

/** 'MARIA DE SOUZA' → 'Maria de Souza'. CAIXA ALTA no prompt faz o TTS soletrar. */
function capitalize(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word, i) => {
      if (i > 0 && PARTICLES.has(word)) return word
      const apostrophe = word.match(/^([dlo])['’](.+)$/)
      if (apostrophe) return `${apostrophe[1]}'${capitalizeWord(apostrophe[2])}`
      return capitalizeWord(word)
    })
    .join(' ')
}

/**
 * De que lado do separador está o nome. A recepção escreve o convênio dos DOIS
 * lados ("UNIMED - MARIA SILVA" e "Michelle Dratovsky - Unimed"), então ficar
 * sempre com a esquerda produz "Paciente Unimed". Fica com o lado de MAIS
 * palavras; empate resolve na esquerda (é onde o nome está em "Maria (mãe)").
 */
function nameSide(text: string, separator: RegExp | string): string {
  const parts = typeof separator === 'string' ? text.split(separator) : text.split(separator)
  if (parts.length < 2) return text
  return parts.reduce((best, part) => {
    const count = (n: string) => n.trim().split(/\s+/).filter(Boolean).length
    return count(part) > count(best) ? part : best
  })
}

/**
 * Saneia um campo que JÁ é nome de chamar (`common_name`, digitado pela
 * clínica). Passa por um portão mais leve que a derivação — a clínica escolheu
 * de propósito — mas não por nenhum: "Sra Marlene" vira "Marlene", "Duda Silva"
 * vira "Duda" (sobrenome falado é o erro cardinal, mesmo vindo da porta da
 * frente) e "Particular" cai fora para a derivação tomar conta.
 */
function sanitizeSpoken(raw: string | null | undefined): string {
  if (!raw) return ''
  const text = raw.slice(0, MAX_FIELD).replace(SPACES, ' ').trim()
  if (!text) return ''

  let tokens = text.split(' ').filter(Boolean).slice(0, 2)

  // "Dona Cida" fica inteiro — "Dona" ali é escolha da clínica e soa certo.
  const keepBoth = tokens.length === 2 && key(tokens[0]) === 'dona'
  if (tokens.length === 2 && TREATMENTS.has(key(tokens[0])) && !keepBoth) {
    tokens = tokens.slice(1)
  }
  // SEGUNDO TOKEN só sobrevive se for prenome conhecido. A lista de sobrenomes
  // cobre os frequentes, mas "Michelle Dratovsky" digitado aqui passaria por
  // ela e a Cibelly falaria o sobrenome — o erro cardinal entrando pela porta
  // da frente. Invertendo o teste (permitir em vez de proibir), sobrenome raro
  // cai junto: o pior caso vira um nome mais curto, que é grátis.
  if (tokens.length === 2 && !keepBoth && !COMPOUND_SECONDS.has(key(tokens[1]))) {
    tokens = tokens.slice(0, 1)
  }
  if (!tokens.length) return ''
  // Campo inteiro é lixo ("Particular") → devolve vazio e quem chamou cai na
  // derivação do nome completo.
  if (tokens.every(t => NOT_A_NAME.has(key(t)))) return ''
  if (!tokens.every(t => SPEAKABLE.test(t) && t.length <= MAX_TOKEN)) return ''

  return capitalize(tokens.join(' '))
}

/** Deriva o nome de chamar a partir do nome COMPLETO do cadastro. */
export function spokenNameFromFullName(raw: string | null | undefined): string {
  if (!raw) return ''

  let text = raw.slice(0, MAX_FIELD).replace(SPACES, ' ').trim()
  if (!text) return ''
  if (text.includes('@')) return ''
  if (!/\p{L}/u.test(text)) return ''

  // Convênio/anotação colada com separador, dos dois lados.
  text = nameSide(text, /[(/|]/)
  text = nameSide(text, ' - ')
  text = text.trim()
  if (!text) return ''

  // VÍRGULA. Inverte só quando a esquerda tem UM token — é a assinatura do
  // export legado ("Dias, Rafael"). Em campo digitado à mão a vírgula é
  // anotação ("Maria Silva, mãe do Pedro") e a direita é justamente o lixo.
  const comma = text.indexOf(',')
  if (comma >= 0) {
    const left = text.slice(0, comma).trim()
    const right = text.slice(comma + 1).trim()
    text = left.split(' ').filter(Boolean).length === 1 ? (right || left) : left
    if (!text) return ''
  }

  const rawTokens = text.split(' ').filter(Boolean)
  const tokenCount = rawTokens.length   // contado ANTES dos descartes (ver a regra do invertido)

  const tokens = rawTokens
    // ª/º são marca de abreviação ("Mª" = Maria), e `ª` é \p{L}, então o portão
    // de pronunciabilidade sozinho a deixaria passar como nome.
    .map(t => t.replace(/[.ªº]/g, ''))
    .filter(t => t.length > 1)                                   // inicial abreviada
    .filter(t => !/\d/.test(t))                                  // "32 anos"
    .filter(t => /[aeiouy]/.test(key(t)))                        // "RN", "JM" — sigla nunca é nome
    .filter(t => !TREATMENTS.has(key(t)))
    .filter((t, i) => !(i > 0 && GENERATION_SUFFIXES.has(key(t))))
  if (!tokens.length) return ''

  const first = tokens[0]

  // PORTÃO DE PRONUNCIABILIDADE. Reprovou, DESISTE — nunca varre para o token
  // seguinte: em "Maria; DROP TABLE patient" isso faria a Cibelly dizer "Drop".
  if (!SPEAKABLE.test(first) || first.length > MAX_TOKEN) return ''
  // "D'Ávila Maria" / "O'Brien Sarah": prefixo de apóstrofo é sobrenome.
  if (/^[dlo]['’]/i.test(first)) return ''

  const k1 = key(first)
  if (PARTICLES.has(k1)) return ''                        // começa em partícula = invertido
  if (NOT_A_NAME.has(k1)) return ''                       // convênio/placeholder
  if (SURNAMES.has(k1) && tokenCount > 1) return ''       // "RIBEIRO ANA LUCIA"

  // COMPOSTO: o par prefixo × segundo elemento, e para SEMPRE em duas palavras.
  const second = tokens[1]
  if (second && SPEAKABLE.test(second) && second.length <= MAX_TOKEN) {
    const k2 = key(second)
    if (COMPOUND_PREFIXES.has(k1) && COMPOUND_SECONDS.has(k2)) {
      return capitalize(`${first} ${second}`)
    }
  }

  return capitalize(first)
}

/**
 * PONTO DE ENTRADA. O que a clínica digitou em `common_name` ganha de qualquer
 * heurística; vazio (ou lixo) cai na derivação do nome completo.
 *
 * ATENÇÃO ao que este valor NÃO é: uma autorização para falar o nome. Ele é uma
 * INFERÊNCIA sobre o nome de registro. Para paciente trans com nome social, o
 * nome de registro é exatamente o que não pode ser dito em voz alta — e do
 * ponto de vista de string não há nada a detectar. Quem resolve isso é a
 * clínica preenchendo `common_name`, e é por isso que o rótulo daquele campo no
 * cadastro diz que é o nome que a assistente fala.
 */
export function spokenName(
  commonName: string | null | undefined,
  fullName: string | null | undefined,
): string {
  return sanitizeSpoken(commonName) || spokenNameFromFullName(fullName)
}
