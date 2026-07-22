import { describe, expect, it } from 'vitest'
import { goalProgress, percentChange } from './metrics'
import { GOAL_METRICS, GOAL_METRIC_LABEL, GOAL_METRIC_HELP, GOAL_METRIC_IS_MONEY, GOAL_METRIC_HIGHER_IS_BETTER } from '@/constants/goals'

describe('percentChange', () => {
  it('calcula a variação sobre o mês anterior', () => {
    // Os números reais do teste da RPC: faturamento 300 → 1500.
    expect(percentChange(1500, 300)).toBe(400)
    expect(percentChange(250, 100)).toBe(150)
    expect(percentChange(3, 2)).toBe(50)
  })

  it('devolve variação negativa quando o mês caiu', () => {
    expect(percentChange(80, 100)).toBe(-20)
  })

  it('devolve 0 quando não houve mudança', () => {
    expect(percentChange(100, 100)).toBe(0)
  })

  it('devolve null quando não há mês anterior (estoque sem histórico)', () => {
    // Contrato do helper, não de uma métrica: as quatro de hoje têm mês
    // anterior, mas `previous: null` continua tendo de virar "sem variação".
    expect(percentChange(2, null)).toBeNull()
  })

  it('devolve null quando o mês anterior foi zero, em vez de infinito', () => {
    // Clínica no primeiro mês de uso: sem esta guarda vira "+∞%" na tela.
    expect(percentChange(1500, 0)).toBeNull()
    expect(percentChange(0, 0)).toBeNull()
  })
})

describe('goalProgress', () => {
  it('calcula o percentual da meta cumprido', () => {
    expect(goalProgress(1500, 50000)).toBe(3)
    expect(goalProgress(150, 300)).toBe(50)
  })

  it('não capa em 100 — meta superada aparece como superada', () => {
    expect(goalProgress(450, 300)).toBe(150)
  })

  it('devolve null sem meta cadastrada, em vez de 0%', () => {
    // 0% seria lido como "não andou nada"; o certo é "não há meta".
    expect(goalProgress(1500, null)).toBeNull()
  })

  it('devolve null com meta zerada, sem dividir por zero', () => {
    // O CHECK do banco impede gravar 0, mas o front não depende disso.
    expect(goalProgress(1500, 0)).toBeNull()
  })
})

describe('constantes das métricas', () => {
  // Ponta solta registrada na migration: se o enum do banco e as chaves de
  // `metrics` divergirem, a meta gravada deixa de casar com o cartão SEM erro
  // nenhum. Este teste é o alarme do lado do front.
  const FROM_DATABASE_ENUM = [
    'appointments_scheduled',
    'appointments_completed',
    'revenue',
    'expenses',
  ]

  it('cobre exatamente os rótulos do enum public.goal_metric', () => {
    expect([...GOAL_METRICS].sort()).toEqual([...FROM_DATABASE_ENUM].sort())
  })

  it('tem rótulo pt, ajuda e natureza para toda métrica', () => {
    for (const metric of GOAL_METRICS) {
      expect(GOAL_METRIC_LABEL[metric]).toBeTruthy()
      expect(GOAL_METRIC_HELP[metric]).toBeTruthy()
      expect(typeof GOAL_METRIC_IS_MONEY[metric]).toBe('boolean')
      expect(typeof GOAL_METRIC_HIGHER_IS_BETTER[metric]).toBe('boolean')
    }
  })

  it('trata só gasto como métrica onde subir é ruim', () => {
    expect(GOAL_METRIC_HIGHER_IS_BETTER.expenses).toBe(false)
    expect(GOAL_METRIC_HIGHER_IS_BETTER.revenue).toBe(true)
  })

  it('trata dinheiro só em faturamento e gastos', () => {
    expect(GOAL_METRIC_IS_MONEY.revenue).toBe(true)
    expect(GOAL_METRIC_IS_MONEY.expenses).toBe(true)
    expect(GOAL_METRIC_IS_MONEY.appointments_scheduled).toBe(false)
    expect(GOAL_METRIC_IS_MONEY.appointments_completed).toBe(false)
  })
})
