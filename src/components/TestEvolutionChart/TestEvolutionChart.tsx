import { useId } from 'react'
import { parseBrDate } from '@/utils/date'
import type { PatientTestResult, PhysioTest, PhysioTestLevel } from '@/types/domain'
import styles from './TestEvolutionChart.module.scss'

/** Um ponto já resolvido para o plano do gráfico. */
interface Point {
  /** 0–100 da esquerda para a direita, PROPORCIONAL À DATA (não à ordem). */
  x: number
  /** 0–100 de baixo para cima. */
  y: number
  /** O que o eixo Y mede nesta aplicação: o escore ou o nome do nível. */
  valueLabel: string
  /** Nome do nível — no eixo do escore o número sozinho não diz o significado
   *  clínico, então ele volta no tooltip. */
  levelName: string
  /** true = o valor foi ESTIMADO pela faixa do nível (aplicação registrada
   *  antes do campo de resultado). Nunca é apresentado como medição. */
  estimated: boolean
  dateLabel: string
}

interface TestEvolutionChartProps {
  test: PhysioTest
  /** Como vêm do service: MAIS RECENTE PRIMEIRO. O gráfico inverte. */
  results: PatientTestResult[]
}

/**
 * Valor representativo de uma faixa, para as aplicações ANTIGAS — as que só
 * têm nível, porque foram registradas antes do campo de resultado existir.
 * Sem isso, ligar o eixo numérico faria o histórico desaparecer justamente
 * quando o paciente ganha a primeira medição com escore.
 *
 * Meio da faixa quando fechada; o próprio limite quando ela é aberta de um
 * lado (não dá para inventar um "meio" de "≥ 30 segundos"). Faixa sem limite
 * nenhum é qualitativa e não tem posição numérica — devolve undefined.
 */
function bandValue(level: PhysioTestLevel | undefined): number | undefined {
  if (!level) return undefined
  const { minScore, maxScore } = level
  if (minScore != null && maxScore != null) return (minScore + maxScore) / 2
  return minScore ?? maxScore
}

/**
 * Evolução de UM teste ao longo do tempo — abaixo do histórico de resultados,
 * na aba Testes do perfil (fisioterapia).
 *
 * O eixo Y é o ESCORE medido (segundos, pontos, metros, graus) sempre que ele
 * existir — é o dado fino, e é nele que 14 s → 13,2 s aparece. Cai para a
 * POSIÇÃO do nível na escala (ordinal, com os nomes como marcas) quando algum
 * ponto do histórico não pode ser colocado no eixo numérico: melhor um gráfico
 * inteiro e grosso do que um gráfico fino com metade das aplicações faltando.
 *
 * ⚠️ NÃO existe "para cima é melhor". Em "Goniometria — Extensão de Joelho" a
 * escala vai de `0° (extensão completa)` a `> 15° (déficit importante)`: subir
 * é PIORAR. Por isso o gráfico não colore por melhora, não desenha seta de
 * tendência e não escreve "evoluiu" — quem lê o significado clínico é o
 * fisioterapeuta, pelo nome do nível. Uma linha só, cor neutra da marca.
 *
 * O eixo X é proporcional à DATA, não à ordem das aplicações: duas medições em
 * dias seguidos e uma terceira três meses depois têm de aparecer assim, senão
 * o gráfico inventa uma regularidade que não houve.
 */
