import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Select } from '@/components/Select/Select'
import { Spinner } from '@/components/Spinner/Spinner'
import { useToast } from '@/components/Toast/useToast'
import { IconCheck, IconCopy } from '@/components/icons'
import { useGoals, useSaveGoals } from '@/hooks/useGoals'
import { MONTHS_LONG, MONTHS_SHORT, GOAL_METRICS, GOAL_METRIC_LABEL, GOAL_METRIC_HELP, GOAL_METRIC_IS_MONEY } from '@/constants'
import { MONTHS_IN_YEAR } from '@/services/goalsService'
import type { GoalYearInput } from '@/services/goalsService'
import { formatAmount, parseBRL } from '@/utils/format'
import type { Goal, GoalMetric, MonthlyTargets } from '@/types/domain'
import styles from './GoalsTab.module.scss'

/** O que está nos campos: 12 textos por métrica ('' = mês sem meta). */
type Draft = Record<GoalMetric, string[]>

/** Anos oferecidos: o passado recente (para corrigir) e o planejamento à frente. */
const YEAR_OFFSETS = [-1, 0, 1, 2]

/** Texto que a célula mostra para um alvo gravado. '' quando o mês não tem meta. */
function targetToText(metric: GoalMetric, value: number | null): string {
  if (value == null) return ''
  // Dinheiro com 2 casas ('1.234,50'); contagem inteira — "300,5 consultas" não existe.
  return GOAL_METRIC_IS_MONEY[metric] ? formatAmount(value) : String(Math.round(value))
}

/** As 4 linhas da matriz a partir do que veio do banco (métrica ausente = ano em branco). */
function buildDraft(goals: Goal[]): Draft {
  const saved = new Map(goals.map(g => [g.metric, g.monthly]))
  const draft = {} as Draft
  for (const metric of GOAL_METRICS) {
    const monthly = saved.get(metric)
    draft[metric] = Array.from({ length: MONTHS_IN_YEAR },
      (_, month) => targetToText(metric, monthly?.[month] ?? null))
  }
  return draft
}

/** Chave de uma célula, para marcar quais campos estão inválidos. */
function cellKey(metric: GoalMetric, month: number) {
  return `${metric}:${month}`
}

/** Matriz vazia — referência estável, para o estado inicial não remontar a cada render. */
const EMPTY_DRAFT = buildDraft([])

/**
 * Aba "Metas": a matriz de metas MENSAIS de um ano — 4 métricas (linhas) × 12
 * meses (colunas), com um seletor de ano e UM botão Salvar.
 *
 * SALVAR É DA MATRIZ INTEIRA, e não por linha, porque a gravação inteira é uma
 * chamada só (`set_clinic_goals_year`) dentro de uma transação: ou o ano fica
 * gravado ou nada fica. Salvar por linha seriam quatro round-trips e, se o
 * terceiro falhasse, não haveria mensagem honesta a dar — "salvo" seria falso e
 * "erro" apagaria o que já tinha funcionado.
 *
 * NÃO HÁ BOTÃO DE EXCLUIR: apagar meta é limpar as células e salvar. A RPC
 * remove a linha da métrica cujos 12 meses vierem em branco, então a ausência
 * se escreve com o mesmo gesto do resto da tela — sem um segundo verbo, e sem
 * um diálogo de confirmação para algo que o próprio Salvar já expressa.
 */
