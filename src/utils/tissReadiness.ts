/**
 * O QUE FALTA PARA FATURAR — a checagem que evita descobrir tarde.
 *
 * Guia TISS é recusada por campo obrigatório vazio, e a recusa chega semanas
 * depois, em lote, sem dizer qual dos vinte campos era. Este módulo faz a
 * pergunta ANTES: dado o cadastro que existe hoje, esta guia sai válida?
 *
 * Cada pendência diz TRÊS coisas — o que falta, ONDE se resolve e de quem é.
 * "CNES não informado" manda a recepção procurar; "Clínica: falta o CNES
 * (Configurações → Clínica)" resolve.
 *
 * É função pura de propósito: a mesma checagem roda na tela da guia, na lista de
 * pendências e (depois) antes de fechar o lote. Três telas, uma regra.
 */

/** De quem é a pendência — agrupa a lista por quem precisa agir. */
export type OrigemDaPendencia =
  | 'clinica'
  | 'convenio'
  | 'profissional'
  | 'paciente'
  | 'procedimento'
  | 'guia'

export interface Pendencia {
  origem: OrigemDaPendencia
  /** Frase pronta, já dizendo onde resolver. */
  texto: string
}

export interface CadastroDaGuia {
  clinica: { cnes?: string }
  convenio: { nome: string; ans?: string; providerCode?: string }
  profissional: {
    nome: string
    license?: string
    council?: string
    councilState?: string
    cbo?: string
  }
  paciente: {
    nome: string
    insuranceCard?: string
    /** dd/mm/aaaa */
    insuranceCardValidUntil?: string
  }
  procedimentos: { descricao: string; tussCode?: string; tussTable?: string; valor: number }[]
  /** Data do atendimento, aaaa-mm-dd — para conferir a validade da carteirinha. */
  atendimentoIso: string
}

const ROTULO: Record<OrigemDaPendencia, string> = {
  clinica: 'Clínica',
  convenio: 'Convênio',
  profissional: 'Profissional',
  paciente: 'Paciente',
  procedimento: 'Procedimento',
  guia: 'Guia',
}

function vazio(v: string | undefined): boolean {
  return !v || v.trim() === ''
}

/** dd/mm/aaaa → aaaa-mm-dd, para comparar com a data do atendimento como texto. */
function brParaIso(br: string): string | null {
  const partes = br.split('/')
  if (partes.length !== 3) return null
  const [d, m, a] = partes
  if (!d || !m || !a) return null
  return `${a.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

/**
 * Tudo que impede esta guia de sair. Lista vazia = pronta para faturar.
 *
 * A ordem é a de quem resolve mais rápido primeiro (cadastro da clínica, que é
 * um campo só e vale para todas as guias) até a mais específica (o procedimento
 * daquele atendimento).
 */
export function pendenciasDaGuia(cadastro: CadastroDaGuia): Pendencia[] {
  const faltas: Pendencia[] = []

  if (vazio(cadastro.clinica.cnes)) {
    faltas.push({ origem: 'clinica', texto: 'Falta o CNES (Configurações → Clínica).' })
  }

  if (vazio(cadastro.convenio.ans)) {
    faltas.push({
      origem: 'convenio',
      texto: `${cadastro.convenio.nome} está sem registro ANS (Administrativo → Convênios).`,
    })
  }
  if (vazio(cadastro.convenio.providerCode)) {
    faltas.push({
      origem: 'convenio',
      texto: `Falta o código do prestador em ${cadastro.convenio.nome} (Administrativo → Convênios).`,
    })
  }

  const prof = cadastro.profissional
  if (vazio(prof.council)) {
    faltas.push({ origem: 'profissional', texto: `${prof.nome} está sem a sigla do conselho.` })
  }
  if (vazio(prof.councilState)) {
    faltas.push({ origem: 'profissional', texto: `${prof.nome} está sem a UF do conselho.` })
  }
  if (vazio(prof.license)) {
    faltas.push({ origem: 'profissional', texto: `${prof.nome} está sem o número do registro.` })
  }
  if (vazio(prof.cbo)) {
    faltas.push({ origem: 'profissional', texto: `${prof.nome} está sem o CBO-S.` })
  }

  const pac = cadastro.paciente
  if (vazio(pac.insuranceCard)) {
    faltas.push({ origem: 'paciente', texto: `${pac.nome} está sem o número da carteirinha.` })
  }
  // Carteirinha vencida NA DATA DO ATENDIMENTO é glosa — e a data que vale é a
  // do atendimento, não a de hoje: guia atrasada de um atendimento antigo pode
  // estar perfeitamente válida.
  const validade = pac.insuranceCardValidUntil ? brParaIso(pac.insuranceCardValidUntil) : null
  if (validade && validade < cadastro.atendimentoIso) {
    faltas.push({
      origem: 'paciente',
      texto: `A carteirinha de ${pac.nome} venceu em ${pac.insuranceCardValidUntil}, antes do atendimento.`,
    })
  }

  if (cadastro.procedimentos.length === 0) {
    faltas.push({ origem: 'guia', texto: 'A guia não tem nenhum procedimento.' })
  }
  for (const p of cadastro.procedimentos) {
    if (vazio(p.tussCode)) {
      faltas.push({ origem: 'procedimento', texto: `"${p.descricao}" está sem código TUSS.` })
    }
    if (vazio(p.tussTable)) {
      faltas.push({ origem: 'procedimento', texto: `"${p.descricao}" está sem a tabela de origem do TUSS.` })
    }
    if (p.valor <= 0) {
      faltas.push({
        origem: 'procedimento',
        texto: `"${p.descricao}" está sem valor negociado com ${cadastro.convenio.nome}.`,
      })
    }
  }

  return faltas
}

/** Pronta para faturar? Açúcar sobre pendenciasDaGuia, para leitura na tela. */
export function guiaPodeSerEmitida(cadastro: CadastroDaGuia): boolean {
  return pendenciasDaGuia(cadastro).length === 0
}

/**
 * As pendências agrupadas por quem resolve, em texto corrido — o resumo que a
 * tela mostra no topo e que a Cibelly consegue ler em voz alta.
 */
export function resumoDasPendencias(faltas: Pendencia[]): string {
  if (faltas.length === 0) return 'Pronta para faturar.'

  const porOrigem = new Map<OrigemDaPendencia, string[]>()
  for (const f of faltas) {
    porOrigem.set(f.origem, [...(porOrigem.get(f.origem) ?? []), f.texto])
  }
  return [...porOrigem.entries()]
    .map(([origem, textos]) => `${ROTULO[origem]}: ${textos.join(' ')}`)
    .join(' ')
}
