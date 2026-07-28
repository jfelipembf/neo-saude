import { MONTHS_SHORT } from '@/constants/dates'
import { addDays, addMonths, localDate, toIsoDate, toShortDate } from '@/utils/date'

/**
 * A MATRIZ DO FLUXO DE CAIXA: categoria na linha, período na coluna.
 *
 * A RPC devolve células soltas (bucket × categoria × valor) porque é o formato
 * que o banco agrega barato. Virar tabela — decidir as colunas que existem
 * mesmo sem movimento, ordenar as categorias, acumular o saldo de uma coluna
 * para a outra — é trabalho de apresentação, e é aqui, puro e testável: saldo
 * que acumula errado é o tipo de defeito que ninguém percebe olhando a tela.
 */

export type CashFlowGranularity = 'day' | 'week' | 'month'

/** Uma célula como a RPC `cash_flow_matrix` devolve. */
export interface CashFlowCell {
  /** Primeiro dia do balde, ISO — já truncado pelo banco (date_trunc). */
  bucket: string
  kind: 'revenue' | 'expense'
  category: string
  amount: number
  count: number
}

export interface CashFlowColumn {
  /** ISO do primeiro dia do balde — a mesma chave que a RPC devolve. */
  id: string
  /** O que o cabeçalho mostra: '27/07', '27/07 a 02/08', 'Jul/2026'. */
  label: string
}

/**
 * O papel da linha na leitura da tabela:
 *
 *  · `group`    — Receitas / Despesas: a soma, com fundo próprio
 *  · `category` — uma categoria raiz dentro do grupo acima
 *  · `result`   — Geração de caixa, Saldo anterior, Saldo final
 */
export type CashFlowRowType = 'group' | 'category' | 'result'

export interface CashFlowMatrixRow {
  key: string
  label: string
  type: CashFlowRowType
  tone: 'revenue' | 'expense' | 'neutral'
  /** Um valor por coluna, na mesma ordem de `columns`. */
  values: number[]
  /** Total da linha — a coluna fixa da direita. */
  total: number
}

export interface CashFlowMatrix {
  columns: CashFlowColumn[]
  rows: CashFlowMatrixRow[]
}

// ── Janela de datas ──────────────────────────────────────────────────────────

/** Segunda-feira da semana da data — convenção do app (ver utils/period.ts). */
function segunda(d: Date): Date {
  return addDays(d, -((d.getDay() + 6) % 7))
}