export function GoalsTab() {
  const toast = useToast()
  const currentYear = new Date().getFullYear()

  const [year, setYear] = useState(currentYear)
  const { data: goals, isLoading } = useGoals(year)
  const { mutate: save, isPending: saving } = useSaveGoals()

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [invalid, setInvalid] = useState<Set<string>>(() => new Set())

  // (Re)monta a matriz quando troca o ano OU chegam os dados do servidor —
  // ajustando o estado DURANTE o render ao detectar a mudança, em vez de num
  // useEffect (que renderizaria uma vez com a matriz do ano anterior).
  //
  // Um refetch que não mudou nada NÃO apaga o que está sendo digitado: o
  // structural sharing do TanStack Query devolve a MESMA referência quando o
  // dado é igual, então a comparação abaixo nem dispara.
  const [syncedFrom, setSyncedFrom] = useState<Goal[] | undefined>(undefined)
  if (goals !== syncedFrom) {
    setSyncedFrom(goals)
    setDraft(buildDraft(goals ?? []))
    setInvalid(new Set())
  }

  const yearOptions = YEAR_OFFSETS.map(offset => ({
    value: String(currentYear + offset),
    label: String(currentYear + offset),
  }))

  function handleChange(metric: GoalMetric, month: number, text: string) {
    setDraft(current => ({
      ...current,
      [metric]: current[metric].map((value, i) => (i === month ? text : value)),
    }))
    // O campo deixa de estar marcado assim que é reeditado: manter a marca
    // vermelha enquanto o usuário corrige é ruído sobre o que ele já está vendo.
    setInvalid(current => {
      if (!current.has(cellKey(metric, month))) return current
      const next = new Set(current)
      next.delete(cellKey(metric, month))
      return next
    })
  }

  /**
   * Copia a COLUNA inteira do mês `source` para os outros 11 meses — ou seja,
   * as quatro métricas de uma vez, e não só a linha em que se clicou.
   *
   * É a leitura que o lugar do botão impõe: ele mora no CABEÇALHO do mês, que é
   * o título da coluna, então o gesto é sobre a coluna. Por isso o rótulo diz
   * "todas as metas de <mês>" — sem isso, quem clicasse esperando mexer só numa
   * linha veria as outras três mudarem sem aviso.
   *
   * Métrica com o mês de origem EM BRANCO limpa o ano todo dela, e isso é
   * coerente e não um efeito colateral: branco é "mês sem meta", e copiar
   * "sem meta" para os outros 11 é o que a frase diz. Como o Salvar é explícito
   * e a matriz continua editável, nada disso chega ao banco sem uma segunda
   * ação do usuário.
   */
  function replicateMonth(source: number) {
    setDraft(current => {
      const next = {} as Draft
      for (const metric of GOAL_METRICS) {
        next[metric] = current[metric].map(() => current[metric][source])
      }
      return next
    })
    setInvalid(new Set())
    toast.info(`Metas de ${MONTHS_LONG[source]} copiadas para os outros 11 meses.`)
  }

  function handleSave() {
    const rows: GoalYearInput[] = []
    const bad = new Set<string>()

    for (const metric of GOAL_METRICS) {
      const isMoney = GOAL_METRIC_IS_MONEY[metric]
      const monthly: MonthlyTargets = draft[metric].map((text, month) => {
        const trimmed = text.trim()
        if (!trimmed) return null // campo vazio = mês SEM meta, não zero

        // parseBRL tolera 'R$ 50.000,00', '50.000,00' e '50000' — o mesmo parser
        // das outras telas de dinheiro, para não haver duas regras de vírgula.
        const parsed = isMoney ? parseBRL(trimmed) : Number(trimmed.replace(',', '.'))
        if (!Number.isFinite(parsed) || parsed < 0) {
          // Espelha `clinic_goal_monthly_non_negative_ck`. ZERO PASSA de
          // propósito: "não gastar nada em janeiro" é uma meta que a clínica
          // pode ter escolhido, e é diferente de não ter meta (null).
          bad.add(cellKey(metric, month))
          return null
        }
        return isMoney ? parsed : Math.round(parsed)
      })
      // As 4 métricas vão SEMPRE, mesmo intocadas: é assim que limpar os campos
      // de uma métrica e salvar apaga a linha dela no banco.
      rows.push({ metric, monthly })
    }

    setInvalid(bad)
    if (bad.size > 0) {
      toast.error(`Revise ${bad.size === 1 ? 'o campo destacado' : `os ${bad.size} campos destacados`}: use números iguais ou maiores que zero.`)
      return
    }

    save({ year, rows }, {
      onSuccess: () => toast.success(`Metas de ${year} salvas!`),
      onError: () => toast.error('Não foi possível salvar as metas.'),
    })
  }

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>Metas da clínica</h2>
          <p className={styles.subtitle}>
            O alvo de cada número do dashboard, mês a mês. Mês em branco é mês
            sem meta — o cartão mostra “Meta: não definida”.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Select
            className={styles.yearSelect}
            options={yearOptions}
            value={String(year)}
            onChange={e => setYear(Number(e.target.value))}
            aria-label="Ano das metas"
          />
          <Button
            iconLeft={<IconCheck />}
            loading={saving}
            disabled={isLoading}
            onClick={handleSave}
          >
            Salvar metas
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className={styles.loading}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div className={styles.scroll}>
          <table className={styles.matrix}>
            <thead>
              <tr>
                <th className={styles.metricCol} scope="col">Métrica</th>
                {MONTHS_SHORT.map((month, i) => (
                  <th key={month} className={styles.monthCol} scope="col">
                    <span className={styles.monthHead}>
                      {month}
                      <button
                        type="button"
                        className={styles.replicate}
                        title={`Copiar todas as metas de ${MONTHS_LONG[i]} para os outros 11 meses`}
                        aria-label={`Copiar todas as metas de ${MONTHS_LONG[i]} para os outros 11 meses`}
                        onClick={() => replicateMonth(i)}
                      >
                        <IconCopy />
                      </button>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {GOAL_METRICS.map(metric => {
                const isMoney = GOAL_METRIC_IS_MONEY[metric]
                return (
                  <tr key={metric}>
                    <th className={styles.metricCol} scope="row">
                      <span className={styles.metricName}>
                        {GOAL_METRIC_LABEL[metric]}
                        <span className={styles.unit}>{isMoney ? 'R$' : 'qtd'}</span>
                      </span>
                      <span className={styles.metricHelp}>{GOAL_METRIC_HELP[metric]}</span>
                    </th>

                    {draft[metric].map((text, month) => {
                      const isInvalid = invalid.has(cellKey(metric, month))
                      return (
                        <td key={month} className={styles.monthCol}>
                          <Input
                            size="sm"
                            className={isInvalid ? styles['cell--invalid'] : undefined}
                            inputMode="decimal"
                            placeholder={isMoney ? '0,00' : '0'}
                            value={text}
                            aria-invalid={isInvalid}
                            aria-label={`Meta de ${GOAL_METRIC_LABEL[metric]} em ${MONTHS_LONG[month]} de ${year}`}
                            onChange={e => handleChange(metric, month, e.target.value)}
                          />
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
