import type { PeriodoGrafico, PontoSerie } from '@/types/domain'

// ─────────────────────────────────────────────────────────────────────────────
// Série de demonstração do gráfico de consultas. Gerada de forma DETERMINÍSTICA
// a partir do mês de referência: o mesmo mês mostra sempre os mesmos valores,
// e meses diferentes mostram curvas diferentes (dá vida ao seletor de mês).
// ─────────────────────────────────────────────────────────────────────────────

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// Perfil-base de consultas por dia da semana (Dom..Sáb).
const BASE_DIA = [2, 8, 12, 10, 14, 11, 6]

/** Pseudo-aleatório determinístico em [0, 1) a partir de uma semente. */
export function ruido(semente: number) {
  const x = Math.sin(semente) * 10000
  return x - Math.floor(x)
}

/** 'aaaa-mm' → { ano, mes } (mes 0-based, como no Date). */
export function parseMesIso(mesIso: string) {
  const [ano, mes] = mesIso.split('-').map(Number)
  return { ano, mes: mes - 1 }
}

/** Semana (Seg→Dom) que contém o dia de referência: hoje no mês atual, dia 1 nos demais. */
function gerarSemana(mesIso: string): PontoSerie[] {
  const { ano, mes } = parseMesIso(mesIso)
  const hoje = new Date()
  const ref = ano === hoje.getFullYear() && mes === hoje.getMonth()
    ? hoje
    : new Date(ano, mes, 1)

  const segunda = new Date(ref)
  segunda.setDate(ref.getDate() - ((ref.getDay() + 6) % 7))

  return Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(segunda)
    dia.setDate(segunda.getDate() + i)
    const base = BASE_DIA[dia.getDay()]
    const variacao = Math.round(ruido(ano * 10000 + mes * 100 + dia.getDate()) * 6 - 3)
    return {
      rotulo: `${DIAS_SEMANA[dia.getDay()]} ${dia.getDate()}`,
      valor: Math.max(0, base + variacao),
    }
  })
}

function gerarMes(mesIso: string): PontoSerie[] {
  const { ano, mes } = parseMesIso(mesIso)
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const semanas = Math.ceil(diasNoMes / 7)

  return Array.from({ length: semanas }, (_, i) => ({
    rotulo: `Sem ${i + 1}`,
    valor: Math.round(48 + ruido(ano * 100 + mes * 10 + i) * 24 - 12),
  }))
}

function gerarAno(mesIso: string): PontoSerie[] {
  const { ano } = parseMesIso(mesIso)
  return MESES.map((rotulo, i) => ({
    rotulo,
    valor: Math.round(205 + ruido(ano * 12 + i) * 70 - 35),
  }))
}

export function gerarSerieConsultas(periodo: PeriodoGrafico, mesIso: string): PontoSerie[] {
  if (periodo === 'semana') return gerarSemana(mesIso)
  if (periodo === 'mes') return gerarMes(mesIso)
  return gerarAno(mesIso)
}