export function TestEvolutionChart({ test, results }: TestEvolutionChartProps) {
  const gradientId = useId()
  const isGoniometry = test.kind === 'goniometry'

  // Ordem cronológica (o service entrega o mais recente primeiro). Cada
  // aplicação ganha as DUAS posições possíveis — a numérica e a ordinal —
  // porque qual delas o gráfico vai usar só se sabe depois de olhar o
  // histórico inteiro.
  const chronological = [...results].reverse()
  const plottable = chronological
    .map(r => {
      const levelIndex = test.levels.findIndex(l => l.name === r.levelName)
      // Aplicação antiga (sem escore) entra pelo meio da faixa do seu nível.
      const bandScore = r.score ?? (levelIndex >= 0 ? bandValue(test.levels[levelIndex]) : undefined)
      // Sem escore E com nível que sumiu do catálogo não há onde pôr o ponto.
      if (bandScore == null && levelIndex < 0) return null
      return {
        score: r.score,
        bandScore,
        levelIndex,
        levelName: r.levelName,
        date: parseBrDate(r.performedAt),
        dateLabel: r.performedAt,
      }
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)

  // Eixo numérico só quando TODO ponto cabe nele (senão o histórico perderia
  // aplicações) e há pelo menos um escore de verdade — um gráfico inteiro de
  // meios-de-faixa é o eixo ordinal disfarçado de número.
  const byScore = plottable.some(p => p.score != null) && plottable.every(p => p.bandScore != null)

  const measured = plottable
    // No eixo ordinal a posição é o índice do nível: quem perdeu o nível no
    // catálogo fica de fora (só sobrevive quando o eixo é numérico).
    .filter(p => byScore || p.levelIndex >= 0)
    .map(p => ({
      value: byScore ? p.bandScore! : p.levelIndex,
      estimated: byScore && p.score == null,
      levelName: p.levelName,
      date: p.date,
      dateLabel: p.dateLabel,
      valueLabel: byScore
        ? `${p.score == null ? '≈' : ''}${formatValue(p.bandScore!, isGoniometry)}`
        : p.levelName,
    }))

  // Uma medição só não é evolução — é um ponto. Dizer isso é mais útil do que
  // desenhar um gráfico de um dado.
  if (measured.length < 2) {
    return (
      <section className={styles.card} aria-label={`Evolução de ${test.name}`}>
        <h3 className={styles.title}>Evolução</h3>
        <p className={styles.vazio}>
          {measured.length === 0
            ? 'Nenhuma medição com valor comparável ainda.'
            : 'Registre uma segunda aplicação para ver a evolução.'}
        </p>
      </section>
    )
  }

  // Escala Y. No eixo do escore, a régua preferida é a do PRÓPRIO teste (Berg
  // vai de 0 a 56: andar 40→45 não pode varrer o gráfico inteiro). Quando o
  // catálogo é aberto numa das pontas — o caso da goniometria e de todo teste
  // com "< x" / "≥ y" —, não há régua fixa: aí usa a faixa dos dados com
  // folga, senão a variação some. Escala ordinal usa sempre a altura INTEIRA.
  const values = measured.map(p => p.value)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const catalogRange = byScore ? catalogScoreRange(test.levels) : null
  const padding = byScore ? Math.max(5, Math.round((rawMax - rawMin) * 0.2)) : 0
  // A folga não pode inventar escore negativo quando todas as medições são
  // positivas — mas medição negativa de verdade é respeitada (a goniometria
  // tem faixa "< 0°", hiperextensão).
  const paddedMin = rawMin >= 0 ? Math.max(0, rawMin - padding) : rawMin - padding
  const baseMin = catalogRange ? catalogRange.min : (byScore ? paddedMin : 0)
  const baseMax = catalogRange
    ? catalogRange.max
    : (byScore ? rawMax + padding : Math.max(1, test.levels.length - 1))
  // Régua do catálogo pode não cobrir o dado (Fugl-Meyer vai a 100 e a última
  // faixa semeada para em 99): o eixo cede, o ponto não sai do plano.
  const yMin = Math.min(baseMin, rawMin)
  const yMax = Math.max(baseMax, rawMax)
  const ySpan = yMax - yMin || 1

  // Escala X proporcional ao tempo. Todas as medições no mesmo dia caem no
  // mesmo x — aí distribui por ordem, senão viram um ponto só.
  const times = measured.map(p => p.date.getTime())
  const tMin = Math.min(...times)
  const tMax = Math.max(...times)
  const tSpan = tMax - tMin

  const points: Point[] = measured.map((p, i) => ({
    x: tSpan > 0
      ? ((p.date.getTime() - tMin) / tSpan) * 100
      : (i / (measured.length - 1)) * 100,
    y: ((p.value - yMin) / ySpan) * 100,
    valueLabel: p.valueLabel,
    levelName: p.levelName,
    estimated: p.estimated,
    dateLabel: p.dateLabel,
  }))

  const line = points.map(p => `${p.x},${100 - p.y}`).join(' ')
  const area = `${points[0].x},100 ${line} ${points[points.length - 1].x},100`

  // Marcas do eixo Y: no escore, teto/meio/base numéricos; na escala, o nome de
  // cada nível (é o rótulo que carrega o significado clínico).
  const yTicks = byScore
    ? [1, 0.5, 0].map(f => ({ at: f * 100, label: formatValue(round1(yMin + ySpan * f), isGoniometry) }))
    : test.levels.map((l, i) => ({ at: (i / (test.levels.length - 1 || 1)) * 100, label: l.name })).reverse()

  const first = points[0]
  const last = points[points.length - 1]
  const hasEstimated = points.some(p => p.estimated)

  return (
    <section className={styles.card} aria-label={`Evolução de ${test.name}`}>
      {/* Primeira e última medição vão no CABEÇALHO, não como rótulo colado ao
          ponto: ancorado no ponto, o rótulo da última medição transborda o
          card (o ponto fica em x=100%) e o da primeira colide com o próprio
          traço quando as medições iniciais são próximas no tempo. Aqui eles
          não competem com nada, e o valor de cada ponto continua no hover e
          nos cards de resultado acima. "de A a B" (e não "A → B") porque seta
          insinua progresso — e subir nem sempre é melhorar nesta escala. */}
      <header className={styles.header}>
        <h3 className={styles.title}>Evolução</h3>
        <p className={styles.subtitle}>
          {measured.length} medições · de {measured[0].valueLabel} a {measured[measured.length - 1].valueLabel}
        </p>
      </header>

      <div className={styles.plot}>
        <div className={styles.yAxis}>
          {/* Chave pela POSIÇÃO, não pelo rótulo: dois níveis podem ter o mesmo
              nome e duas marcas numéricas podem arredondar para o mesmo texto. */}
          {yTicks.map(t => (
            <span key={t.at} className={styles.yTick} style={{ bottom: `${t.at}%` }}>{t.label}</span>
          ))}
        </div>

        <div className={styles.canvas}>
          {yTicks.map(t => (
            <span key={t.at} className={styles.gridline} style={{ bottom: `${t.at}%` }} aria-hidden="true" />
          ))}

          {/* preserveAspectRatio="none" estica o viewBox 100x100 para o tamanho
              real do plot; por isso os traços usam vector-effect (senão o
              stroke esticaria junto e a linha sairia oval). */}
          <svg className={styles.svg} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" className={styles.areaTop} />
                <stop offset="100%" className={styles.areaBottom} />
              </linearGradient>
            </defs>
            <polygon points={area} fill={`url(#${gradientId})`} />
            <polyline points={line} className={styles.linha} vectorEffect="non-scaling-stroke" />
          </svg>

          {/* Marcadores fora do SVG: assim o anel de contorno e o alvo de hover
              não são deformados pelo preserveAspectRatio="none". */}
          {points.map((p, i) => (
            <button
              key={`${p.dateLabel}-${i}`}
              type="button"
              className={styles.ponto}
              style={{ left: `${p.x}%`, bottom: `${p.y}%` }}
              data-tooltip={pointTooltip(p, byScore)}
              aria-label={`${p.dateLabel}: ${pointTooltip(p, byScore)}`}
            />
          ))}

        </div>
      </div>

      <div className={styles.xAxis}>
        <span>{first.dateLabel}</span>
        <span>{last.dateLabel}</span>
      </div>

      {/* O "≈" precisa de legenda: sem ela, um ponto estimado pela faixa passa
          por medição — e aí o gráfico afirma uma precisão que não tem. */}
      {hasEstimated && (
        <p className={styles.nota}>
          ≈ posição estimada pela faixa do nível — aplicações registradas antes do campo de resultado.
        </p>
      )}
    </section>
  )
}

/** Grau só na goniometria: a unidade dos outros instrumentos varia (segundos,
 *  pontos, metros) e já vive no nome do teste. */
function formatValue(value: number, isGoniometry: boolean): string {
  return isGoniometry ? `${value}°` : String(value)
}

/** Uma casa decimal nas marcas do eixo — arredondar para inteiro colapsaria
 *  as três marcas de um teste que varia dentro de 1 unidade. */
const round1 = (value: number) => Math.round(value * 10) / 10

function pointTooltip(p: Point, byScore: boolean): string {
  // No eixo ordinal o rótulo JÁ é o nome do nível — repeti-lo seria ruído.
  const head = byScore ? `${p.valueLabel} · ${p.levelName}` : p.valueLabel
  return `${head} · ${p.dateLabel}`
}

/**
 * Régua fixa do teste: só existe quando o catálogo fecha os DOIS extremos
 * (Berg 0–56, Fugl-Meyer 0–99). Basta uma ponta aberta — "< 10 segundos",
 * "≥ 30 segundos", "> 15°" — para não haver teto ou piso publicado, e aí o
 * gráfico volta a se escalar pelos dados.
 */
function catalogScoreRange(levels: PhysioTestLevel[]): { min: number; max: number } | null {
  const bounded = levels.filter(l => l.minScore != null || l.maxScore != null)
  if (bounded.length === 0) return null
  if (bounded.some(l => l.minScore == null) || bounded.some(l => l.maxScore == null)) return null
  const min = Math.min(...bounded.map(l => l.minScore!))
  const max = Math.max(...bounded.map(l => l.maxScore!))
  return max > min ? { min, max } : null
}
