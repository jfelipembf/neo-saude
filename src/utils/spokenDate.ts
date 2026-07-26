/**
 * DATA DITA EM VOZ ALTA.
 *
 * Existe por causa de uma falha real: a assistente confirmou "quinta dia 30 —
 * do mês que vem, no caso" num dia 26 do MESMO mês. A data que ela mandou para
 * a ferramenta estava certa; o que ela FALOU estava errado.
 *
 * A causa era mais grave que o sintoma: o prompt mandava ela converter "quinta
 * que vem" para aaaa-mm-dd sem nunca dizer que dia era hoje. Ela estava
 * adivinhando — e adivinhar acertou a data e errou o mês na mesma frase.
 *
 * A defesa é dupla, e nenhuma das duas é "pedir para o modelo caprichar":
 *  1. O prompt passa a AFIRMAR a data de hoje, com dia da semana.
 *  2. As ferramentas devolvem a data já ESCRITA por extenso, para ela ler em
 *     vez de calcular. Ler não erra; calcular erra.
 *
 * Sem imports: a Edge Function (Deno) carrega este arquivo por caminho
 * relativo, igual ao spokenName.ts.
 */

const DIAS = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado',
]

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

/** 'aaaa-mm-dd' → Date em UTC ao meio-dia (imune a shift de fuso). */
function meioDiaUtc(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12))
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * 'aaaa-mm-dd' → 'quinta-feira, 30 de julho de 2026'.
 *
 * É esta string que vai no retorno das ferramentas, para a Cibelly LER a
 * confirmação em vez de deduzir o dia da semana de cabeça.
 */
export function dataPorExtenso(iso: string): string {
  const d = meioDiaUtc(iso)
  if (!d) return ''
  return `${DIAS[d.getUTCDay()]}, ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`
}

/**
 * Como a data se situa em relação a hoje — "hoje", "amanhã", "daqui a 4 dias",
 * "há 2 dias". A Cibelly recebe pronto, então não precisa (nem deve) inventar
 * "mês que vem".
 */
export function distanciaDeHoje(iso: string, hojeIso: string): string {
  const alvo = meioDiaUtc(iso)
  const hoje = meioDiaUtc(hojeIso)
  if (!alvo || !hoje) return ''
  const dias = Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000)
  if (dias === 0) return 'hoje'
  if (dias === 1) return 'amanhã'
  if (dias === -1) return 'ontem'
  return dias > 0 ? `daqui a ${dias} dias` : `há ${Math.abs(dias)} dias`
}

/**
 * 'sábado' | 'domingo' quando a data cai no fim de semana; null nos outros dias.
 *
 * Serve para a assistente AVISAR antes de marcar. Um cálculo relativo inocente
 * ("daqui a duas semanas") cai em fim de semana com frequência, e o dentista
 * quase nunca quis isso — mas a clínica que ATENDE aos sábados não pode ser
 * impedida, então é aviso com pergunta, nunca recusa.
 */
export function fimDeSemana(iso: string): 'sábado' | 'domingo' | null {
  const d = meioDiaUtc(iso)
  if (!d) return null
  const dia = d.getUTCDay()
  if (dia === 0) return 'domingo'
  if (dia === 6) return 'sábado'
  return null
}

const DIA_DA_SEMANA: Record<string, number> = {
  domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6,
}

/** Sem acento e em minúsculas, para casar "terça" com "terca". */
function semAcento(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/**
 * "QUINTA QUE VEM" É AMBÍGUA — e esta função é a prova disso virada em código.
 *
 * Em português do Brasil, "quinta que vem" tanto significa a PRÓXIMA quinta
 * quanto a quinta da SEMANA seguinte, e falantes nativos discordam. Medi na
 * prática: a mesma frase, no mesmo dia, devolveu 30/07 numa rodada e 06/08 na
 * outra. Nenhuma das duas está errada — o problema é escolher sem perguntar.
 *
 * Pedir no prompt para ela perguntar NÃO funcionou (testado): ela não se percebe
 * em dúvida. Então quem decide é o código: recebe a frase que o dentista falou,
 * e se ela for desta família devolve as DUAS datas para a assistente ler e
 * perguntar qual.
 *
 * Devolve null quando não há ambiguidade — "dia 6", "amanhã", "daqui a duas
 * semanas" resolvem sozinhas e não custam pergunta nenhuma.
 */
export function datasAmbiguas(
  frase: string | undefined,
  hojeIso: string,
): { proxima: string; seguinte: string; diaDaSemana: string } | null {
  if (!frase) return null
  const t = semAcento(frase)

  // Só a família "que vem"/"próxima" gera a dúvida. "esta quinta" e "quinta dia
  // 6" são explícitas.
  if (!/(que vem|proxim)/.test(t)) return null
  // Um número de dia na frase desfaz a ambiguidade ("quinta dia 6").
  if (/\bdia\s+\d/.test(t)) return null

  const nome = Object.keys(DIA_DA_SEMANA).find(d => t.includes(d))
  if (!nome) return null

  const hoje = meioDiaUtc(hojeIso)
  if (!hoje) return null

  // Próxima ocorrência ESTRITAMENTE depois de hoje: se hoje é quinta, "quinta
  // que vem" nunca é hoje.
  const delta = ((DIA_DA_SEMANA[nome] - hoje.getUTCDay() + 7) % 7) || 7
  const proxima = new Date(hoje.getTime() + delta * 86_400_000)
  const seguinte = new Date(proxima.getTime() + 7 * 86_400_000)
  const iso = (d: Date) => d.toISOString().slice(0, 10)

  return { proxima: iso(proxima), seguinte: iso(seguinte), diaDaSemana: nome }
}

/**
 * O bloco que ANCORA o prompt no tempo real. Sem ele o modelo usa a data que
 * imaginar — normalmente a do treinamento.
 */
export function blocoDeHoje(hojeIso: string): string {
  const porExtenso = dataPorExtenso(hojeIso)
  if (!porExtenso) return ''
  return `HOJE É ${porExtenso} (${hojeIso}).

Isto é um FATO, não uma estimativa: use esta data como origem de qualquer cálculo ("segunda que vem", "daqui a 15 dias", "no dia 3"). Nunca use outra data de referência, venha ela de onde vier.
NUNCA descreva uma data com palavras que você não conferiu contra a data acima. Já aconteceu de você dizer "do mês que vem" para uma data do MESMO mês — o dia estava certo e a frase estava errada, e é a frase que o paciente ouve.
Quando a ferramenta devolver a data escrita por extenso, LEIA o que ela devolveu. Não recalcule o dia da semana nem o mês de cabeça.
Na dúvida entre duas datas possíveis, pergunte qual — nunca escolha por conta própria.`
}
