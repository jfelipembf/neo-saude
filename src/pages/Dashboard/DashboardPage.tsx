import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Calendar } from '@/components/Calendar/Calendar'
import { toIsoDate } from '@/utils/date'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { BillingCard } from '@/components/BillingCard/BillingCard'
import { TasksCard } from '@/components/TasksCard/TasksCard'
import { AppointmentsChart } from '@/components/AppointmentsChart/AppointmentsChart'
import { FinanceChart } from '@/components/FinanceChart/FinanceChart'
import { StatsCard } from '@/components/StatsCard/StatsCard'
import { LeadsKanban } from '@/components/LeadsKanban/LeadsKanban'
import { useDashboardStats, useDayAppointments, useSetAppointmentStatus } from '@/hooks/useAppointments'
import { usePatientName } from '@/hooks/useDisplayNames'
import {
  IconDashboard, IconClock, IconCheck, IconX,
  IconSchedule, IconPatients, IconTrendUp, IconTrendDown, IconKanban,
} from '@/components/icons'
import {
  APP_ROUTES, GOAL_METRIC_LABEL, GOAL_METRIC_IS_MONEY, GOAL_METRIC_HIGHER_IS_BETTER,
} from '@/constants'
import { formatBRL, formatPercent } from '@/utils/format'
import { goalProgress, percentChange } from '@/utils/metrics'
import type { Appointment, GoalMetric } from '@/types/domain'
import styles from './DashboardPage.module.scss'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: appointments, isLoading } = useDayAppointments()
  // Query própria: os cartões não seguram a agenda no loader (e vice-versa).
  // Enquanto não chega, cada cartão mostra '—' em vez de um zero que seria lido
  // como "a clínica não tem nenhum paciente".
  const { data: stats } = useDashboardStats()
  const patientName = usePatientName()
  const { mutate: setStatus } = useSetAppointmentStatus()
  const [view, setView] = useState<'dashboard' | 'kanban'>('dashboard')

  const today = new Date()
  const todayIso = toIsoDate(today)
  const todayLabel = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  const todaysPatients = appointments ?? []
  const isKanban = view === 'kanban'

  /**
   * Monta um cartão de métrica a partir de `metrics` da RPC.
   *
   * O hint é CALCULADO aqui, e só existe quando `percentChange` devolve número:
   * sem mês anterior (active_patients) ou com mês anterior zerado (clínica no
   * primeiro mês), o cartão sai sem hint em vez de sair com uma variação
   * inventada. O TOM segue `GOAL_METRIC_HIGHER_IS_BETTER` e não o sinal: gasto
   * subindo é vermelho, gasto caindo é verde.
   */
  function metricCard(metric: GoalMetric, icon: ReactNode) {
    const m = stats?.metrics[metric]
    const isMoney = GOAL_METRIC_IS_MONEY[metric]
    const format = (n: number) => (isMoney ? formatBRL(n) : String(n))

    const change = m ? percentChange(m.current, m.previous) : null
    // Variação exatamente zero fica NEUTRA: não é boa nem ruim, e pintá-la de
    // verde ou vermelho daria peso a um mês que não se mexeu.
    const isGood = change == null || change === 0
      ? null
      : (change > 0) === GOAL_METRIC_HIGHER_IS_BETTER[metric]

    return {
      label: GOAL_METRIC_LABEL[metric],
      value: m ? format(m.current) : '—',
      icon,
      // `null` (e não `undefined`) enquanto carrega e quando não há meta: o
      // cartão ACOMPANHA meta, então o bloco fica no lugar — o que muda é o
      // rótulo, não a altura do cartão.
      meta: m?.target != null ? format(m.target) : null,
      progress: m ? (goalProgress(m.current, m.target) ?? undefined) : undefined,
      hint: change == null
        ? undefined
        : `${change > 0 ? '+' : ''}${formatPercent(Math.round(change * 10) / 10)} vs. mês anterior`,
      trend: isGood == null ? ('neutral' as const) : isGood ? ('up' as const) : ('down' as const),
    }
  }

  // Clicar no círculo já ativo desfaz a marcação (volta para "agendada").
  function markAttendance(c: Appointment, attended: boolean) {
    const target = attended ? 'completed' : 'no_show'
    setStatus({ id: c.id, status: c.status === target ? 'scheduled' : target })
  }

  return (
    <>
      <PageHeader
        title={isKanban ? 'Kanban' : 'Dashboard'}
        icon={isKanban ? <IconKanban /> : <IconDashboard />}
        actions={
          <Button
            variant="ghost"
            size="sm"
            iconLeft={isKanban ? <IconDashboard /> : <IconKanban />}
            onClick={() => setView(isKanban ? 'dashboard' : 'kanban')}
            title={isKanban ? 'Ver dashboard' : 'Ver kanban'}
            aria-label={isKanban ? 'Alternar para o dashboard' : 'Alternar para o kanban'}
          />
        }
      />

      {/* O cabeçalho fica sempre no lugar; só o conteúdo troca pelo loader. */}
      {isLoading ? (
        <PageLoader />
      ) : isKanban ? (
        // Funil de contatos: Novos contatos → Agendamento → Converteu / Perdeu.
        <LeadsKanban />
      ) : (
        <div className={styles.grid}>
          <div className={styles.colEsquerda}>
            <section className={styles.agendaCard}>
              <header className={styles.agendaHeader}>
                <div>
                  <h2 className={styles.agendaTitle}>Agenda do dia</h2>
                  <p className={styles.agendaDate}>{todayLabel}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate(APP_ROUTES.SCHEDULE)}>
                  Ver agenda
                </Button>
              </header>

              <Calendar markedDates={[todayIso]} />

              <h3 className={styles.listTitle}>Pacientes de hoje</h3>
              <ul className={styles.list}>
                {todaysPatients.length === 0 && (
                  <li className={styles.emptyItem}>Nenhum paciente agendado para hoje.</li>
                )}
                {todaysPatients.map(c => (
                  <li key={c.id} className={styles.item}>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemPaciente}>{patientName(c.patientId)}</span>
                      <span className={styles.itemLine}><IconClock /> {c.time} · {c.service}</span>
                      <Badge status={c.status} className={styles.itemBadge} />
                    </div>

                    <div className={styles.presence}>
                      <button
                        type="button"
                        className={`${styles.circleBtn} ${styles['circleBtn--ok']} ${c.status === 'completed' ? styles['circleBtn--active'] : ''}`}
                        onClick={() => markAttendance(c, true)}
                        title="Compareceu"
                        aria-label={`Marcar que ${patientName(c.patientId)} compareceu`}
                      >
                        <IconCheck />
                      </button>
                      <button
                        type="button"
                        className={`${styles.circleBtn} ${styles['circleBtn--no']} ${c.status === 'no_show' ? styles['circleBtn--active'] : ''}`}
                        onClick={() => markAttendance(c, false)}
                        title="Não compareceu"
                        aria-label={`Marcar que ${patientName(c.patientId)} não compareceu`}
                      >
                        <IconX />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className={styles.widgets}>
            {/* Todos os números vêm da RPC dashboard_stats (um round-trip só).
                As duas primeiras linhas são operacionais (o dia de hoje) e não
                acompanham meta — não existe métrica de meta para "hoje". As
                quatro seguintes são as métricas de `metrics`, cada uma com meta
                e com a variação sobre o mês anterior CALCULADA aqui. */}
            <div className={styles.statsGrid}>
              <StatsCard label="Consultas hoje" value={stats?.appointmentsToday ?? '—'}     icon={<IconSchedule />} />
              <StatsCard label="A confirmar"    value={stats?.pendingConfirmations ?? '—'}  icon={<IconClock />} />

              <StatsCard {...metricCard('appointments',    <IconSchedule />)} />
              <StatsCard {...metricCard('active_patients', <IconPatients />)} />
              <StatsCard {...metricCard('revenue',         <IconTrendUp />)} />
              <StatsCard {...metricCard('expenses',        <IconTrendDown />)} />
            </div>

            {/* O que há para cobrar: vencidos e pendentes, mais antigo primeiro. */}
            <BillingCard />

            {/* Linha 2: tarefas à esquerda, os dois gráficos empilhados à direita
                — como são a MESMA célula do grid, terminam na mesma altura. */}
            <TasksCard />
            <div className={styles.graficos}>
              <AppointmentsChart />
              <FinanceChart />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
