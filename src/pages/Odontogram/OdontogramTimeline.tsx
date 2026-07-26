import { marcosPorDia, rotuloDoMarco, type SnapshotBruto } from '@/utils/odontogramRevisions'
import styles from './OdontogramTimeline.module.scss'

/**
 * A RÉGUA DO HISTÓRICO — em que dia a boca que está na tela foi registrada.
 *
 * Fica na horizontal, no topo, porque ela governa a tela inteira: trocar de
 * marco recarrega o motor, e a coluna de Achados ao lado se refaz sozinha (ela
 * lê os tooltips do motor). Não é um filtro de um painel; é a data de tudo que
 * está sendo visto.
 *
 * O último marco é "Atual" — a ficha corrente, a única que se edita. Os
 * anteriores são snapshots imutáveis de procedimentos, e por isso abrem em
 * SOMENTE LEITURA (ver a trava em toothFields.ts).
 *
 * Sem histórico nenhum, o componente não renderiza nada: uma régua com um item
 * só ("Atual") não informa nem permite nada, e ocuparia a faixa mais nobre da
 * tela para dizer "hoje é hoje".
 */

interface OdontogramTimelineProps {
  revisoes: SnapshotBruto[]
  /** `null` = ficha corrente ("Atual"). */
  selecionado: string | null
  onSelecionar: (sessionId: string | null) => void
  /** Trava a régua enquanto um snapshot está sendo lido, para o clique repetido
   *  não empilhar cargas no motor. */
  carregando?: boolean
}

export function OdontogramTimeline({
  revisoes, selecionado, onSelecionar, carregando,
}: OdontogramTimelineProps) {
  const marcos = marcosPorDia(revisoes)
  if (marcos.length === 0) return null

  const hoje = new Date()

  return (
    <nav className={styles.regua} aria-label="Histórico da ficha">
      <ol className={styles.trilho}>
        {marcos.map(m => {
          const ativo = selecionado === m.sessionId
          const legenda = [
            m.description,
            m.registros > 1 ? `${m.registros} registros neste dia` : null,
          ].filter(Boolean).join(' · ')
          return (
            <li key={m.sessionId} className={styles.marco}>
              <button
                type="button"
                className={`${styles.botao} ${ativo ? styles.botaoAtivo : ''}`}
                aria-current={ativo ? 'true' : undefined}
                disabled={carregando}
                title={legenda || undefined}
                onClick={() => onSelecionar(m.sessionId)}
              >
                <span className={styles.ponto} aria-hidden="true" />
                <span className={styles.rotulo}>{rotuloDoMarco(m.date, hoje)}</span>
              </button>
            </li>
          )
        })}

        <li className={`${styles.marco} ${styles.marcoAtual}`}>
          <button
            type="button"
            className={`${styles.botao} ${selecionado === null ? styles.botaoAtivo : ''}`}
            aria-current={selecionado === null ? 'true' : undefined}
            disabled={carregando}
            title="Ficha corrente — a única que se edita"
            onClick={() => onSelecionar(null)}
          >
            <span className={styles.ponto} aria-hidden="true" />
            <span className={styles.rotulo}>Atual</span>
          </button>
        </li>
      </ol>
    </nav>
  )
}
