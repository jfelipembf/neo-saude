import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppointmentModal } from '@/components/AppointmentModal/AppointmentModal'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Table, type TableColumn } from '@/components/Table/Table'
import { IconUser } from '@/components/icons'
import odontoIAIcon from '@/assets/images/icon/odontoIA.png'
import { useSession } from '@/context/SessionProvider'
import { usePatientName } from '@/hooks/useDisplayNames'
import { buildRoute, FULLSCREEN_ROUTES } from '@/constants'
import type { ScheduledAppointment } from '@/types/domain'
import styles from './TodayAppointmentsList.module.scss'

interface TodayAppointmentsListProps {
  appointments: ScheduledAppointment[]
}

/**
 * "Seus atendimentos hoje" — a agenda PESSOAL de quem está logado, dentro da
 * página "Hoje" (que também serve recepção — ver TodayPage). Ao contrário dos
 * 4 quadrados acima (contagem da CLÍNICA inteira por status), esta lista é só
 * do profissional: todo status entra, na ordem em que o dia acontece — é
 * "o que eu tenho pela frente/já tive hoje", não um placar.
 *
 * Clicar na linha abre o MESMO AppointmentModal da grade (ScheduleGrid):
 * mesma tela de sempre para marcar presença/falta ou abrir o prontuário da
 * sessão, sem duplicar esse fluxo aqui.
 */
export function TodayAppointmentsList({ appointments }: TodayAppointmentsListProps) {
  const navigate = useNavigate()
  const patientName = usePatientName()
  const { canView, specialty } = useSession()
  const [selected, setSelected] = useState<ScheduledAppointment | null>(null)

  // Mesma feature que protege a leitura do odontograma por RLS ('patients') +
  // o gate de especialidade (só faz sentido em odontologia) — ver comment do
  // showOdontogram em Header.tsx.
  const showOdontoActions = specialty === 'dentistry' && canView('patients')
  // MEDICINA entra na tela de atendimento (tela cheia) a partir daqui — é o
  // caminho de entrada dela, como o "Odonto IA" é o da odontologia.
  const showConsultaAction = specialty === 'medicine' && canView('patients')
  // FISIOTERAPIA tem a sua: mesma tela cheia, com menu de seções próprio.
  // Rota própria (`/fisio`), não a mesma com um parâmetro — as duas telas têm
  // centro e painéis diferentes, e um `?tipo=` faria a página decidir em tempo
  // de render qual delas é.
  const showSessaoAction = specialty === 'physiotherapy' && canView('patients')

  // Mais cedo primeiro — é a ordem em que o profissional vai VIVER o dia.
  const sorted = useMemo(
    () => [...appointments].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [appointments],
  )

  const columns: TableColumn<ScheduledAppointment>[] = [
    {
      key: 'time',
      label: 'Horário',
      className: styles.colHorario,
      render: a => <span className={styles.horario}>{a.startTime}–{a.endTime}</span>,
    },
    {
      key: 'patient',
      label: 'Paciente',
      render: a => <span className={styles.paciente}>{patientName(a.patientId)}</span>,
    },
    { key: 'activity', label: 'Atendimento', hideOnMobile: true, render: a => a.activity },
    {
      key: 'status',
      label: 'Status',
      className: styles.colStatus,
      render: a => <Badge status={a.status} />,
    },
    ...(showConsultaAction ? [{
      key: 'actions',
      label: 'Ações',
      render: (a: ScheduledAppointment) => (
        <span className={styles.acoes}>
          <Button
            variant="outline"
            size="sm"
            iconLeft={<IconUser />}
            onClick={e => { e.stopPropagation(); navigate(buildRoute.patientProfile(a.patientId)) }}
          >
            Perfil
          </Button>
          <Button
            size="sm"
            onClick={e => {
              e.stopPropagation()
              navigate(`${FULLSCREEN_ROUTES.CONSULTATION}?consulta=${a.id}`)
            }}
          >
            Iniciar atendimento
          </Button>
        </span>
      ),
    }] : []),
    ...(showSessaoAction ? [{
      key: 'actions',
      label: '',
      render: (a: ScheduledAppointment) => (
        <span className={styles.acoes}>
          <Button
            size="sm"
            variant="outline"
            iconLeft={<IconUser />}
            onClick={e => { e.stopPropagation(); navigate(buildRoute.patientProfile(a.patientId)) }}
          >
            Perfil
          </Button>
          <Button
            size="sm"
            onClick={e => {
              e.stopPropagation()
              navigate(`${FULLSCREEN_ROUTES.FISIO}?sessao=${a.id}`)
            }}
          >
            Iniciar sessão
          </Button>
        </span>
      ),
    }] : []),
    ...(showOdontoActions ? [{
      key: 'actions',
      label: 'Ações',
      render: (a: ScheduledAppointment) => (
        <span className={styles.acoes}>
          <Button
            variant="outline"
            size="sm"
            iconLeft={<IconUser />}
            onClick={e => { e.stopPropagation(); navigate(buildRoute.patientProfile(a.patientId)) }}
          >
            Perfil
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconLeft={<img src={odontoIAIcon} alt="" className={styles.odontoIcon} />}
            onClick={e => { e.stopPropagation(); navigate(`${FULLSCREEN_ROUTES.ODONTOGRAM}?patient=${a.patientId}`) }}
          >
            Odonto IA
          </Button>
        </span>
      ),
    }] : []),
  ]

  return (
    <section className={styles.secao}>
      <h2 className={styles.titulo}>Seus atendimentos hoje</h2>

      {sorted.length === 0 ? (
        <EmptyState
          title="Nenhum atendimento hoje"
          description="Sua agenda está livre por hoje."
        />
      ) : (
        <Table
          columns={columns}
          data={sorted}
          rowKey={a => a.id}
          onRowClick={setSelected}
          emptyMessage="Nenhum atendimento hoje."
        />
      )}

      <AppointmentModal open={selected !== null} onClose={() => setSelected(null)} slot={selected} />
    </section>
  )
}
