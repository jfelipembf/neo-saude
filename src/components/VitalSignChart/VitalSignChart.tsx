import type { CSSProperties, ReactNode } from 'react'
import styles from './VitalSignChart.module.scss'

export interface VitalPoint {
  /** Rótulo do eixo X (dd/mm). */
  rotulo: string
  valor: number
}

export interface VitalSeries {
  nome: string
  pontos: VitalPoint[]
  /** Segunda série usa o traço secundário (ex.: diastólica sob a sistólica). */
  secundaria?: boolean
}

interface VitalSignChartProps {
  titulo: string
  unidade: string
  icone?: ReactNode
  series: VitalSeries[]
  /** Faixa de referência — vira a banda clara ao fundo. */
  faixaNormal?: { min: number; max: number }
  /** Casas decimais no rótulo (temperatura usa 1). */
  casas?: number
}

/** Escala Y: o menor intervalo que contém os dados E a faixa normal. */
function escala(series: VitalSeries[], faixa?: { min: number; max: number }) {
  const valores = series.flatMap(s => s.pontos.map(p => p.valor))
  if (valores.length === 0) return null

  let min = Math.min(...valores)
  let max = Math.max(...valores)

  // A faixa normal entra na escala mesmo que nenhum ponto a alcance: sem isso,
  // uma série inteira acima do normal apareceria centrada no gráfico, como se
  // estivesse em ordem.
  if (faixa) {
    min = Math.min(min, faixa.min)
    max = Math.max(max, faixa.max)
  }

  // Respiro de 8% em cima e embaixo — ponto colado na borda some.
  const span = max - min || Math.abs(max) || 1
  return { min: min - span * 0.08, max: max + span * 0.08 }
}

/**
 * GRÁFICO DE UM SINAL VITAL — série no tempo com faixa de referência ao fundo.
 *
 * A faixa é o que transforma o gráfico em leitura clínica: 128 bpm só quer
 * dizer alguma coisa contra os 60–100 esperados. Sem ela, o traço mostra
 * variação e esconde anormalidade — a linha pode estar plana e inteira fora do
 * normal.
 *
 * Ponto fora da faixa ganha cor E anel maior, nunca só cor: quem não distingue
 * vermelho de roxo precisa ver a diferença do mesmo jeito. O `title` de cada
 * ponto repete o valor por extenso, que é o que sobra na impressão.
 *
 * Geometria por CSS var (`--x`/`--y`), nunca propriedade crua no JSX: o estilo
 * mora no `.module.scss` e o componente só passa o dado.
 */
export function VitalSignChart({
  titulo, unidade, icone, series, faixaNormal, casas = 0,
}: VitalSignChartProps) {
  const eixo = escala(series, faixaNormal)
  const comDados = series.filter(s => s.pontos.length > 0)

  if (!eixo || comDados.length === 0) {
    return (
      <figure className={styles.cartao}>
        <figcaption className={styles.cabecalho}>
          {icone && <span className={styles.icone}>{icone}</span>}
          <span className={styles.titulo}>{titulo}</span>
        </figcaption>
        <p className={styles.vazio}>Sem medições registradas.</p>
      </figure>
    )
  }

  const alturaPct = (v: number) => ((v - eixo.min) / (eixo.max - eixo.min)) * 100
  // Um ponto só fica no meio; com dois ou mais, distribui de ponta a ponta.
  const posX = (i: number, total: number) => (total <= 1 ? 50 : (i / (total - 1)) * 100)

  const referencia = faixaNormal && {
    baixo: alturaPct(faixaNormal.min),
    alto: alturaPct(faixaNormal.max),
  }

  const principal = comDados[0]
  const ultimo = principal.pontos[principal.pontos.length - 1]
  const foraDaFaixa = (v: number) =>
    Boolean(faixaNormal && (v < faixaNormal.min || v > faixaNormal.max))

  return (
    <figure className={styles.cartao}>
      <figcaption className={styles.cabecalho}>
        {icone && <span className={styles.icone}>{icone}</span>}
        <span className={styles.titulo}>{titulo}</span>
        <span className={`${styles.ultimo} ${foraDaFaixa(ultimo.valor) ? styles.ultimoAlerta : ''}`}>
          {comDados.map(s => s.pontos[s.pontos.length - 1].valor.toFixed(casas)).join('/')}
          <small>{unidade}</small>
        </span>
      </figcaption>

      <div className={styles.plot}>
        {referencia && (
          <span
            className={styles.faixa}
            style={{
              '--faixa-base': `${referencia.baixo}%`,
              '--faixa-altura': `${referencia.alto - referencia.baixo}%`,
            } as CSSProperties}
            aria-hidden="true"
          />
        )}

        {/* preserveAspectRatio="none" estica o viewBox 100×100 até o tamanho
            real; por isso o traço usa vector-effect, senão engrossaria junto. */}
        <svg className={styles.svg} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {comDados.map(s => (
            <polyline
              key={s.nome}
              className={s.secundaria ? styles.linhaSecundaria : styles.linha}
              vectorEffect="non-scaling-stroke"
              points={s.pontos
                .map((p, i) => `${posX(i, s.pontos.length)},${100 - alturaPct(p.valor)}`)
                .join(' ')}
            />
          ))}
        </svg>

        {/* Marcadores fora do SVG: dentro dele o preserveAspectRatio="none"
            deformaria o círculo em elipse. */}
        {comDados.map(s => s.pontos.map((p, i) => (
          <span
            key={`${s.nome}-${p.rotulo}-${i}`}
            className={[
              styles.ponto,
              s.secundaria ? styles.pontoSecundario : '',
              foraDaFaixa(p.valor) ? styles.pontoAlerta : '',
            ].filter(Boolean).join(' ')}
            style={{
              '--x': `${posX(i, s.pontos.length)}%`,
              '--y': `${alturaPct(p.valor)}%`,
            } as CSSProperties}
            title={`${s.nome}: ${p.valor.toFixed(casas)} ${unidade} — ${p.rotulo}`}
          />
        )))}
      </div>

      <div className={styles.eixoX}>
        <span>{principal.pontos[0].rotulo}</span>
        {principal.pontos.length > 1 && <span>{ultimo.rotulo}</span>}
      </div>
    </figure>
  )
}
