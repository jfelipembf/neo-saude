import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Input } from '@/components/Input/Input'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { useToast } from '@/components/Toast/useToast'
import { IconStar, IconTrash } from '@/components/icons'
import { useGoals, useRemoveGoal, useSaveGoal } from '@/hooks/useGoals'
import { useDashboardStats } from '@/hooks/useAppointments'
import {
  GOAL_METRICS, GOAL_METRIC_LABEL, GOAL_METRIC_HELP, GOAL_METRIC_IS_MONEY,
} from '@/constants'
import { formatBRL, parseBRL } from '@/utils/format'
import { goalProgress } from '@/utils/metrics'
import type { GoalMetric } from '@/types/domain'
import styles from './GoalsTab.module.scss'

/** Texto que o campo mostra para um alvo já gravado. */
function targetToText(metric: GoalMetric, value: number) {
  return GOAL_METRIC_IS_MONEY[metric] ? formatBRL(value) : String(Math.round(value))
}

/**
 * Aba "Metas": o alvo da clínica para cada uma das quatro métricas do
 * dashboard. A meta é um VALOR FIXO por métrica ("faturar R$ 50.000 por mês"),
 * sem competência mensal — é a mesma linha comparada contra o mês corrente
 * indefinidamente.
 *
 * SALVAR É POR LINHA, e não um botão geral no rodapé. Cada métrica é uma linha
 * independente no banco (`unique (clinic_id, metric)`) e a gravação é o upsert
 * de UMA linha. Um "salvar tudo" precisaria disparar até quatro mutações
 * independentes e, se a terceira falhasse, não existiria mensagem honesta para
 * dar: "salvo" seria falso e "erro" apagaria as duas que funcionaram. Por linha,
 * cada resultado é o de uma operação só. Some-se a isso que APAGAR uma meta já é
 * inerentemente por linha — misturar remoção por linha com salvamento geral
 * deixaria a tela com duas gramáticas diferentes.
 */
