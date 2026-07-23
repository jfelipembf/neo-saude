import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Calendar } from '@/components/Calendar/Calendar'
import { localDate, toIsoDate } from '@/utils/date'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { BillingCard } from '@/components/BillingCard/BillingCard'
import { TasksCard } from '@/components/TasksCard/TasksCard'
import { AppointmentsChart } from '@/components/AppointmentsChart/AppointmentsChart'
import { FinanceChart } from '@/components/FinanceChart/FinanceChart'
import { StatsCard } from '@/components/StatsCard/StatsCard'
import { LeadsKanban } from '@/components/LeadsKanban/LeadsKanban'
import { useDashboardStats, useSetAppointmentStatus } from '@/hooks/useAppointments'
import { useAgendaAppointments } from '@/hooks/useSchedule'
import { usePatientName } from '@/hooks/useDisplayNames'
import {
  IconDashboard, IconClock, IconCheck, IconX, IconBan,
  IconSchedule, IconTrendUp, IconTrendDown, IconKanban,
} from '@/components/icons'
import {
  APP_ROUTES, GOAL_METRIC_LABEL, GOAL_METRIC_IS_MONEY, GOAL_METRIC_HIGHER_IS_BETTER,
} from '@/constants'
import { formatBRL, formatPercent } from '@/utils/format'
import { goalProgress, percentChange } from '@/utils/metrics'
import type { AgendaAppointment, AppointmentStatus, GoalMetric } from '@/types/domain'
import styles from './DashboardPage.module.scss'

// Rótulos do card "Agenda do dia" — o vocabulário que o dono usa (presente/
// ausente), sem mexer no statusMap global do Badge.
const DAY_STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  in_service: 'Em atendimento',
  completed: 'Presente',
  no_show: 'Ausente',
  canceled: 'Cancelado',
}

