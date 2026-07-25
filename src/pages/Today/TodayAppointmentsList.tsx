import { useMemo, useState } from 'react'
import { AppointmentModal } from '@/components/AppointmentModal/AppointmentModal'
import { Badge } from '@/components/Badge/Badge'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Table, type TableColumn } from '@/components/Table/Table'
import { usePatientName } from '@/hooks/useDisplayNames'
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
  const patientName = usePatientName()
  const [selected, setSelected] = useState<ScheduledAppointment | null>(null)

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
    { key: 'activity', label: 'Atendimento', render: a => a.activity },
    {
      key: 'status',
      label: 'Status',
      className: styles.colStatus,
      render: a => <Badge status={a.status} />,
    },
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
