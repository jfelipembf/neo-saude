import { describe, expect, it } from 'vitest'
import {
  buildCashFlowMatrix, cashFlowColumns, defaultCashFlowWindow, shiftCashFlowWindow,
} from './cashFlowMatrix'
import type { CashFlowCell } from './cashFlowMatrix'

// 27/07/2026 é uma SEGUNDA — a semana do app vai de segunda a domingo.
const SEMANA = { from: '2026-07-27', to: '2026-08-02' }

function celula(bucket: string, kind: 'revenue' | 'expense', category: string, amount: number): CashFlowCell {
  return { bucket, kind, category, amount, count: 1 }
}

describe('cashFlowColumns', () => {
  it('gera uma coluna por dia, inclusive as sem movimento', () => {
    const c = cashFlowColumns(SEMANA, 'day')
    expect(c).toHaveLength(7)
    expect(c[0]).toEqual({ id: '2026-07-27', label: '27/07' })
    expect(c[6]).toEqual({ id: '2026-08-02', label: '02/08' })
  })

  it('a coluna semanal começa na segunda e rotula o intervalo', () => {
    const c = cashFlowColumns({ from: '2026-07-27', to: '2026-08-09' }, 'week')
    expect(c.map(x => x.id)).toEqual(['2026-07-27', '2026-08-03'])
    expect(c[0].label).toBe('27/07 a 02/08')
  })

  // A chave do balde vem do date_trunc do banco, que pode cair ANTES do início
  // da janela. A coluna tem de usar a mesma chave, senão a célula não acha o
  // seu lugar e o valor some da tabela.
  it('janela que começa no meio da semana ancora o balde na segunda', () => {
    const c = cashFlowColumns({ from: '2026-07-29', to: '2026-08-02' }, 'week')
    expect(c[0].id).toBe('2026-07-27')
    expect(c[0].label).toBe('29/07 a 02/08')   // rótulo recortado pela janela
  })

  it('coluna mensal usa o mês abreviado', () => {
    const c = cashFlowColumns({ from: '2026-07-01', to: '2026-09-30' }, 'month')
    expect(c.map(x => x.label)).toEqual(['Jul/2026', 'Ago/2026', 'Set/2026'])
  })
})

describe('defaultCashFlowWindow / shiftCashFlowWindow', () => {
  const quarta = new Date(2026, 6, 29)   // 29/07/2026

  it('diário abre na semana que contém a data', () => {
    expect(defaultCashFlowWindow('day', quarta)).toEqual({ from: '2026-07-27', to: '2026-08-02' })
  })

  it('mensal abre no primeiro dia do mês e fecha 12 meses depois', () => {
    expect(defaultCashFlowWindow('month', quarta)).toEqual({ from: '2026-07-01', to: '2027-06-30' })
  })

  // Fevereiro fecha em 28 sem tabela de tamanhos de mês.
  it('o fim do mês respeita o tamanho do mês', () => {
    expect(defaultCashFlowWindow('month', new Date(2026, 2, 10)).to).toBe('2027-02-28')
  })

  it('avança e volta uma janela inteira', () => {
    const proxima = shiftCashFlowWindow(SEMANA, 'day', 1)
    expect(proxima).toEqual({ from: '2026-08-03', to: '2026-08-09' })
    expect(shiftCashFlowWindow(proxima, 'day', -1)).toEqual(SEMANA)
  })

  it('voltar 12 meses cai no ano anterior', () => {
    expect(shiftCashFlowWindow({ from: '2026-07-01', to: '2027-06-30' }, 'month', -1).from)
      .toBe('2025-07-01')
  })
})

