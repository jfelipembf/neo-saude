import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Calendar } from '@/components/Calendar/Calendar'
import { toIsoDate } from '@/utils/date'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { PageLoader } from '@/components/PageLoader/PageLoader'
import { RemindersCard } from '@/components/RemindersCard/RemindersCard'
import { AppointmentsChart } from '@/components/AppointmentsChart/AppointmentsChart'
import { FinanceChart } from '@/components/FinanceChart/FinanceChart'
import { StatsCard } from '@/components/StatsCard/StatsCard'
import { LeadsKanban } from '@/components/LeadsKanban/LeadsKanban'
import { useConsultasDoDia, useSetStatusConsulta } from '@/hooks/useConsultas'
import {
  IconDashboard, IconRelogio, IconCheck, IconX,
  IconAgenda, IconPacientes, IconTendenciaAlta, IconTendenciaBaixa, IconKanban,
} from '@/components/icons'
import { APP_ROUTES } from '@/constants'
import type { Appointment } from '@/types/domain'
import styles from './DashboardPage.module.scss'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: consultas, isLoading } = useConsultasDoDia()
  const { mutate: setStatus } = useSetStatusConsulta()
  const [visao, setVisao] = useState<'dashboard' | 'kanban'>('dashboard')

  const hoje = new Date()
  const hojeIso = toIsoDate(hoje)
  const hojeLabel = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  const pacientesDoDia = consultas ?? []
  const noKanban = visao === 'kanban'

  // Clicar no círculo já ativo desfaz a marcação (volta para "agendada").
  function marcarPresenca(c: Appointment, compareceu: boolean) {
    const alvo = compareceu ? 'concluida' : 'faltou'
    setStatus({ id: c.id, status: c.status === alvo ? 'agendada' : alvo })
  }

  return (
    <>
      <PageHeader
        title={noKanban ? 'Kanban' : 'Dashboard'}
        icon={noKanban ? <IconKanban /> : <IconDashboard />}
        actions={
          <Button
            variant="ghost"
            size="sm"
            iconLeft={noKanban ? <IconDashboard /> : <IconKanban />}
            onClick={() => setVisao(noKanban ? 'dashboard' : 'kanban')}
            title={noKanban ? 'Ver dashboard' : 'Ver kanban'}
            aria-label={noKanban ? 'Alternar para o dashboard' : 'Alternar para o kanban'}
          />
        }
      />

      {/* O cabeçalho fica sempre no lugar; só o conteúdo troca pelo loader. */}
      {isLoading ? (
        <PageLoader />
      ) : noKanban ? (
        // Funil de contatos: Novos contatos → Agendamento → Converteu / Perdeu.
        <LeadsKanban />
      ) : (
        <div className={styles.grid}>
          <div className={styles.colEsquerda}>
            <section className={styles.agendaCard}>
              <header className={styles.agendaHeader}>
                <div>
                  <h2 className={styles.agendaTitle}>Agenda do dia</h2>
                  <p className={styles.agendaDate}>{hojeLabel}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate(APP_ROUTES.AGENDA)}>
                  Ver agenda
                </Button>
              </header>

              <Calendar markedDates={[hojeIso]} />

              <h3 className={styles.listTitle}>Pacientes de hoje</h3>
              <ul className={styles.list}>
                {pacientesDoDia.length === 0 && (
                  <li className={styles.emptyItem}>Nenhum paciente agendado para hoje.</li>
                )}
                {pacientesDoDia.map(c => (
                  <li key={c.id} className={styles.item}>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemPaciente}>{c.paciente}</span>
                      <span className={styles.itemLine}><IconRelogio /> {c.hora} · {c.atendimento}</span>
                      <Badge status={c.status} className={styles.itemBadge} />
                    </div>

                    <div className={styles.presence}>
                      <button
                        type="button"
                        className={`${styles.circleBtn} ${styles['circleBtn--ok']} ${c.status === 'concluida' ? styles['circleBtn--active'] : ''}`}
                        onClick={() => marcarPresenca(c, true)}
                        title="Compareceu"
                        aria-label={`Marcar que ${c.paciente} compareceu`}
                      >
                        <IconCheck />
                      </button>
                      <button
                        type="button"
                        className={`${styles.circleBtn} ${styles['circleBtn--no']} ${c.status === 'faltou' ? styles['circleBtn--active'] : ''}`}
                        onClick={() => marcarPresenca(c, false)}
                        title="Não compareceu"
                        aria-label={`Marcar que ${c.paciente} não compareceu`}
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
              <StatsCard label="Consultas" value={12}         icon={<IconAgenda />} hint="+15% vs. mês anterior" trend="up" meta={20} />
              <StatsCard label="Pacientes" value={248}        icon={<IconPacientes />} hint="+5% vs. mês anterior"  trend="up" meta={300} />
              <StatsCard label="Ganho"     value="R$ 12.400"  icon={<IconTendenciaAlta />}  hint="+8% vs. mês anterior" trend="up"   meta="R$ 15.000" progresso={83} />
              <StatsCard label="Gastos"    value="R$ 3.180"   icon={<IconTendenciaBaixa />} hint="-3% vs. mês anterior" trend="down" meta="R$ 5.000"  progresso={64} />
            </div>

            <RemindersCard />

            {/* Linha 2 do grid de widgets: barras à esquerda, linhas à direita. */}
            <AppointmentsChart />
            <FinanceChart />
          </div>
        </div>
      )}
    </>
  )
}