/** Primeiro dia do balde que contém a data — espelha o `date_trunc` da RPC. */
function inicioDoBalde(d: Date, g: CashFlowGranularity): Date {
  if (g === 'day') return d
  if (g === 'week') return segunda(d)
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/**
 * Onde a JANELA começa — que não é onde o balde começa.
 *
 * No diário o balde é o próprio dia (`date_trunc('day')`), mas a janela abre na
 * SEGUNDA: caixa diário se lê por semana do calendário, e uma janela que começa
 * na quarta faz a mesma semana aparecer partida em duas telas conforme o dia em
 * que se abriu o sistema.
 */
function inicioDaJanela(d: Date, g: CashFlowGranularity): Date {
  return g === 'month' ? new Date(d.getFullYear(), d.getMonth(), 1) : segunda(d)
}

/**
 * QUANTAS COLUNAS CADA VISÃO MOSTRA.
 *
 * Dia mostra uma semana porque é assim que se lê caixa diário — e 30 colunas de
 * dia não cabem em tela nenhuma. Semana e mês olham mais longe, que é o motivo
 * de existirem.
 */
const COLUNAS: Record<CashFlowGranularity, number> = { day: 7, week: 8, month: 12 }

export interface CashFlowWindow { from: string; to: string }

/** A janela que contém `ref`, começando no início do balde dele. */
export function defaultCashFlowWindow(g: CashFlowGranularity, ref: Date = new Date()): CashFlowWindow {
  const inicio = inicioDaJanela(ref, g)
  return { from: toIsoDate(inicio), to: toIsoDate(fimDaJanela(inicio, g)) }
}

/** Último dia da janela que começa em `inicio`. */
function fimDaJanela(inicio: Date, g: CashFlowGranularity): Date {
  const n = COLUNAS[g]
  if (g === 'day') return addDays(inicio, n - 1)
  if (g === 'week') return addDays(inicio, n * 7 - 1)
  // Mês: o dia 0 do mês seguinte ao último é o último dia dele — assim
  // fevereiro fecha em 28 (ou 29) sem nenhuma tabela de tamanhos.
  const ultimoInicio = addMonths(inicio, n - 1)
  return new Date(ultimoInicio.getFullYear(), ultimoInicio.getMonth() + 1, 0)
}

/** Avança (`+1`) ou volta (`-1`) uma janela inteira. */
export function shiftCashFlowWindow(
  janela: CashFlowWindow, g: CashFlowGranularity, direcao: 1 | -1,
): CashFlowWindow {
  const inicioAtual = localDate(janela.from)
  const n = COLUNAS[g]
  const novoInicio = g === 'month'
    ? addMonths(inicioAtual, n * direcao)
    : addDays(inicioAtual, (g === 'day' ? n : n * 7) * direcao)
  return { from: toIsoDate(novoInicio), to: toIsoDate(fimDaJanela(novoInicio, g)) }
}

/** As colunas da janela — TODAS elas, inclusive as sem um centavo de movimento:
 *  coluna que some quando não há lançamento faz a tabela mudar de forma a cada
 *  navegação, e um dia vazio é informação (não entrou nada). */
export function cashFlowColumns(janela: CashFlowWindow, g: CashFlowGranularity): CashFlowColumn[] {
  const fim = localDate(janela.to)
  const colunas: CashFlowColumn[] = []
  let cursor = inicioDoBalde(localDate(janela.from), g)

  while (cursor <= fim && colunas.length < 400) {
    colunas.push({ id: toIsoDate(cursor), label: rotuloDaColuna(cursor, g, janela) })
    cursor = g === 'day' ? addDays(cursor, 1)
      : g === 'week' ? addDays(cursor, 7)
      : addMonths(cursor, 1)
  }
  return colunas
}

/** Rótulo do cabeçalho. A semana mostra o intervalo, recortado pela janela —
 *  prometer 27/07 a 02/08 numa coluna que só soma de quarta em diante seria
 *  anunciar movimento que não está ali. */
function rotuloDaColuna(inicio: Date, g: CashFlowGranularity, janela: CashFlowWindow): string {
  if (g === 'day') return toShortDate(inicio)
  if (g === 'month') return `${MONTHS_SHORT[inicio.getMonth()]}/${inicio.getFullYear()}`

  const de = inicio < localDate(janela.from) ? localDate(janela.from) : inicio
  const fimDoBalde = addDays(inicio, 6)
  const ate = fimDoBalde > localDate(janela.to) ? localDate(janela.to) : fimDoBalde
  return toShortDate(de) === toShortDate(ate)
    ? toShortDate(de)
    : `${toShortDate(de)} a ${toShortDate(ate)}`
}

// ── A tabela ─────────────────────────────────────────────────────────────────

/** 'Outros' é o balde do que não foi categorizado — vai por último, senão a
 *  ordem alfabética o joga no meio das categorias de verdade. */
function ordemDasCategorias(a: string, b: string): number {
  if (a === 'Outros') return 1
  if (b === 'Outros') return -1
  return a.localeCompare(b, 'pt-BR')
}

function linhasDeUmGrupo(
  cells: CashFlowCell[], kind: 'revenue' | 'expense', colunas: CashFlowColumn[],
): { total: number[]; categorias: CashFlowMatrixRow[] } {
  const indice = new Map(colunas.map((c, i) => [c.id, i]))
  const porCategoria = new Map<string, number[]>()
  const total = colunas.map(() => 0)

  for (const c of cells) {
    if (c.kind !== kind) continue
    const i = indice.get(c.bucket)
    // Célula fora da janela é descartada em silêncio de propósito: a RPC lê o
    // histórico inteiro para calcular o saldo anterior, e só a janela é tabela.
    if (i === undefined) continue
    let linha = porCategoria.get(c.category)
    if (!linha) { linha = colunas.map(() => 0); porCategoria.set(c.category, linha) }
    linha[i] += c.amount
    total[i] += c.amount
  }

  const categorias = [...porCategoria.entries()]
    .sort((a, b) => ordemDasCategorias(a[0], b[0]))
    .map(([nome, values]) => ({
      key: `${kind}:${nome}`,
      label: nome,
      type: 'category' as const,
      tone: (kind === 'revenue' ? 'revenue' : 'expense') as 'revenue' | 'expense',
      values,
      total: soma(values),
    }))

  return { total, categorias }
}

const soma = (v: number[]) => v.reduce((s, n) => s + n, 0)

/**
 * Monta a tabela inteira: grupos, categorias e as três linhas de resultado.
 *
 * O saldo é ESTOQUE e encadeia — o saldo final de uma coluna é o anterior da
 * seguinte. Por isso "Saldo anterior" não é um total de linha: somar saldos de
 * períodos diferentes não significa nada, e a coluna Total dessas linhas
 * mostra o saldo do FIM da janela.
 */
export function buildCashFlowMatrix(
  cells: CashFlowCell[],
  openingBalance: number,
  janela: CashFlowWindow,
  g: CashFlowGranularity,
): CashFlowMatrix {
  const columns = cashFlowColumns(janela, g)

  const receitas = linhasDeUmGrupo(cells, 'revenue', columns)
  const despesas = linhasDeUmGrupo(cells, 'expense', columns)

  const geracao = columns.map((_, i) => receitas.total[i] - despesas.total[i])

  const saldoAnterior: number[] = []
  const saldoFinal: number[] = []
  let acumulado = openingBalance
  for (let i = 0; i < columns.length; i++) {
    saldoAnterior.push(acumulado)
    acumulado += geracao[i]
    saldoFinal.push(acumulado)
  }

  const rows: CashFlowMatrixRow[] = [
    { key: 'revenue', label: 'Receitas', type: 'group', tone: 'revenue', values: receitas.total, total: soma(receitas.total) },
    ...receitas.categorias,
    { key: 'expense', label: 'Despesas', type: 'group', tone: 'expense', values: despesas.total, total: soma(despesas.total) },
    ...despesas.categorias,
    { key: 'net', label: 'Geração de caixa', type: 'result', tone: 'neutral', values: geracao, total: soma(geracao) },
    // Saldo não soma: o total destas duas é o saldo no FIM da janela.
    { key: 'opening', label: 'Saldo anterior', type: 'result', tone: 'neutral', values: saldoAnterior, total: openingBalance },
    { key: 'closing', label: 'Saldo final', type: 'result', tone: 'neutral', values: saldoFinal, total: acumulado },
  ]

  return { columns, rows }
}