describe('buildCashFlowMatrix', () => {
  const CELULAS = [
    celula('2026-07-27', 'revenue', 'Atendimento', 1000),
    celula('2026-07-27', 'expense', 'Funcionários', 300),
    celula('2026-07-29', 'revenue', 'Outros', 200),
    celula('2026-07-29', 'revenue', 'Atendimento', 500),
    celula('2026-07-29', 'expense', 'Impostos', 100),
  ]

  it('agrupa por categoria e soma o grupo', () => {
    const m = buildCashFlowMatrix(CELULAS, 0, SEMANA, 'day')
    const receitas = m.rows.find(r => r.key === 'revenue')!
    expect(receitas.values[0]).toBe(1000)   // 27/07
    expect(receitas.values[2]).toBe(700)    // 29/07: 200 + 500
    expect(receitas.total).toBe(1700)
  })

  it('Outros vai por último, o resto em ordem alfabética', () => {
    const m = buildCashFlowMatrix(CELULAS, 0, SEMANA, 'day')
    const receita = m.rows.filter(r => r.type === 'category' && r.tone === 'revenue')
    expect(receita.map(r => r.label)).toEqual(['Atendimento', 'Outros'])
  })

  it('geração de caixa é receita menos despesa, coluna a coluna', () => {
    const m = buildCashFlowMatrix(CELULAS, 0, SEMANA, 'day')
    const geracao = m.rows.find(r => r.key === 'net')!
    expect(geracao.values[0]).toBe(700)     // 1000 − 300
    expect(geracao.values[2]).toBe(600)     // 700 − 100
    expect(geracao.values[1]).toBe(0)
  })

  // O encadeamento é o coração da tabela: o final de uma coluna é o anterior
  // da seguinte. Se isto escorregar, a tela mente sobre quanto a clínica tem.
  it('o saldo final de uma coluna é o saldo anterior da próxima', () => {
    const m = buildCashFlowMatrix(CELULAS, 5000, SEMANA, 'day')
    const anterior = m.rows.find(r => r.key === 'opening')!
    const final = m.rows.find(r => r.key === 'closing')!

    expect(anterior.values[0]).toBe(5000)
    expect(final.values[0]).toBe(5700)
    for (let i = 1; i < m.columns.length; i++) {
      expect(anterior.values[i]).toBe(final.values[i - 1])
    }
    expect(final.values[6]).toBe(6300)      // 5000 + 700 + 600
  })

  // Somar saldos de períodos diferentes não significa nada — o total destas
  // linhas é o saldo, não a soma.
  it('a coluna Total do saldo mostra o saldo, não a soma dos saldos', () => {
    const m = buildCashFlowMatrix(CELULAS, 5000, SEMANA, 'day')
    expect(m.rows.find(r => r.key === 'opening')!.total).toBe(5000)
    expect(m.rows.find(r => r.key === 'closing')!.total).toBe(6300)
  })

  it('sem movimento, as linhas de resultado seguram o saldo de abertura', () => {
    const m = buildCashFlowMatrix([], 800, SEMANA, 'day')
    expect(m.rows.find(r => r.key === 'net')!.values.every(v => v === 0)).toBe(true)
    expect(m.rows.find(r => r.key === 'closing')!.values.every(v => v === 800)).toBe(true)
  })

  it('saldo de abertura negativo continua negativo', () => {
    const m = buildCashFlowMatrix([], -250, SEMANA, 'day')
    expect(m.rows.find(r => r.key === 'closing')!.total).toBe(-250)
  })

  // A RPC lê o histórico inteiro para o saldo anterior; só a janela vira tabela.
  it('célula fora da janela não entra na tabela', () => {
    const m = buildCashFlowMatrix(
      [...CELULAS, celula('2026-06-01', 'revenue', 'Atendimento', 9999)], 0, SEMANA, 'day',
    )
    expect(m.rows.find(r => r.key === 'revenue')!.total).toBe(1700)
  })

  it('mantém a ordem grupo → categorias → resultados', () => {
    const m = buildCashFlowMatrix(CELULAS, 0, SEMANA, 'day')
    expect(m.rows.map(r => r.key)).toEqual([
      'revenue', 'revenue:Atendimento', 'revenue:Outros',
      'expense', 'expense:Funcionários', 'expense:Impostos',
      'net', 'opening', 'closing',
    ])
  })
})
