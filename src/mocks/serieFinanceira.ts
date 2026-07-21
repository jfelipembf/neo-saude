import { gerarSerieConsultas, parseMesIso, ruido } from '@/mocks/serieConsultas'
import type { ChartPeriod, FinancePoint } from '@/types/domain'

// ─────────────────────────────────────────────────────────────────────────────
// Série financeira de demonstração, DERIVADA da série de consultas do mesmo
// período: ganhos = consultas × ticket médio; gastos ≈ 24–40% dos ganhos.
// Determinística como a original — o mesmo mês mostra sempre os mesmos valores.
// ─────────────────────────────────────────────────────────────────────────────

/** Arredonda para a dezena — valores "de caixa" não terminam em R$ x,37. */
function dezena(v: number) {
  return Math.round(v / 10) * 10
}

export function gerarSerieFinanceira(periodo: ChartPeriod, mesIso: string): FinancePoint[] {
  const { ano, mes } = parseMesIso(mesIso)

  return gerarSerieConsultas(periodo, mesIso).map((p, i) => {
    const semente = ano * 1000 + mes * 50 + i
    const ticket = 105 + Math.round(ruido(semente) * 30)          // R$ por consulta
    const ganhos = dezena(p.valor * ticket)
    const gastos = dezena(ganhos * (0.24 + ruido(semente + 1) * 0.16))
    return { rotulo: p.rotulo, ganhos, gastos }
  })
}