export function DashboardPage() {
  const navigate = useNavigate()
  const today = new Date()
  const todayIso = toIsoDate(today)

  // O card "Agenda do dia" é LIGADO à agenda: clicar num dia do calendário
  // mostra as consultas daquele dia com o status. Uma query de ±6 meses cobre a
  // navegação do calendário inteira (mesma janela da aba do profissional).
  const [selectedDate, setSelectedDate] = useState(todayIso)
  const fromIso = toIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 182))
  const toIso = toIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 182))
  const { data: appointments, isLoading } = useAgendaAppointments(fromIso, toIso)

  // Query própria: os cartões não seguram a agenda no loader (e vice-versa).
  // Enquanto não chega, cada cartão mostra '—' em vez de um zero que seria lido
  // como "o mês está zerado" (ver `metricCard`).
  const { data: stats } = useDashboardStats()
  const patientName = usePatientName()
  const { mutate: setStatus } = useSetAppointmentStatus()
  const [view, setView] = useState<'dashboard' | 'kanban'>('dashboard')

  const selectedLabel = localDate(selectedDate)
    .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  const dayPatients = (appointments ?? [])
    .filter(a => a.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
  // Pontinho no calendário nos dias com consulta (canceladas não marcam).
  const markedDates = [...new Set((appointments ?? []).filter(a => a.status !== 'canceled').map(a => a.date))]
  const isKanban = view === 'kanban'

  /**
   * Monta um cartão de métrica a partir de `metrics` da RPC.
   *
   * O hint é CALCULADO aqui, e só existe quando `percentChange` devolve número:
   * com o mês anterior zerado (clínica no primeiro mês de uso) o cartão sai sem
   * hint, em vez de sair com uma variação inventada. O TOM segue
   * `GOAL_METRIC_HIGHER_IS_BETTER` e não o sinal: gasto subindo é vermelho,
   * gasto caindo é verde.
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

  // Desfecho da consulta (presente/ausente/cancelada) — mesma semântica dos
  // círculos do card da Agenda: clicar no já ativo desfaz (volta a "agendada").
  function markOutcome(c: AgendaAppointment, target: AppointmentStatus) {
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
                  <p className={styles.agendaDate}>{selectedLabel}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate(APP_ROUTES.SCHEDULE)}>
                  Ver agenda
                </Button>
              </header>

              <Calendar
                markedDates={markedDates}
                selected={selectedDate}
                onSelect={setSelectedDate}
              />

              <h3 className={styles.listTitle}>
                {selectedDate === todayIso ? 'Pacientes de hoje' : 'Pacientes do dia'}
              </h3>
              <ul className={styles.list}>
                {dayPatients.length === 0 && (
                  <li className={styles.emptyItem}>
                    {selectedDate === todayIso
                      ? 'Nenhum paciente agendado para hoje.'
                      : 'Nenhum paciente agendado para este dia.'}
                  </li>
                )}
                {dayPatients.map(c => (
                  <li key={c.id} className={styles.item}>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemPaciente}>{patientName(c.patientId)}</span>
                      <span className={styles.itemLine}><IconClock /> {c.startTime} · {c.activity}</span>
                      <Badge status={c.status} label={DAY_STATUS_LABEL[c.status]} className={styles.itemBadge} />
                    </div>

                    <div className={styles.presence}>
                      <button
                        type="button"
                        className={`${styles.circleBtn} ${styles['circleBtn--ok']} ${c.status === 'completed' ? styles['circleBtn--active'] : ''}`}
                        onClick={() => markOutcome(c, 'completed')}
                        title={c.status === 'completed' ? 'Desfazer presença' : 'Presente'}
                        aria-label={`Marcar que ${patientName(c.patientId)} compareceu`}
                        aria-pressed={c.status === 'completed'}
                      >
                        <IconCheck />
                      </button>
                      <button
                        type="button"
                        className={`${styles.circleBtn} ${styles['circleBtn--no']} ${c.status === 'no_show' ? styles['circleBtn--active'] : ''}`}
                        onClick={() => markOutcome(c, 'no_show')}
                        title={c.status === 'no_show' ? 'Desfazer falta' : 'Faltou'}
                        aria-label={`Marcar que ${patientName(c.patientId)} faltou`}
                        aria-pressed={c.status === 'no_show'}
                      >
                        <IconX />
                      </button>
                      <button
                        type="button"
                        className={`${styles.circleBtn} ${styles['circleBtn--cancel']} ${c.status === 'canceled' ? styles['circleBtn--active'] : ''}`}
                        onClick={() => markOutcome(c, 'canceled')}
                        title={c.status === 'canceled' ? 'Reativar consulta' : 'Cancelar consulta'}
                        aria-label={c.status === 'canceled'
                          ? `Reativar a consulta de ${patientName(c.patientId)}`
                          : `Cancelar a consulta de ${patientName(c.patientId)}`}
                        aria-pressed={c.status === 'canceled'}
                      >
                        <IconBan />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className={styles.widgets}>
            {/* ⚠️ NÃO ADICIONE CARTÃO AQUI SEM O DONO PEDIR.
                O Dashboard mostra SOMENTE as métricas QUE TÊM META — as quatro
                de `metrics`, cada uma com meta e com a variação sobre o mês
                anterior CALCULADA aqui. Vêm todas da RPC dashboard_stats, num
                round-trip só.

                Os contadores OPERACIONAIS que ficavam antes destes ("Consultas
                hoje", "A confirmar" e "Pacientes ativos") foram REMOVIDOS A
                PEDIDO DO DONO — ele viu os três na tela e mandou tirar. A
                ausência deles é DELIBERADA, não é regressão: dois agentes já os
                "restauraram" achando que alguém tinha apagado por engano. Se
                bater a vontade de repor, é engano. Com a remoção, a RPC também
                deixou de calcular e de devolver appointments_today,
                pending_confirmations, active_patients e monthly_revenue — repor
                o cartão exigiria despodar o banco junto. */}
            <div className={styles.statsGrid}>
              <StatsCard {...metricCard('appointments_scheduled', <IconSchedule />)} />
              <StatsCard {...metricCard('appointments_completed', <IconCheck />)} />
              <StatsCard {...metricCard('revenue',                <IconTrendUp />)} />
              <StatsCard {...metricCard('expenses',               <IconTrendDown />)} />
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
