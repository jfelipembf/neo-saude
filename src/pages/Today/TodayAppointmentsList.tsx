import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppointmentModal } from '@/components/AppointmentModal/AppointmentModal'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Table, type TableColumn } from '@/components/Table/Table'
import { IconUser } from '@/components/icons'
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

  // CADA ESPECIALIDADE ENTRA NA SUA TELA a partir daqui — as três em tela
  // cheia, com a mesma casca (menu lateral no desktop, barra inferior no PWA)
  // e listas de seção diferentes. Rota própria para cada uma, e não a mesma com
  // um `?tipo=`: isso faria a página decidir em tempo de render qual delas é.
  //
  // A feature é sempre 'patients' — é ela que protege o prontuário por RLS; o
  // recorte por ramo aqui é só UX.
  const showConsultaAction = specialty === 'medicine' && canView('patients')
  const showSessaoAction = specialty === 'physiotherapy' && canView('patients')
  // Odontologia mostra DOIS botões: o atendimento (como as outras) e o atalho
  // para a ferramenta do odontograma, que existe solta para consulta rápida
  // sem abrir atendimento.
  const showOdontoActions = specialty === 'dentistry' && canView('patients')

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
          {/* UM caminho só. Havia dois botões aqui — "Odonto IA" abrindo a
              ferramenta solta e "Iniciar atendimento" abrindo uma segunda tela
              de atendimento — e eram duas telas diferentes para o mesmo
              paciente, com seções repetidas em ambas. Hoje o atendimento
              odontológico É a tela do odontograma: o mapa dentário é a primeira
              seção do menu dela, e as demais (anamnese, tratamentos,
              orçamentos, prescrições, documentos) ficam ao lado.

              Leva o PACIENTE e o AGENDAMENTO: o primeiro carrega a ficha, o
              segundo é o que permite marcar a consulta como em atendimento
              agora e concluída no fim — sem ele a fila desta tela não saberia
              que o paciente já sentou na cadeira. */}
          <Button
            size="sm"
            onClick={e => {
              e.stopPropagation()
              navigate(`${FULLSCREEN_ROUTES.ODONTOGRAM}?patient=${a.patientId}&atendimento=${a.id}`)
            }}
          >
            Iniciar atendimento
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