export function GoalsTab() {
  const toast = useToast()
  const { data: goals, isLoading } = useGoals()
  // Os valores ATUAIS do mês vêm da mesma RPC que alimenta o dashboard: a tela
  // que define a meta mostra o número que a meta persegue, lado a lado.
  const { data: stats } = useDashboardStats()
  const { mutate: save, isPending: saving } = useSaveGoal()
  const { mutate: remove, isPending: removing } = useRemoveGoal()

  // Só o que o usuário DIGITOU. O que não foi tocado cai no valor gravado — sem
  // useEffect de sincronia, que é onde nasce campo mostrando dado velho depois
  // de um refetch.
  const [draft, setDraft] = useState<Partial<Record<GoalMetric, string>>>({})
  const [errors, setErrors] = useState<Partial<Record<GoalMetric, string>>>({})
  const [confirming, setConfirming] = useState<GoalMetric | null>(null)

  if (isLoading) return <PageLoader />

  const saved = new Map((goals ?? []).map(g => [g.metric, g]))
  const busy = saving || removing

  function textFor(metric: GoalMetric) {
    const typed = draft[metric]
    if (typed !== undefined) return typed
    const goal = saved.get(metric)
    return goal ? targetToText(metric, goal.targetValue) : ''
  }

  function handleChange(metric: GoalMetric, text: string) {
    setDraft(current => ({ ...current, [metric]: text }))
    setErrors(current => ({ ...current, [metric]: '' }))
  }

  function handleSave(metric: GoalMetric) {
    const text = textFor(metric).trim()
    if (!text) {
      setErrors(c => ({ ...c, [metric]: 'Informe o valor da meta.' }))
      return
    }
    // parseBRL tolera "R$ 50.000,00", "50.000,00" e "50000" — o mesmo parser das
    // outras telas de dinheiro, para não haver duas regras de vírgula no app.
    const parsed = GOAL_METRIC_IS_MONEY[metric] ? parseBRL(text) : Number(text.replace(',', '.'))
    if (!Number.isFinite(parsed) || parsed <= 0) {
      // Espelha o CHECK do banco (`target_value > 0`): meta zerada não é meta, é
      // ausência de meta — e ausência de meta se representa APAGANDO a linha.
      setErrors(c => ({ ...c, [metric]: 'Use um valor maior que zero. Para tirar a meta, use o botão de excluir.' }))
      return
    }
    // Métrica de contagem é inteira: "300,5 consultas" não existe.
    const targetValue = GOAL_METRIC_IS_MONEY[metric] ? parsed : Math.round(parsed)

    save({ metric, targetValue }, {
      onSuccess: () => {
        // Solta o rascunho: o campo volta a espelhar o que foi gravado (e o
        // usuário vê o arredondamento, se houve).
        setDraft(c => ({ ...c, [metric]: undefined }))
        toast.success(`Meta de ${GOAL_METRIC_LABEL[metric].toLowerCase()} salva!`)
      },
      onError: () => toast.error('Não foi possível salvar a meta.'),
    })
  }

  function handleRemove(metric: GoalMetric) {
    remove(metric, {
      onSuccess: () => {
        setDraft(c => ({ ...c, [metric]: undefined }))
        setErrors(c => ({ ...c, [metric]: '' }))
        toast.success('Meta removida.')
      },
      onError: () => toast.error('Não foi possível remover a meta.'),
    })
  }

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>Metas da clínica</h2>
        <p className={styles.subtitle}>
          O alvo de cada número do dashboard. A meta vale para todo mês — não é
          preciso recadastrar a cada competência.
        </p>
      </header>

      {saved.size === 0 && (
        <EmptyState
          icon={<IconStar />}
          title="Nenhuma meta definida"
          description="Preencha o alvo de qualquer métrica abaixo e salve. Enquanto não houver meta, o cartão do dashboard mostra o número do mês e o aviso “Meta: não definida”."
        />
      )}

      <ul className={styles.list}>
        {GOAL_METRICS.map(metric => {
          const goal = saved.get(metric)
          const current = stats?.metrics[metric].current
          const isMoney = GOAL_METRIC_IS_MONEY[metric]
          const progress = current != null ? goalProgress(current, goal?.targetValue ?? null) : null

          return (
            <li key={metric} className={styles.row}>
              <div className={styles.info}>
                <span className={styles.metric}>{GOAL_METRIC_LABEL[metric]}</span>
                <span className={styles.help}>{GOAL_METRIC_HELP[metric]}</span>
              </div>

              <div className={styles.current}>
                <span className={styles.currentLabel}>Atual</span>
                <span className={styles.currentValue}>
                  {current == null ? '—' : isMoney ? formatBRL(current) : current}
                </span>
                {progress != null && <span className={styles.currentPct}>{progress}% da meta</span>}
              </div>

              <Input
                size="sm"
                className={styles.field}
                label="Meta"
                inputMode="decimal"
                placeholder={isMoney ? 'R$ 0,00' : '0'}
                value={textFor(metric)}
                error={errors[metric]}
                onChange={e => handleChange(metric, e.target.value)}
                aria-label={`Meta de ${GOAL_METRIC_LABEL[metric]}`}
              />

              <div className={styles.actions}>
                <Button size="sm" onClick={() => handleSave(metric)} disabled={busy}>
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  iconLeft={<IconTrash />}
                  title="Excluir meta"
                  aria-label={`Excluir meta de ${GOAL_METRIC_LABEL[metric]}`}
                  // Sem meta gravada não há o que excluir.
                  disabled={!goal || busy}
                  onClick={() => setConfirming(metric)}
                />
              </div>
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        onConfirm={() => confirming && handleRemove(confirming)}
        variant="danger"
        title="Excluir meta"
        message={
          confirming
            ? `A meta de ${GOAL_METRIC_LABEL[confirming].toLowerCase()} deixa de existir e o cartão do dashboard volta a mostrar “Meta: não definida”.`
            : undefined
        }
        confirmLabel="Excluir"
      />
    </section>
  )
}
