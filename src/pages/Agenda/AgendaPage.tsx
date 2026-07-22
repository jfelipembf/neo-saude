import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Button } from '@/components/Button/Button'
import { ScheduleBoard } from '@/components/ScheduleBoard/ScheduleBoard'
import { AppointmentModal } from '@/components/AppointmentModal/AppointmentModal'
import { IconSchedule, IconPlus } from '@/components/icons'
import type { AgendaAppointment } from '@/types/domain'

export function AgendaPage() {
  // Modal de agendamento: null = fechado; { slot } = edição; {} = novo.
  const [modal, setModal] = useState<{ slot?: AgendaAppointment } | null>(null)

  return (
    <>
      <PageHeader
        title="Agenda"
        icon={<IconSchedule />}
        actions={
          <Button iconLeft={<IconPlus />} onClick={() => setModal({})}>
            Nova consulta
          </Button>
        }
      />

      {/* Grade semanal de horários — clicar num card abre a edição. */}
      <ScheduleBoard onSelect={slot => setModal({ slot })} />

      <AppointmentModal
        open={modal !== null}
        onClose={() => setModal(null)}
        slot={modal?.slot ?? null}
      />
    </>
  )
}
