import { useState } from 'react'
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
import { useDayAppointments, useSetAppointmentStatus } from '@/hooks/useAppointments'
import { usePatientName } from '@/hooks/useDisplayNames'
import {
  IconDashboard, IconClock, IconCheck, IconX,
  IconSchedule, IconPatients, IconTrendUp, IconTrendDown, IconKanban,
} from '@/components/icons'
import { APP_ROUTES } from '@/constants'
import type { Appointment } from '@/types/domain'
import styles from './DashboardPage.module.scss'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: appointments, isLoading } = useDayAppointments()
  const patientName = usePatientName()
  const { mutate: setStatus } = useSetAppointmentStatus()
  const [view, setView] = useState<'dashboard' | 'kanban'>('dashboard')

  const today = new Date()
  const todayIso = toIsoDate(today)
  const todayLabel = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  const todaysPatients = appointments ?? []
  const isKanban = view === 'kanban'

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
            {/* Valores de demonstração até existir o service de indicadores. */}
            <div className={styles.statsGrid}>
              <StatsCard label="Consultas" value={12}         icon={<IconSchedule />} hint="+15% vs. mês anterior" trend="up" meta={20} />
              <StatsCard label="Pacientes" value={248}        icon={<IconPatients />} hint="+5% vs. mês anterior"  trend="up" meta={300} />
              <StatsCard label="Ganho"     value="R$ 12.400"  icon={<IconTrendUp />}  hint="+8% vs. mês anterior" trend="up"   meta="R$ 15.000" progress={83} />
              <StatsCard label="Gastos"    value="R$ 3.180"   icon={<IconTrendDown />} hint="-3% vs. mês anterior" trend="down" meta="R$ 5.000"  progress={64} />
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
