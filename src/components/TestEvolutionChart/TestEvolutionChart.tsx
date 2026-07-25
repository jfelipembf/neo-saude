import { useId } from 'react'
import { parseBrDate } from '@/utils/date'
import type { PatientTestResult, PhysioTest } from '@/types/domain'
import styles from './TestEvolutionChart.module.scss'

/** Um ponto já resolvido para o plano do gráfico. */
interface Point {
  /** 0–100 da esquerda para a direita, PROPORCIONAL À DATA (não à ordem). */
  x: number
  /** 0–100 de baixo para cima. */
  y: number
  /** O que o eixo Y mede nesta aplicação: graus ou o nome do nível. */
  valueLabel: string
  dateLabel: string
}

interface TestEvolutionChartProps {
  test: PhysioTest
  /** Como vêm do service: MAIS RECENTE PRIMEIRO. O gráfico inverte. */
  results: PatientTestResult[]
}

/**
 * Evolução de UM teste ao longo do tempo — abaixo do histórico de resultados,
 * na aba Testes do perfil (fisioterapia).
 *
 * O que vai no eixo Y depende do tipo do teste:
 *   · goniometry — o ângulo medido (número, contínuo);
 *   · scale      — a POSIÇÃO do nível na escala do teste (ordinal), com os
 *                  nomes dos níveis como marcas do eixo.
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

  // Ordem cronológica (o service entrega o mais recente primeiro) e só o que
  // tem valor plotável: goniometria sem ângulo, ou nível fora da escala atual,
  // não viram ponto.
  const chronological = [...results].reverse()
  const measured = chronological
    .map(r => {
      const levelIndex = test.levels.findIndex(l => l.name === r.levelName)
      const value = isGoniometry ? r.measuredAngle : (levelIndex >= 0 ? levelIndex : undefined)
      if (value == null) return null
      return {
        value,
        date: parseBrDate(r.performedAt),
        dateLabel: r.performedAt,
        valueLabel: isGoniometry ? `${r.measuredAngle}°` : r.levelName,
      }
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)

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

  // Escala Y. Goniometria: faixa dos próprios dados com folga, para a variação
  // aparecer (ancorar em 0 achataria 130°→135° numa reta). Escala: sempre a
  // altura INTEIRA do teste, senão o paciente parece ter percorrido toda a
  // escala quando andou um nível.
  const values = measured.map(p => p.value)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const padding = isGoniometry ? Math.max(5, Math.round((rawMax - rawMin) * 0.2)) : 0
  const yMin = isGoniometry ? Math.max(0, rawMin - padding) : 0
  const yMax = isGoniometry ? rawMax + padding : Math.max(1, test.levels.length - 1)
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
    dateLabel: p.dateLabel,
  }))

  const line = points.map(p => `${p.x},${100 - p.y}`).join(' ')
  const area = `${points[0].x},100 ${line} ${points[points.length - 1].x},100`

  // Marcas do eixo Y: nos graus, teto/meio/base numéricos; na escala, o nome de
  // cada nível (é o rótulo que carrega o significado clínico).
  const yTicks = isGoniometry
    ? [1, 0.5, 0].map(f => ({ at: f * 100, label: `${Math.round(yMin + ySpan * f)}°` }))
    : test.levels.map((l, i) => ({ at: (i / (test.levels.length - 1 || 1)) * 100, label: l.name })).reverse()

  const first = points[0]
  const last = points[points.length - 1]

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
          {yTicks.map(t => (
            <span key={t.label} className={styles.yTick} style={{ bottom: `${t.at}%` }}>{t.label}</span>
          ))}
        </div>

        <div className={styles.canvas}>
          {yTicks.map(t => (
            <span key={t.label} className={styles.gridline} style={{ bottom: `${t.at}%` }} aria-hidden="true" />
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
              data-tooltip={`${p.valueLabel} · ${p.dateLabel}`}
              aria-label={`${p.dateLabel}: ${p.valueLabel}`}
            />
          ))}

        </div>
      </div>

      <div className={styles.xAxis}>
        <span>{first.dateLabel}</span>
        <span>{last.dateLabel}</span>
      </div>
    </section>
  )
}
